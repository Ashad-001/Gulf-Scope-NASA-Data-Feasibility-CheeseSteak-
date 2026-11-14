'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Study, VariableId } from '../lib/study';

const StudyMap = dynamic(() => import('./study-map').then(module => module.StudyMap), {
  ssr: false,
  loading: () => <div className="map map-placeholder">Loading map…</div>,
});
const number = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const probability = (value: number) => value < 0.001 ? value.toExponential(2) : value.toFixed(4);

export function Investigation({ locations }: { locations: { id: string; name: string }[] }) {
  const [location, setLocation] = useState('bahrain');
  const [study, setStudy] = useState<Study | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/studies/${encodeURIComponent(location)}`, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Study unavailable');
        return response.json();
      })
      .then(setStudy)
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [attempt, location]);
  const selectLocation = (id: string) => {
    if (id === location || !locations.some(item => item.id === id)) return;
    setError(false);
    setStudy(null);
    setLocation(id);
  };
  if (error) return <div className="shell state"><h1>Study data unavailable</h1>
    <p role="alert">The verified dataset could not be loaded.</p>
    <button className="action" onClick={() => { setError(false); setAttempt(value => value + 1); }}>Try again</button>
    {location !== 'bahrain' && <button className="action" onClick={() => selectLocation('bahrain')}>Return to Bahrain</button>}</div>;
  if (!study) return <div className="shell state" role="status">Loading verified study data…</div>;
  return <Workspace key={study.id} study={study} locations={locations} selectLocation={selectLocation} />;
}

function Workspace({ study, locations, selectLocation }: {
  study: Study; locations: { id: string; name: string }[]; selectLocation: (id: string) => void;
}) {
  const [id, setId] = useState<VariableId>('T2M');
  const start = study.variables[0].annual[0].year;
  const end = study.variables[0].annual.at(-1)!.year;
  const [first, setFirst] = useState(start);
  const [last, setLast] = useState(end);
  const [showTrend, setShowTrend] = useState(true);
  const variable = study.variables.find(item => item.id === id) ?? study.variables[0];
  const { trend, unit } = variable;
  const rows = variable.annual.filter(row => row.year >= first && row.year <= last);
  const chart = rows.map(row => ({ ...row, fitted: trend.intercept + trend.slopePerYear * (row.year - start) }));
  const slope = `${trend.slopePerDecade > 0 ? '+' : ''}${trend.slopePerDecade.toFixed(unit === '°C' ? 3 : 2)}`;
  const years = variable.annual.map(row => row.year);
  return <>
    <section className="investigate-heading"><div className="shell">
      <p className="eyebrow accent"><span className="signal" /> Earth system investigation</p>
      <h1>{study.name}</h1>
      <p>{study.region} <span className="separator">/</span> {start}–{end} <span className="separator">/</span> {study.source} · {study.product}</p>
    </div></section>
    <div className="shell workspace">
      <div className="controls">
        <label>Study location<select value={study.id} onChange={event => selectLocation(event.target.value)}>{locations.map(item =>
          <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Environmental variable<select value={variable.id} onChange={event => {
          const next = study.variables.find(item => item.id === event.target.value);
          if (next) setId(next.id);
        }}>{study.variables.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      </div>
      <div className="evidence-grid">
        <section className="panel chart-panel" aria-labelledby="series-title">
          <div className="chart-heading">
            <div><p className="eyebrow">Annual observations · {unit}</p><h2 id="series-title">{variable.name}</h2></div>
            <label className="check"><input type="checkbox" checked={showTrend} onChange={event => setShowTrend(event.target.checked)} /> Sen trend line</label>
          </div>
          <div className="chart" aria-label={`${variable.name} in ${unit}, ${first} to ${last}`}>
            <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 310 }}>
              <LineChart data={chart} margin={{ top: 12, right: 15, bottom: 4, left: 0 }} accessibilityLayer>
                <CartesianGrid stroke="#dce6df" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: '#425b54', fontSize: 12 }} minTickGap={24} axisLine={false} tickLine={false} />
                <YAxis width={42} domain={['auto', 'auto']} tick={{ fill: '#425b54', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip isAnimationActive={false} formatter={(value, name) => [`${number.format(Number(value))} ${unit}`, String(name)]} />
                <Line type="linear" name="Annual value" dataKey="value" stroke="#0b785e" strokeWidth={2.2} dot={false} activeDot={{ r: 5 }} isAnimationActive={false} />
                {showTrend && <Line type="linear" name="Sen trend" dataKey="fitted" stroke="#9e542a" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="range">
            <label>From<select value={first} onChange={event => setFirst(Number(event.target.value))}>{years.filter(year => year < last).map(year => <option key={year}>{year}</option>)}</select></label>
            <label>To<select value={last} onChange={event => setLast(Number(event.target.value))}>{years.filter(year => year > first).map(year => <option key={year}>{year}</option>)}</select></label>
            <button onClick={() => { setFirst(start); setLast(end); }}>Reset period</button>
          </div>
          <p className="note">Showing {rows.length} annual values. The fit and statistical tests always use {start}–{end}.</p>
          <details className="data-table"><summary>View annual values</summary>
            <div className="table-scroll"><table><caption>{variable.name} ({unit})</caption><thead><tr><th scope="col">Year</th><th scope="col">Annual value</th></tr></thead>
              <tbody>{rows.map(row => <tr key={row.year}><th scope="row">{row.year}</th><td>{number.format(row.value)}</td></tr>)}</tbody></table></div>
          </details>
        </section>
        <aside className="panel result" aria-labelledby="trend-title">
          <p className="eyebrow" id="trend-title">Sen’s slope</p>
          <p className="slope">{slope}<small> {unit} / decade</small></p>
          <p className="result-status">{trend.significant
            ? `Significant ${trend.slopePerDecade > 0 ? 'upward' : 'downward'} trend`
            : 'No statistically significant trend detected'}</p>
          <dl>
            <div><dt>Approx. 95% slope interval</dt><dd>{trend.interval.perDecade.map(value => value.toFixed(unit === '°C' ? 3 : 2)).join(' to ')} {unit}/decade</dd></div>
            <div><dt>Hamed–Rao p</dt><dd>{probability(trend.hamedRao.p)}</dd></div>
            <div><dt>Holm-adjusted p</dt><dd>{probability(trend.adjustedP)}</dd></div>
            <div><dt>Ordinary MK p</dt><dd>{probability(trend.ordinary.p)}</dd></div>
          </dl>
          <SlopeInterval interval={trend.interval.perDecade} estimate={trend.slopePerDecade} />
          <p>{variable.description}</p>
          {id === 'PRECTOTCORR' && <p className="note sensitivity">{study.methodology.precipitation}</p>}
        </aside>
      </div>
      <div className="support-grid">
        <section className="panel map-panel"><p className="eyebrow">Study geography</p><h2>Where the series applies</h2>
          <StudyMap study={study} />
          <p className="note">The marker shows the requested point. The native grid spacing is {study.grid.latitude}° latitude × {study.grid.longitude}° longitude.</p>
        </section>
        <section className="panel method" id="method"><p className="eyebrow">Reading the evidence</p><h2>Methodology</h2>
          <p>{study.methodology.analysis}</p><p>{study.methodology.interval} The interval expresses uncertainty about the slope.</p>
          <p>{study.methodology.limits}</p>
        </section>
      </div>
      <section className="panel provenance" id="provenance"><p className="eyebrow">Source record</p><h2>NASA data provenance</h2>
        <p>{study.completeness.months} complete months · {study.completeness.years} complete years · {study.completeness.missing} missing months</p>
        <p>{variable.id} · NASA original unit {variable.originalUnit} · Annual chart unit {unit}</p>
        <details><summary>Inspect retrievals and SHA‑256 checksums</summary><ul>
          {study.provenance.map(file => <li key={file.sha256}><a href={file.url}>{file.bodyFile} ↗</a><span>{file.retrievedAt}</span><code>{file.sha256}</code></li>)}
        </ul></details>
      </section>
    </div>
  </>;
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
