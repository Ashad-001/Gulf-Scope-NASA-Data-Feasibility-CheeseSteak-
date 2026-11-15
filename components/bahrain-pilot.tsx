'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import type { BahrainPilot } from '../lib/bahrain-pilot';

const CellMap = dynamic(() => import('./bahrain-cell-map'), {
  ssr: false,
  loading: () => <div className="pilot-map pilot-map-loading" role="status">Loading Bahrain map…</div>,
});

const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const formatMonth = (month: string) => monthLabel.format(new Date(month + '-01T00:00:00Z'));
const subscribeToHydration = () => () => {};

export function BahrainPilotView({ pilot, locations }: {
  pilot: BahrainPilot;
  locations: { id: string; country: string; name: string }[];
}) {
  const [selected, setSelected] = useState(0);
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const reading = pilot.observations[selected];
  const point = pilot.power.observations[selected];
  const { source, cell, variable } = pilot;
  const [west, south, east, north] = cell.bounds;

  return <article className="native-pilot editorial-shell">
    <section className="orbita-native-summary" aria-labelledby="native-readings">
      <h2 id="native-readings" className="orbita-label">MERRA-2 / Native cell / 2025 / {variable.id}</h2>
      <div className="orbita-native-readings">{pilot.observations.map(row => <div key={row.month}>
        <p className="orbita-label">{formatMonth(row.month)}</p>
        <p className="orbita-native-number">{row.celsius.toFixed(2)} °C</p>
        <p className="orbita-label">Verified monthly mean · Converted from kelvin</p>
      </div>)}</div>
      <div className="orbita-native-limits">
        <div><p className="orbita-label">Derived cell footprint</p><p>{south}–{north}° N / {west}–{east}° E</p>
        <p>Centre {cell.center[1].toFixed(3)}° N / {cell.center[0].toFixed(3)}° E</p></div>
        <div><p className="orbita-label">Important limitation</p><p>Two months cannot establish a trend. The archive’s TemporalRange ends in 2016 despite verified 2025 observations.</p></div>
      </div>
    </section>

    <section className="pilot-section" aria-labelledby="pilot-region">
      <h2 id="pilot-region" className="pilot-kicker">Native pilot coverage</h2>
      <ul className="pilot-countries">{[...locations].sort((a, b) => a.country.localeCompare(b.country)).map(site => <li key={site.id} data-verified={site.id === 'bahrain'}>
        <strong>{site.country}</strong>
        <span>{site.id === 'bahrain' ? 'Two verified native months' : 'Regional context only'}</span>
        <Link href={`/investigate?location=${site.id}`}>{site.name} POWER record</Link>
      </li>)}</ul>
    </section>

    <section className="pilot-section pilot-workspace" aria-labelledby="pilot-title">
      <div className="pilot-workspace-heading">
        <p className="pilot-kicker">Native grid / Bahrain</p>
        <h2 id="pilot-title">One cell. Two monthly observations.</h2>
      </div>
      <figure className="pilot-geography">
        <p className="pilot-kicker">Geographic context</p>
        <CellMap cell={cell} />
        <figcaption>
          <div className="pilot-legend">
            <span className="pilot-key-cell">Derived cell footprint</span>
            <span className="pilot-key-point">Bahrain reference point</span>
          </div>
          <p>Cell centre {cell.center[1].toFixed(3)}° N, {cell.center[0].toFixed(3)}° E</p>
          <p>{west}–{east}° E · {south}–{north}° N</p>
          <p>Bounds use midpoints between adjacent grid centres. The Bahrain reference point lies inside this footprint.</p>
        </figcaption>
      </figure>

      <div className="pilot-evidence">
        <p className="pilot-kicker">Selected observation</p>
        <div aria-live="polite" aria-atomic="true">
          <h3 className="pilot-temperature">{reading.celsius.toFixed(2)} <span>°C</span></h3>
          <p>{variable.name} · {formatMonth(reading.month)}</p>
        </div>
        <div className="pilot-evidence-source">
          <p className="pilot-kicker">Source and spatial support</p>
          <p><strong>{source.product} · {source.collection} v{source.version}</strong></p>
          <p>Monthly mean for a native grid cell. The outlined area and reference point are the same for each month.</p>
          <p className="pilot-selected-file">{reading.granule}</p>
        </div>
        <div className="pilot-limits">
          <h3 className="pilot-kicker">Read the limits</h3>
          <p>The cell covers land and water at a scale too coarse to resolve individual islands, neighbourhoods or reclaimed areas. Two months cannot establish a trend or a national average.</p>
        </div>
      </div>
    </section>

    <section className="pilot-section pilot-timeline" aria-labelledby="pilot-timeline">
      <p className="pilot-kicker">Follow the record</p>
      <h2 id="pilot-timeline">Move through the observations.</h2>
      <p>The pilot contains two verified months. Select a month to update the reading and its source granule.</p>
      <fieldset disabled={!hydrated}>
        <legend>Observation month</legend>
        <div className="pilot-periods">{pilot.observations.map((row, index) => <label key={row.month}>
          <input type="radio" name="pilot-month" checked={index === selected} onChange={() => setSelected(index)} />
          <span>{formatMonth(row.month)}</span>
        </label>)}</div>
      </fieldset>
    </section>

    <section className="pilot-section pilot-provenance" aria-labelledby="pilot-source">
      <p className="pilot-kicker">Source and methods</p>
      <h2 id="pilot-source">How the evidence is built.</h2>
      <details>
        <summary>Source, grid and comparison</summary>
        <dl>
          <dt>NASA collection</dt><dd>{source.provider} {source.product}, {source.collection} v{source.version} · <a href={`https://doi.org/${source.doi}`}>{source.doi}</a></dd>
          <dt>Selected granule</dt><dd>{reading.granule}<br /><code>{reading.sha256}</code></dd>
          <dt>Observation</dt><dd>{variable.id} · {reading.kelvin} K · {variable.conversion} · {reading.celsius.toFixed(2)} °C</dd>
          <dt>Month metadata</dt><dd>{reading.time.start} through {reading.time.end}. Time coordinate: {reading.time.value} {reading.time.units}.</dd>
          <dt>Native cell</dt><dd>Zero-based latitude index {cell.indices.latitude}, longitude index {cell.indices.longitude}. {cell.footprintMethod}</dd>
          <dt>Reference point</dt><dd>{cell.reference[1]}° N, {cell.reference[0]}° E lies inside the footprint.</dd>
        </dl>
        <ul>{pilot.caveats.map(caveat => <li key={caveat}>{caveat}</li>)}</ul>
        <h3>Archived POWER point comparison</h3>
        <p>{formatMonth(reading.month)} · POWER requested point: {point.celsius.toFixed(2)} °C (local solar time). Native minus point: {point.nativeMinusPointCelsius > 0 ? '+' : ''}{point.nativeMinusPointCelsius.toFixed(5)} °C.</p>
        <p>Both products draw on MERRA-2 and use different spatial and temporal processing. This comparison checks consistency across services. GulfScope does not independently validate these values against ground-station observations.</p>
      </details>
      <details>
        <summary>View both monthly values</summary>
        <table>
          <caption>Native MERRA-2 grid-cell observations</caption>
          <thead><tr><th scope="col">Month</th><th scope="col">Temperature (°C)</th></tr></thead>
          <tbody>{pilot.observations.map(row => <tr key={row.month}>
            <th scope="row">{formatMonth(row.month)}</th><td>{row.celsius.toFixed(2)}</td>
          </tr>)}</tbody>
        </table>
      </details>
    </section>
    <nav className="orbita-evidence-links" aria-label="Investigation modes">
      <Link href="/investigate?mode=series">Return to the Field Desk ↗</Link>
      <Link href="/investigate?location=bahrain">Original POWER point studies ↗</Link>
    </nav>
  </article>;
}
