import Link from 'next/link';
import { locations, recordsFor } from '../lib/expanded-series';
import { precipitationMeasurements, preparePrecipitation } from '../lib/precipitation-overview.mjs';
import { alpha, minimumYears } from '../lib/series-analysis.mjs';
import { SeriesPlots } from './series-plots';

const labels = {
  PRECTOTCORR: 'NASA POWER corrected precipitation',
  IMERG_PRECTOT: 'GPM IMERG precipitation via NASA POWER',
};

export function PrecipitationComparison({ locationIndex, first, last, monthly }: {
  locationIndex: number; first: number; last: number; monthly: boolean;
}) {
  const location = locations[locationIndex];
  const { measurements, comparison } = preparePrecipitation(
    precipitationMeasurements.map(recordsFor), locationIndex, first, last, monthly,
  );
  const sites = measurements.map(({ definition }) => ({
    id: definition.id, name: labels[definition.id as keyof typeof labels],
  }));

  return <>
    {monthly ? <p>POWER reports a monthly mean daily rate in mm/day using local solar time. IMERG sums UTC daily depths into monthly totals in mm.</p>
      : comparison.length ? <>
        <p>Shared complete years {comparison[0].period}–{comparison.at(-1)!.period} ({comparison.length} years). Both lines show annual precipitation depth in mm. The products use different grids, estimation methods and day boundaries.</p>
        <SeriesPlots location={location} sites={sites} selected={[]} comparison={comparison} monthly={false} unit={measurements[0].unit}
          kind="comparison" title="Compare annual precipitation depths" comparisonId="precipitation-comparison" />
      </> : <p role="status">No complete shared years in this window. IMERG begins in 2001.</p>}
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
        <p>{definition.id} · Archive {record.monthly[0]?.year}–{record.monthly.at(-1)?.year} · {unit} · <a href={record.provenance[0].url}>NASA source ↗</a></p>
        {(monthly || comparison.length === 0) && <SeriesPlots location={location} sites={[]} selected={rows} comparison={[]} monthly={monthly} unit={unit}
          kind="observation" title={monthly ? (definition.id === 'PRECTOTCORR' ? 'Monthly mean daily precipitation rate' : 'Monthly precipitation depth') : 'Annual precipitation depth'} />}
        {!rows.length && <p role="status">No complete {monthly ? 'monthly' : 'annual'} values in this window.</p>}
        {trend.estimate ? <div className="orbita-interpretation">
          <p><strong>{trend.status}.</strong> Sen slope {trend.estimate.slopePerDecade.toPrecision(4)} {definition.annualUnit}/decade.</p>
          <p>{trend.estimate.n} complete years · {years[0].year}–{years.at(-1)!.year} · Approx. 95% slope interval {trend.estimate.interval.perDecade.map((value: number) => value.toPrecision(4)).join(' to ')} {definition.annualUnit}/decade · Holm-adjusted p {trend.adjustedP?.toPrecision(4) ?? 'not estimable'} (α = {alpha}).</p>
        </div> : <p>Trend not evaluated. {years.length} complete years in this window. At least {minimumYears} consecutive complete years are required.</p>}
        <p><Link href={'/investigate?' + selectedYears.toString()}>Inspect {definition.id === 'PRECTOTCORR' ? 'POWER corrected precipitation' : 'GPM IMERG precipitation'}{last < definition.start ? ' (full archive)' : ''} ↗</Link></p>
      </section>;
    })}
  </>;
}
