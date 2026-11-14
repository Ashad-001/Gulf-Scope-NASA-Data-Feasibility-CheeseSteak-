'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import type { BahrainPilot } from '../lib/bahrain-pilot';

const CellMap = dynamic(() => import('./bahrain-cell-map'), {
  ssr: false,
  loading: () => <div className="pilot-map pilot-map-loading" role="status">Loading Bahrain map…</div>,
});

const labels = ['February 2025', 'March 2025'];

export function BahrainPilotView({ pilot }: { pilot: BahrainPilot }) {
  const [selected, setSelected] = useState(0);
  const reading = pilot.observations[selected];
  const point = pilot.power.observations[selected];
  const { source, cell, variable } = pilot;
  const [west, south, east, north] = cell.bounds;
  return <article className="native-pilot">
    <header>
      <nav aria-label="Investigation modes"><Link href="/investigate?location=bahrain">Archived POWER point studies ↗</Link></nav>
      <p className="pilot-kicker">NASA GMAO / MERRA-2 · TWO-MONTH PILOT</p>
      <h1>Bahrain in one climate grid cell</h1>
      <p>The coastline shows the islands. The outlined cell shows the broad area represented by each monthly reanalysis value.</p>
    </header>
    <figure>
      <CellMap cell={cell} />
      <figcaption><span className="pilot-key-cell">Derived grid-cell footprint</span><span className="pilot-key-point">Bahrain reference point</span></figcaption>
    </figure>
    <section className="pilot-evidence" aria-labelledby="pilot-evidence">
      <div>
        <h2 id="pilot-evidence">Read the cell</h2>
        <label htmlFor="pilot-month">Month</label>
        <select id="pilot-month" value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {labels.map((label, index) => <option key={label} value={index}>{label}</option>)}
        </select>
      </div>
      <div aria-live="polite" aria-atomic="true">
        <p className="pilot-kicker">MERRA-2 native grid cell · {labels[selected]}</p>
        <p>{variable.name}</p>
        <p className="pilot-temperature">{reading.celsius.toFixed(2)} °C</p>
      </div>
    </section>
    <p>This cell includes land and water. It cannot isolate an island, district, or reclaimed area. Two monthly values do not establish a trend or a national average.</p>
    <details className="pilot-provenance">
      <summary>Source, grid and comparison</summary>
      <dl>
        <dt>NASA collection</dt><dd>{source.provider} {source.product}, {source.collection} v{source.version} · <a href={`https://doi.org/${source.doi}`}>{source.doi}</a></dd>
        <dt>Selected granule</dt><dd>{reading.granule}<br /><code>{reading.sha256}</code></dd>
        <dt>Observation</dt><dd>{variable.id} · {reading.kelvin} K · {variable.conversion} · {reading.celsius.toFixed(2)} °C</dd>
        <dt>Month metadata</dt><dd>{reading.time.start} through {reading.time.end}. Time coordinate: {reading.time.value} {reading.time.units}.</dd>
        <dt>Native cell</dt><dd>Centre {cell.center[1]}° N, {cell.center[0]}° E. Zero-based latitude index {cell.indices.latitude}, longitude index {cell.indices.longitude}. West {west}°, south {south}°, east {east}°, north {north}°.</dd>
        <dt>Reference point</dt><dd>{cell.reference[1]}° N, {cell.reference[0]}° E lies inside the footprint. {cell.footprintMethod}</dd>
      </dl>
      <ul>{pilot.caveats.map(caveat => <li key={caveat}>{caveat}</li>)}</ul>
      <h3>Archived POWER point comparison</h3>
      <p>{labels[selected]} · POWER requested point: {point.celsius.toFixed(2)} °C (local solar time). Native minus point: {point.nativeMinusPointCelsius > 0 ? '+' : ''}{point.nativeMinusPointCelsius.toFixed(5)} °C.</p>
      <p>The close values do not establish identical spatial or temporal processing.</p>
    </details>
  </article>;
}
