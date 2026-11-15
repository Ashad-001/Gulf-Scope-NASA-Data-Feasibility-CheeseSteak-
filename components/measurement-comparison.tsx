import Link from 'next/link';
import { locations, pointDatasets, recordsFor } from '../lib/expanded-series';
import { measurementGroups, prepareMeasurements } from '../lib/measurement-overview.mjs';
import { alpha, minimumYears } from '../lib/series-analysis.mjs';
import { SeriesPlots } from './series-plots';
import { ObservationExplanation } from './observation-explanation';

const labels = {
  PRECTOTCORR: 'NASA POWER corrected precipitation',
  IMERG_PRECTOT: 'GPM IMERG precipitation via NASA POWER',
};

export function MeasurementComparison({ group, locationIndex, first, last, monthly }: {
  group: (typeof measurementGroups)[number]; locationIndex: number; first: number; last: number; monthly: boolean;
}) {
  const location = locations[locationIndex];
  const precipitation = group.id === 'precipitation';
  const { measurements, comparison } = prepareMeasurements(
    group.definitions, group.definitions.map(recordsFor), locationIndex, first, last, monthly,
  );
  const sites = measurements.map(({ definition }) => ({
    id: definition.id, name: labels[definition.id as keyof typeof labels] ?? definition.name,
  }));
  const period = (value: number) => monthly ? String(value).replace(/^(\d{4})(\d{2})$/, '$1-$2') : value;

  return <>
    {monthly && precipitation ? <p>POWER reports a monthly mean daily rate in mm/day using local solar time. IMERG sums UTC daily depths into monthly totals in mm.</p>
      : comparison.length ? <>
        <p>Shared complete {monthly ? 'months' : 'years'} {period(comparison[0].period)}–{period(comparison.at(-1)!.period)} ({comparison.length} {monthly ? 'months' : 'years'}).
          {precipitation && ' Both lines show annual precipitation depth in mm. The products use different grids, estimation methods and day boundaries.'}</p>
        <SeriesPlots location={location} sites={sites} selected={[]} comparison={comparison} monthly={monthly} unit={measurements[0].unit}
          kind="comparison" title={precipitation ? 'Compare annual precipitation depths' : `Compare ${monthly ? 'monthly' : 'annual'} ${group.name.toLowerCase()} (${measurements[0].unit})`}
          comparisonId={group.id + '-comparison'} />
      </> : <p role="status">No complete shared {monthly ? 'months' : 'years'} in this window.{precipitation && ' IMERG begins in 2001.'}</p>}
    <p>Trend tests and Holm adjustments apply separately to each measurement across eligible study points in the selected window. The comparison is descriptive and includes no test of a difference between trends.</p>
    {measurements.map(({ definition, record, rows, years, unit, trend }, index) => {
      const selectedYears = new URLSearchParams({ mode: 'series', location: location.id, series: definition.dataset + ':' + definition.id,
        resolution: monthly ? 'monthly' : 'annual' });
      if (last >= definition.start) {
        selectedYears.set('first', String(Math.max(first, definition.start)));
        selectedYears.set('last', String(last));
      }
      return <section key={definition.id} className="mission-plot-section" aria-labelledby={'summary-' + definition.id}>
        <h3 id={'summary-' + definition.id}>{sites[index].name}</h3>
        <p>{definition.id} · Archive {record.monthly[0]?.year}–{record.monthly.at(-1)?.year} · {unit} · <a href={record.provenance[0].url}>{precipitation ? 'NASA source' : pointDatasets[definition.dataset as keyof typeof pointDatasets].product} ↗</a></p>
        {(group.id === 'power-smap') && <p>Complete annual coverage {record.annual[0]?.year}–{record.annual.at(-1)?.year}. Incomplete months and years are excluded.</p>}
        {comparison.length === 0 && <SeriesPlots location={location} sites={[]} selected={rows} comparison={[]} monthly={monthly} unit={unit}
          kind="observation" title={precipitation ? (monthly ? (definition.id === 'PRECTOTCORR' ? 'Monthly mean daily precipitation rate' : 'Monthly precipitation depth') : 'Annual precipitation depth') : undefined} />}
        {!rows.length && <p role="status">No complete {monthly ? 'monthly' : 'annual'} values in this window.</p>}
        {trend.estimate ? <div className="orbita-interpretation">
          <p><strong>{trend.status}.</strong> Sen slope {trend.estimate.slopePerDecade.toPrecision(4)} {definition.annualUnit}/decade.</p>
          <p>{trend.estimate.n} complete years · {years[0].year}–{years.at(-1)!.year} · Approx. 95% slope interval {trend.estimate.interval.perDecade.map((value: number) => value.toPrecision(4)).join(' to ')} {definition.annualUnit}/decade · Holm-adjusted p {trend.adjustedP?.toPrecision(4) ?? 'not estimable'} (α = {alpha}).</p>
        </div> : <p>Trend not evaluated. {years.length} complete years in this window. At least {minimumYears} consecutive complete years are required.</p>}
        <p><Link href={'/investigate?' + selectedYears.toString()}>Inspect {definition.id === 'PRECTOTCORR' ? 'POWER corrected precipitation' : definition.name}{last < definition.start ? ' (full archive)' : ''} ↗</Link></p>
      </section>;
    })}
    <ObservationExplanation measurements={measurements} location={location} first={first} last={last} monthly={monthly} />
  </>;
}
