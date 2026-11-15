import Link from 'next/link';
import { variables, nativeVariable } from '../lib/series-catalog.mjs';
import { locations, pointDatasets, recordsFor } from '../lib/expanded-series';
import { alpha, commonPeriods, filterYears, minimumYears, selectPeriod, seriesStatus, trendFamily } from '../lib/series-analysis.mjs';
import { SeriesPlots } from './series-plots';
import { OrbitaHero } from './orbita-hero';
import { OrbitaSeriesSelect } from './orbita-series-select';
import { MissionAtlas } from './mission-atlas';
import { bahrainPilot } from '../lib/bahrain-pilot';
import { measurementGroups } from '../lib/measurement-overview.mjs';
import { MeasurementComparison } from './measurement-comparison';
import { ObservationExplanation } from './observation-explanation';

export type SeriesQuery = Record<string, string | string[] | undefined>;
const key = (variable: (typeof variables)[number]) => variable.dataset + ':' + variable.id;
const number = (value: number) => value.toLocaleString('en', { maximumFractionDigits: 4 });
const periodLabel = (period: number) => period > 10000 ? String(period).replace(/^(....)/, '$1-') : String(period);
const precision = (value: number) => value.toPrecision(4);

export function SeriesExplorer({ query }: { query: SeriesQuery }) {
  const overview = measurementGroups.find(group => group.overview === query.series);
  const definition = variables.find(variable => key(variable) === query.series) ?? variables[0];
  const dataset = pointDatasets[definition.dataset as keyof typeof pointDatasets];
  const records = recordsFor(definition);
  const locationIndex = Math.max(0, locations.findIndex(location => location.id === query.location));
  const location = locations[locationIndex];
  const defaultStart = overview ? Math.max(...overview.definitions.map(variable => variable.start)) : definition.start;
  const minYear = overview ? Math.min(...overview.definitions.map(variable => variable.start)) : definition.start;
  const maxYear = overview ? Math.max(...overview.definitions.map(variable => variable.end)) : definition.end;
  const { first, last, valid: usableRange } = selectPeriod(
    overview && (query.first === undefined || query.first === '') ? String(defaultStart) : query.first,
    query.last, minYear, maxYear,
  );
  const monthly = query.resolution === 'monthly';
  const annual = records.map(record => !overview && usableRange && first !== null && last !== null ? filterYears(record.annual, first, last) : []);
  const display = records.map((record, i) => monthly && usableRange && first !== null && last !== null ? filterYears(record.monthly, first, last) : annual[i]);
  const selected = commonPeriods([display[locationIndex]], monthly);
  const comparison = commonPeriods(display, monthly);
  const results = trendFamily(annual);
  const unit = monthly ? definition.monthlyUnit : definition.annualUnit;
  const study = records[locationIndex];
  const target = results[locationIndex];
  const status = seriesStatus(definition.archive, study.monthly.length, study.annual.length);

  const points = locations.map(site => {
    const params = new URLSearchParams({ mode: 'series', location: site.id });
    for (const name of ['first', 'last', 'resolution', 'series']) {
      const value = query[name];
      if (typeof value === 'string' && value) params.set(name, value);
    }
    return { ...site, href: '/investigate?' + params.toString() };
  });

  const grouped = measurementGroups.flatMap(group => group.definitions);
  const families = Object.entries(pointDatasets).map(([id, product]) => ({
    id, name: product.name, variables: variables.filter(variable => variable.dataset === id && !grouped.includes(variable)).map(variable => ({
      key: key(variable), name: variable.name + (['imerg', 'smap'].includes(variable.archive) ? ' — not integrated' : ''),
    })),
  })).filter(family => family.variables.length);
  families.unshift(...measurementGroups.map(group => ({ id: group.id, name: group.name, variables: [
    { key: group.overview, name: 'All measurements' },
    ...group.definitions.map(variable => ({ key: key(variable), name: variable.id === 'PRECTOTCORR' ? 'NASA POWER corrected precipitation' : variable.name })),
  ] })));
  const showNativeCell = location.id === 'bahrain' && (overview
    ? overview.id === 'air-temperature' : ['T2M', 'T2M_MIN_AVG', 'T2M_MAX_AVG'].includes(definition.id));
  const plotProps = { location, unit, monthly, sites: locations, selected, comparison };

  return <div className="field-study mission-workspace orbita-desk">
    <OrbitaHero scene="gulf" chapter="03 / The Field Desk" title={<><span className="orbita-desktop-title">Explore the evidence.</span><span className="orbita-mobile-title">Investigate a<br /> changing Gulf.</span></>}
      description="Choose a point, a signal, and a period. The findings stay traceable." note="NASA POWER / Point records" />
    <div className="orbita-width field-content">
      <form key={JSON.stringify(query)} action="/investigate" className="mission-console">
        <span className="mission-meta">01 / Select your record</span>
        <div className="mission-console-fields">
        <input type="hidden" name="mode" value="series" />
        <p><label>Study point <select name="location" defaultValue={location.id}>{locations.map(site =>
          <option key={site.id} value={site.id}>{site.name}</option>)}</select></label></p>
        <OrbitaSeriesSelect families={families} selected={overview?.overview ?? key(definition)} />
        <fieldset className="orbita-period"><legend>Start / End</legend>
          <input aria-label="First year" name="first" type="number" min={1981} max={2025} defaultValue={!query.first ? '' : first ?? ''} placeholder={String(defaultStart)} />
          <input aria-label="Last year" name="last" type="number" min={1981} max={2025} defaultValue={!query.last ? '' : last ?? ''} placeholder={String(definition.end)} />
        </fieldset>
        <p><label>Resolution <select name="resolution" defaultValue={monthly ? 'monthly' : 'annual'}>
          <option value="annual">Annual</option><option value="monthly">Monthly</option>
        </select></label></p>
        <button className="mission-action" type="submit">Apply selection <span aria-hidden="true">↗</span></button></div>
        <p>Leave the years blank to use the default coverage. All precipitation measurements default to the shared years 2001–2025.</p>
      </form>
      {overview ? <section className="mission-evidence" aria-labelledby="series-evidence">
        <header className="mission-finding">
          <span className="mission-meta">02 / Read the finding</span>
          <h2 id="series-evidence">{location.name} / {overview.name}</h2>
          {showNativeCell && <p><Link href="/investigate?mode=native-cell">See the native grid cell</Link> · NASA grid-cell sampling pilot, February–March 2025.</p>}
        </header>
        {usableRange && first !== null && last !== null
          ? <MeasurementComparison group={overview} locationIndex={locationIndex} first={first} last={last} monthly={monthly} />
          : <p role="status">Choose an ordered range within {minYear}–{maxYear}.</p>}
      </section> : <section className="mission-evidence" aria-labelledby="series-evidence">
        <header className="mission-finding">
        <span className="mission-meta">02 / Read the finding · {usableRange ? first + '–' + last : 'Check period'}</span>
        <h2 id="series-evidence">{location.name} / {definition.name}</h2>
        <p className="orbita-label">Requested point record · {annual[locationIndex].length} complete annual values</p>
        <p>{dataset.provider} · {dataset.product} · {dataset.resolution}. {dataset.sampling}</p>
        <p>Requested point: {location.latitude}° N, {location.longitude}° E. {dataset.caveat}</p>
        {study.cellCentre && <p>Sampled archive cell centre: {study.cellCentre[0].toFixed(5)}° N, {study.cellCentre[1].toFixed(5)}° E.</p>}
        {definition.archive === 'smap-daily' && <p>March 2015 is partial. One missing day excludes September and the annual mean for 2025; the other complete months remain visible.</p>}
        {showNativeCell && <p><Link href="/investigate?mode=native-cell">See the native grid cell</Link> · NASA grid-cell sampling pilot, February–March 2025.</p>}
        </header>
        <div className="orbita-finding-grid">
        <SeriesPlots {...plotProps} kind="observation" />
        <aside className="orbita-interpretation">
        <p className="orbita-label">Statistical interpretation</p>
        {monthly && <p>Monthly chart; any trend statistics are calculated from complete annual values.</p>}
        {!usableRange && <p role="status">Choose an ordered range within {definition.start}–{definition.end}.</p>}
        {status === 'Not integrated' && <p role="status"><strong>Not integrated.</strong> The archived POWER probe returned no valid readings. This does not establish that the underlying mission product has no data at this location.</p>}
        {usableRange && status !== 'Not integrated' && selected.length === 0 && <p role="status">No complete {monthly ? 'monthly' : 'annual'} observations in the selected period.</p>}
        {target.estimate ? <div className="mission-finding-stat">
          <p className="mission-slope">{precision(target.estimate.slopePerDecade)} <small>{definition.annualUnit} / decade</small></p>
          <div><p><strong>{target.status}.</strong> Slope direction: {target.estimate.direction}. A trend does not establish causation.</p>
          <dl>
            <dt>Trend sample</dt><dd>{target.estimate.n} complete annual values · {annual[locationIndex][0].year}–{annual[locationIndex].at(-1)!.year}</dd>
            <dt>Approx. 95% slope interval</dt><dd>{target.estimate.interval.perDecade.map(precision).join(' to ')} {definition.annualUnit} / decade</dd>
            <dt>Holm-adjusted p (α = {alpha})</dt><dd>{target.adjustedP === null ? 'Not estimable' : precision(target.adjustedP)}</dd>
            <dt>NASA source</dt><dd><a href={study.provenance[0].url}>{dataset.provider} · {definition.id} source ↗</a></dd>
            <dt>Bootstrap settings</dt><dd>{target.estimate.interval.blockLength}-year blocks · {target.estimate.interval.replicates.toLocaleString('en')} replicates · seed {target.estimate.interval.seed}</dd>
          </dl></div>
        </div> : usableRange && status !== 'Not integrated' &&
          <div><p>Trend not evaluated: {annual[locationIndex].length} complete annual values in this window. {target.eligibility === 'gap' ?
            'The annual record is not consecutive.' : `At least ${minimumYears} consecutive complete years are required.`}</p>
            <p><a href={study.provenance[0].url}>{dataset.provider} · {definition.id} source ↗</a></p></div>}
        </aside>
        </div>
        {usableRange && first !== null && last !== null && <ObservationExplanation
          measurements={[{ definition, displayed: display[locationIndex], record: study, years: annual[locationIndex], trend: target, unit }]}
          location={location} first={first} last={last} monthly={monthly} />}
        <nav className="orbita-evidence-links" aria-label="Evidence sections">
          {comparison.length > 0 && <a href="#regional-comparison">Compare six sites</a>}
          {selected.length > 0 && <a href="#observed-values">View data table</a>}
          <a href="#series-method">Methods</a><a href="#series-provenance">Provenance</a>
        </nav>
        <SeriesPlots {...plotProps} kind="comparison" />
        {comparison.length > 0 && <p>Shared comparison coverage: {periodLabel(comparison[0].period)} to {periodLabel(comparison.at(-1)!.period)} ({comparison.length} common periods, {unit}).</p>}
        <details className="mission-disclosure" id="series-method"><summary>Statistical evidence and method</summary>
        <div className="table-scroll"><table>
          <caption>Selected-period coverage and annual trend evidence</caption>
          <thead><tr><th scope="col">Location</th><th scope="col">Displayed values</th><th scope="col">Complete years</th><th scope="col">Slope ({definition.annualUnit}/decade)</th><th scope="col">Approx. 95% interval</th><th scope="col">Holm-adjusted p</th><th scope="col">Assessment</th></tr></thead>
          <tbody>{locations.map((site, i) => {
            const result = results[i];
            return <tr key={site.id}><th scope="row">{site.name}</th><td>{display[i].length}</td><td>{annual[i].length}</td>
              <td>{result.estimate ? precision(result.estimate.slopePerDecade) : '—'}</td>
              <td>{result.estimate ? result.estimate.interval.perDecade.map(precision).join(' to ') : '—'}</td>
              <td>{result.adjustedP === null ? '—' : precision(result.adjustedP)}</td>
              <td>{records[i].monthly.length ? result.status : seriesStatus(definition.archive, 0, 0)}</td></tr>;
          })}</tbody>
        </table></div>
        <p>Sen slope on annual values; Hamed–Rao modified Mann–Kendall accounts for serial autocorrelation. Holm correction controls the six-site family at 0.05 for this variable and period only. Repeated searches are exploratory. The approximate 95% slope interval uses a moving-block bootstrap with 1,999 replicates and a rounded cube-root block length (minimum two years); it is not a chart-wide uncertainty band or simultaneously adjusted interval.</p>
        <p>{definition.aggregation} {definition.missingPolicy}</p></details>
        {selected.length > 0 && <details className="mission-disclosure" id="observed-values"><summary>Values for {location.name} ({unit})</summary><div className="table-scroll"><table>
          <caption>{definition.id === 'IMERG_PRECTOT' ? (monthly ? 'Monthly IMERG precipitation depth (mm)' : 'Annual IMERG precipitation depth (mm)') : definition.id === 'PRECTOTCORR' ?
            monthly ? 'Monthly mean daily precipitation rate (mm/day)' : 'Estimated annual precipitation depth (mm)' : definition.name + ' (' + unit + ')'}</caption>
          <thead><tr><th scope="col">Period</th><th scope="col">Value</th></tr></thead>
          <tbody>{selected.map(row => <tr key={row.period}><th scope="row">{periodLabel(row.period)}</th><td>{number(row.values[0])}</td></tr>)}</tbody>
        </table></div></details>}
        <details><summary>Source and archive provenance</summary>
          <p id="series-provenance"><a href={dataset.source}>Official documentation</a>. This provenance describes the original archive for all period selections.</p>
          <ul>{study.provenance.map(file => <li key={file.sha256}><code>{file.bodyFile}</code> · <a href={file.url}>NASA source</a>{file.retrievedAt ? ' · retrieved ' + file.retrievedAt : ''} · SHA-256 <code style={{ overflowWrap: 'anywhere' }}>{file.sha256}</code></li>)}</ul>
          {showNativeCell && <p><Link href="/investigate?mode=native-cell#pilot-source">See the native grid cell</Link> and trace the two verified monthly mean temperature readings to their original granules.</p>}
        </details>
      </section>}
      <details className="mission-disclosure"><summary>Dataset coverage by variable and location</summary>
        <div className="table-scroll"><table>
          <thead><tr><th scope="col">Variable</th>{locations.map(site => <th key={site.id} scope="col">{site.name}</th>)}</tr></thead>
          <tbody>{variables.map(variable => <tr key={key(variable)}><th scope="row">{variable.id}</th>
            {recordsFor(variable).map((record, i) => <td key={locations[i].id}>{record.monthly.length ?
              `${record.monthly[0].year}–${record.monthly.at(-1)!.year} · ${record.monthly.length} months` : seriesStatus(variable.archive, 0, 0)}</td>)}</tr>)}
            <tr><th scope="row">Native {nativeVariable.id}</th>{locations.map(site => <td key={site.id}>{site.id === 'bahrain' ?
              <Link href="/investigate?mode=native-cell">{bahrainPilot.observations[0].month} to {bahrainPilot.observations.at(-1)!.month} · {bahrainPilot.observations.length} months</Link> : 'Outside pilot scope'}</td>)}</tr>
          </tbody>
        </table></div>
      </details>
      <details className="mission-disclosure"><summary>Open the interactive study-point map</summary>
      <section className="mission-desk-map" aria-label="Choose a study point">
        <div className="mission-point-rail">
          <span className="mission-meta">01 / Where</span>
          <ol className="mission-site-index">{points.map((site, i) => <li key={site.id}><Link href={site.href} aria-current={site.id === location.id ? 'location' : undefined} prefetch={false}>
            <span className="mission-meta">{String(i + 1).padStart(2, '0')}</span><strong>{site.name}</strong><span aria-hidden="true">↗</span>
          </Link></li>)}</ol>
        </div>
        <MissionAtlas points={points} selected={location.id} focusPoint={query.location === location.id} />
      </section>
      </details>
    </div>
  </div>;
}
