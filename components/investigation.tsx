'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { Study, VariableId } from '../lib/study';

type AnnualStudy = Omit<Study, 'variables'> & { variables: Omit<Study['variables'][number], 'monthly'>[] };
const Skeleton = () => <div className="field-plot field-skeleton" role="status">Loading chart…</div>;
const Chart = dynamic(() => import('./evidence-chart'), { ssr: false, loading: Skeleton });
const Map = dynamic(() => import('./study-map').then(module => module.StudyMap), { ssr: false });
const colors = ['#286750', '#65548b', '#176b86'];
const dashes = [undefined, '6 4', '2 3'];
const probability = (value: number) => value < .001 ? value.toExponential(2) : value.toFixed(5);
const signed = (value: number, unit: string) =>
  (value < 0 ? '−' : value > 0 ? '+' : '') + Math.abs(value).toFixed(unit === '°C' ? 3 : 2);

export function Investigation({ studies, initialLocation }: { studies: AnnualStudy[]; initialLocation: string }) {
  const [location, setLocation] = useState(initialLocation);
  const [id, setId] = useState<VariableId>('T2M');
  const [year, setYear] = useState(2025);
  const [hover, setHover] = useState<number>();
  const [playing, setPlaying] = useState(false);
  const [showTrend, setShowTrend] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [guide, setGuide] = useState<number | null>(null);
  const [monthly, setMonthly] = useState<{ key: string; rows: Study['variables'][number]['monthly'] }>();
  const [monthState, setMonthState] = useState<'idle' | 'loading' | 'error'>('idle');
  const request = useRef<AbortController | null>(null);
  const timeline = useRef<HTMLDivElement>(null);
  const geography = useRef<HTMLElement>(null);
  const study = studies.find(item => item.id === location)!;
  const variable = study.variables.find(item => item.id === id)!;
  const { trend, unit } = variable;
  const start = variable.annual[0].year;
  const end = variable.annual.at(-1)!.year;
  const reading = variable.annual.find(row => row.year === year)!;
  const hovered = variable.annual.find(row => row.year === hover);
  const slope = signed(trend.slopePerDecade, unit);
  const warming = unit === '°C' && trend.significant && trend.slopePerDecade > 0;
  const title = warming ? `${study.name}’s warming record` : `${study.name}’s ${unit === 'mm' ? 'precipitation' : 'temperature'} record`;
  const status = trend.significant ? `Statistically significant ${trend.slopePerDecade > 0 ? 'increase' : 'decrease'}` : 'Not statistically significant';
  const comparison = studies.map((site, i) => ({
    site, variable: site.variables.find(item => item.id === id)!, color: colors[i], dash: dashes[i],
  }));
  const regionalRows = variable.annual.map(({ year }, i) => ({
    year, ...Object.fromEntries(comparison.map(item => [item.site.id, item.variable.annual[i].value])),
  }));
  const monthlyKey = `${location}:${id}`;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      const next = year + 1;
      setYear(next);
      if (next >= end) setPlaying(false);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [playing, year, end]);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === timeline.current && !entry.isIntersecting) setPlaying(false);
        if (entry.target === geography.current && entry.isIntersecting) {
          setMapReady(true);
          observer.unobserve(entry.target);
        }
      }
    }, { rootMargin: '0px 0px 72px' });
    if (timeline.current) observer.observe(timeline.current);
    if (geography.current) observer.observe(geography.current);
    const pauseHidden = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', pauseHidden);
      request.current?.abort();
    };
  }, []);

  function changeSelection() {
    setPlaying(false);
    setHover(undefined);
    request.current?.abort();
    setMonthState('idle');
  }

  function selectLocation(next: string) {
    changeSelection();
    setLocation(next);
    const url = new URL(window.location.href);
    url.searchParams.set('location', next);
    window.history.replaceState(null, '', url);
  }

  function selectYear(next: number) {
    if (next < start || next > end || !Number.isInteger(next)) return;
    setPlaying(false);
    setYear(next);
  }

  async function loadMonthly() {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setMonthState('loading');
    try {
      const response = await fetch(`/api/studies/${encodeURIComponent(location)}`, { signal: controller.signal });
      if (!response.ok) throw new Error('Monthly study unavailable');
      const data: Study = await response.json();
      const rows = data.variables.find(item => item.id === id)?.monthly;
      if (data.id !== location || !rows || rows.length !== study.completeness.months) throw new Error('Invalid monthly data');
      if (controller.signal.aborted) return;
      setMonthly({ key: monthlyKey, rows });
      setMonthState('idle');
    } catch {
      if (!controller.signal.aborted) setMonthState('error');
    }
  }

  const stops = [
    ['Annual observations', 'Use the year slider or chart to inspect a recorded annual value.', '#annual'],
    ['Trend and uncertainty', 'Review the slope estimate, interval and significance for the selected series.', '#trend'],
    ['Sources and limitations', 'Open the source record to trace the retrievals and understand the model grid.', '#provenance'],
  ];

  return <div className="field-study" onPointerDown={event => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-playback]')) setPlaying(false);
    }} onKeyDown={event => {
      if (event.key === 'Escape') { setGuide(null); setPlaying(false); }
    }}>
    <header className="field-header">
      <div className="field-shell">
        <p className="field-kicker">Study {String(studies.indexOf(study) + 1).padStart(2, '0')} / {study.region} / {start}–{end}</p>
        <h1>{title}</h1>
        <p className="field-lead">{warming
          ? `${variable.name} increased by ${Math.abs(trend.slopePerDecade).toFixed(3)} °C per decade.`
          : `${variable.name} · ${slope} ${unit} per decade. ${status}.`}</p>
        <p className="field-meta">{study.source} · {study.product} / {study.latitude.toFixed(2)}° N, {study.longitude.toFixed(2)}° E</p>
      </div>
    </header>
    <div className="field-shell field-content">
      <div className="field-selectors">
        <fieldset><legend>Study location</legend><div className="field-options locations">
          {studies.map(site => <button key={site.id} type="button" aria-pressed={site.id === location}
            onClick={() => selectLocation(site.id)}>{site.name}</button>)}
        </div></fieldset>
        <fieldset><legend>Environmental variable</legend><div className="field-options variables">
          {study.variables.map(item => <button key={item.id} type="button" aria-label={item.name} aria-pressed={item.id === id}
            onClick={() => { changeSelection(); setId(item.id); }}>{item.short}</button>)}
        </div></fieldset>
      </div>

      <button type="button" className="field-link" aria-expanded={guide !== null} onClick={() => setGuide(guide === null ? 0 : null)}>Guided evidence walkthrough</button>
      {guide !== null && <aside className="field-guide" aria-label="Evidence walkthrough">
        <p aria-live="polite"><strong>{guide + 1} / {stops.length} · {stops[guide][0]}</strong> {stops[guide][1]}</p>
        <a href={stops[guide][2]}>Go to section</a>
        <button type="button" onClick={() => setGuide(guide + 1 < stops.length ? guide + 1 : null)}>{guide + 1 < stops.length ? 'Next' : 'Finish'}</button>
        <button type="button" onClick={() => setGuide(null)}>Skip walkthrough</button>
      </aside>}

      <div className="field-evidence">
        <section id="annual" className="field-panel" aria-labelledby="annual-title">
          <p className="field-kicker">Annual observations / {unit}</p>
          <h2 id="annual-title">{variable.name}</h2>
          <label className="check"><input type="checkbox" checked={showTrend} onChange={event => setShowTrend(event.target.checked)} /> Sen trend line</label>
          <div onMouseLeave={() => setHover(undefined)}>
            <Chart rows={variable.annual.map(row => ({
              year: row.year, value: row.value, fitted: trend.intercept + trend.slopePerYear * (row.year - start),
            }))} series={[
              { key: 'value', name: 'Annual value', color: colors[0] },
              ...(showTrend ? [{ key: 'fitted', name: 'Sen trend', color: colors[1], dash: '6 4' }] : []),
            ]} unit={unit} year={year} selectYear={selectYear} inspectYear={next => { setPlaying(false); setHover(next); }} />
          </div>
          <div className="field-timeline" ref={timeline}>
            <input aria-label="Observation year" type="range" min={start} max={end} step={1} value={year}
              aria-valuetext={`${year}, ${reading.value.toFixed(2)} ${unit}`}
              onChange={event => selectYear(Number(event.target.value))} />
            <div className="field-years"><span>{start}</span><span>{end}</span></div>
            <div className="field-reading">
              <button data-playback type="button" onClick={() => {
                if (!playing && year === end) setYear(start);
                setHover(undefined);
                setPlaying(!playing);
              }}>{playing ? 'Pause' : '▶ Play'}</button>
              <output aria-live={playing ? 'off' : 'polite'}>{year} · {reading.value.toFixed(2)} {unit}</output>
              {hovered && hovered.year !== year && <span>Hover {hovered.year} · {hovered.value.toFixed(2)} {unit}</span>}
            </div>
          </div>
          <details><summary>View annual values</summary>
            <div className="table-scroll"><table><caption>{study.name} · {variable.name} ({unit})</caption>
              <thead><tr><th scope="col">Year</th><th scope="col">Annual value</th></tr></thead>
              <tbody>{variable.annual.map(row => <tr key={row.year}><th scope="row">{row.year}</th><td>{row.value.toFixed(2)}</td></tr>)}</tbody>
            </table></div>
          </details>
          <details><summary>Monthly detail</summary>
            {monthly?.key === monthlyKey ? <>
              {variable.originalUnit !== unit && <p>Monthly values are reported in the source unit, {variable.originalUnit}.</p>}
              <div className="table-scroll"><table><caption>{study.name} · {variable.name} ({variable.originalUnit})</caption>
                <thead><tr><th scope="col">Month</th><th scope="col">Source value</th></tr></thead>
                <tbody>{monthly.rows.map(row => <tr key={`${row.year}-${row.month}`}><th scope="row">{row.year}-{String(row.month).padStart(2, '0')}</th><td>{row.value}</td></tr>)}</tbody>
              </table></div>
            </> : <>
              {monthState === 'error' && <p role="alert">Monthly values could not be loaded.</p>}
              <button type="button" disabled={monthState === 'loading'} onClick={loadMonthly}>
                {monthState === 'loading' ? 'Loading monthly values…' : monthState === 'error' ? 'Retry monthly values' : 'Load monthly values'}
              </button>
            </>}
          </details>
        </section>

        <section id="trend" className="field-panel field-trend" aria-labelledby="trend-title">
          <p className="field-kicker">Sen slope / full record</p>
          <h2 id="trend-title">{slope} {unit}</h2>
          <p><strong>Per decade · {status}</strong></p>
          <dl>
            <div><dt>Hamed–Rao p</dt><dd>{probability(trend.hamedRao.p)}</dd></div>
            <div><dt>Holm-adjusted p</dt><dd>{probability(trend.adjustedP)}</dd></div>
            <div><dt>Approx. 95% slope interval</dt><dd>{trend.interval.perDecade.map(value => signed(value, unit)).join(' to ')} {unit}/decade</dd></div>
          </dl>
          <SlopeInterval interval={trend.interval.perDecade} estimate={trend.slopePerDecade} />
          <p className="field-meta">Moving-block bootstrap · {trend.interval.blockLength}-year blocks. The interval describes uncertainty in the slope.</p>
          {id === 'PRECTOTCORR' && <p>{study.methodology.precipitation}</p>}
          <details><summary>What makes a trend significant?</summary><p>The Holm-adjusted p-value is compared with {study.methodology.alpha}. The correction covers the three outcomes tested at this site.</p></details>
        </section>
      </div>

      <section className="field-panel field-compare" aria-labelledby="compare-title">
        <p className="field-kicker">Regional comparison / {variable.short}</p>
        <h2 id="compare-title">Compare the three records</h2>
        <Chart rows={regionalRows} series={comparison.map(item => ({
          key: item.site.id, name: item.site.name, color: item.color, dash: item.dash,
        }))} unit={unit} />
        <ul>{comparison.map(item => <li key={item.site.id}>
          <strong style={{ color: item.color }}>{item.site.name}</strong> {signed(item.variable.trend.slopePerDecade, unit)} {unit}/decade
        </li>)}</ul>
        <p className="field-meta">{start}–{end} · Shared {unit} scale. The comparison describes the three records. Each site has its own trend tests.</p>
      </section>

      <section ref={geography} className="field-panel field-geography" aria-labelledby="geography-title">
        <p className="field-kicker">Sampling geography / MapLibre</p>
        <h2 id="geography-title">{study.name} sampling point</h2>
        {mapReady ? <Map key={location} study={study} /> : <div className="map map-placeholder">Map loads near this section.</div>}
        <p className="field-meta">{study.latitude.toFixed(2)}° N / {study.longitude.toFixed(2)}° E · {study.grid.latitude}° latitude × {study.grid.longitude}° longitude native grid spacing.</p>
      </section>

      <section className="field-panel field-sources" id="provenance" aria-labelledby="source-title">
        <p className="field-kicker">Evidence and limitations</p><h2 id="source-title">Follow the source</h2>
        <details><summary>NASA retrievals and SHA‑256</summary>
          <p>{study.source} · {study.product}. {study.completeness.months} complete months, {study.completeness.missing} missing.</p>
          <ul>{study.provenance.map(file => <li key={file.sha256}><a href={file.url}>{file.bodyFile} ↗</a><br /><time>{file.retrievedAt}</time><br /><code>{file.sha256}</code></li>)}</ul>
        </details>
        <details id="method"><summary>Methods and bootstrap uncertainty</summary><p>{variable.description}</p><p>{study.methodology.analysis}</p><p>{study.methodology.interval}</p></details>
        <details><summary>Model grid and limits of inference</summary><p>{study.methodology.limits}</p></details>
      </section>
    </div>
  </div>;
}
function SlopeInterval({ interval: [low, high], estimate }: { interval: [number, number]; estimate: number }) {
  const min = Math.min(0, low, estimate);
  const max = Math.max(0, high, estimate);
  const position = (value: number) => 14 + 212 * (value - min) / (max - min || 1);
  return <svg className="slope-interval" viewBox="0 0 240 33" role="img"
    aria-label="Dot marks the estimated slope, solid bar marks its 95% interval, and dashed tick marks zero">
    <line x1="14" x2="226" y1="13" y2="13" stroke="#a9beb1" />
    <line x1={position(0)} x2={position(0)} y1="3" y2="22" stroke="#425b54" strokeDasharray="2 2" />
    <line x1={position(low)} x2={position(high)} y1="13" y2="13" stroke="#0b785e" strokeWidth="3" />
    <circle cx={position(estimate)} cy="13" r="5" fill="#0b785e" stroke="#fff" />
    <text x={position(0)} y="32" textAnchor="middle" fontSize="10" fill="#425b54">0</text>
  </svg>;
}
