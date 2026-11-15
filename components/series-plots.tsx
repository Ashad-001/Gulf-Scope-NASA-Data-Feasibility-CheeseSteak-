'use client';

import dynamic from 'next/dynamic';
import { plotPeriods } from '../lib/plot-periods.mjs';

const Chart = dynamic(() => import('./evidence-chart'), { ssr: false });

type Site = { id: string; name: string };
type Period = { period: number; values: number[] };
const colors = ['#08765f', '#91521a', '#594584', '#245587', '#a2314c', '#454744'];
const dashes = [undefined, '7 3', '2 3', '9 3 2 3', '4 3', '12 4'];

export function SeriesPlots({ location, sites, selected, comparison, monthly, unit, kind }: {
  location: Site & { latitude: number; longitude: number }; sites: Site[];
  selected: Period[]; comparison: Period[]; monthly: boolean; unit: string; kind: 'observation' | 'comparison';
}) {
  if (!selected.length) return null;
  const lines = sites.map((site, i) => ({ key: site.id, name: site.name, color: colors[i], dash: dashes[i] }));
  return <>

    {kind === 'observation' && <div className="mission-plot-section orbita-chart"><h3>{monthly ? 'Monthly' : 'Annual'} observation trace</h3><p className="orbita-label">{location.name} / {unit}</p>
    <Chart rows={plotPeriods(selected, monthly, 1).map(row => ({ year: row.period, value: row.values[0] }))} monthly={monthly} unit={unit}
      series={[{ key: 'value', name: location.name, color: colors[0] }]} /></div>}
    {kind === 'comparison' && comparison.length > 0 && <div className="mission-plot-section" id="regional-comparison">
      <h3>Compare six points ({unit})</h3>
      <ul aria-label="Comparison legend">{lines.map(line => <li key={line.key}>
        <svg width="36" height="12" aria-hidden="true"><line x1="0" x2="32" y1="8" y2="8" stroke={line.color} strokeWidth="2" strokeDasharray={line.dash} /></svg>{' '}{line.name}
      </li>)}</ul>
      <Chart rows={plotPeriods(comparison, monthly, sites.length).map(row => ({ year: row.period, ...Object.fromEntries(sites.map((site, i) => [site.id, row.values[i]])) }))}
        series={lines} monthly={monthly} unit={unit} />
    </div>}
  </>;
}
