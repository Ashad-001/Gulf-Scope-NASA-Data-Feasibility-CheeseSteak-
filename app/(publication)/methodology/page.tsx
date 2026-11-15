import type { Metadata } from 'next';
import Link from 'next/link';
import { OrbitaHero } from '../../../components/orbita-hero';
import { JournalContents } from '../journal-contents';
import { bahrainPilot } from '../../../lib/bahrain-pilot';

export const metadata: Metadata = {
  title: 'Methodology | GulfScope',
  description: 'How GulfScope checks native MERRA-2 granules, reproduces the Bahrain cell extraction and analyses NASA POWER point studies.',
};

const workflow = [
  ['Source first', 'Retrieve', 'Keep the original monthly NetCDF granules, collection version, source dates and SHA-256 hashes.'],
  ['Quality control', 'Check integrity', 'Check the dimensions, coordinates, units, time metadata and file hashes. Reject a selected value that is masked, nonfinite or physically invalid.'],
  ['Spatial support', 'Locate', 'Use the stored coordinates to locate the Bahrain reference point and verify which native grid cell contains it.'],
  ['Scientific caution', 'Interpret', 'Present the monthly value, its source and spatial footprint together. Make gaps and limits clear before comparing records.'],
];

export default function Methodology() {
  const { cell, grid, variable } = bahrainPilot;
  const [west, south, east, north] = cell.bounds;
  const [longitudeSpacing, latitudeSpacing] = grid.spacingDegrees;

  return <article className="orbita-publication orbita-methodology">
    <OrbitaHero scene="horizon" chapter="06 / The Evidence Journal" title={<>Nothing without<br /> the source.</>}
      description="Every finding is a chain of decisions that can be examined." note="Earth observation / Illustrative" />
    <div className="mission-width journal-layout">
      <JournalContents items={[["workflow","Retrieve & preserve"],["spatial-support","Check coverage"],["aggregation","Aggregate carefully"],["trend-evidence","Assess the trend"]]} />
      <div className="journal-body">
    <section className="publication-section" id="workflow">
      <p className="publication-label">The workflow</p>
      <h2>From archive to evidence.</h2>
      <ol className="publication-grid publication-grid-four">
        {workflow.map(([label, title, detail], i) => <li className="publication-panel" key={title}>
          <p className="publication-label">{label}</p>
          <h3>{String(i + 1).padStart(2, '0')} / {title}</h3>
          <p>{detail}</p>
        </li>)}
      </ol>
    </section>
    <section className="publication-section publication-pair" id="spatial-support">
      <div>
        <p className="publication-label">Spatial resolution</p>
        <h2>A cell is not an island.</h2>
        <p>MERRA-2 reanalysis combines observations, including satellite inputs, with a numerical atmospheric model to estimate conditions on a grid. {variable.id} is monthly mean air temperature at 2 metres. The granules store kelvin, and the site displays Celsius ({variable.conversion}).</p>
        <p>Each grid step is {latitudeSpacing}° latitude by {longitudeSpacing}° longitude. Coordinates identify cell centres. The granules supply no coordinate bounds, so the footprint uses the midpoint between the selected centre and each neighbouring centre.</p>
      </div>
      <aside className="publication-tint">
        <p className="publication-label">Bahrain cell centre</p>
        <p className="publication-display">{cell.center[1].toFixed(3)}° N · {cell.center[0].toFixed(3)}° E</p>
        <p>The reference point ({cell.reference[1]}° N, {cell.reference[0]}° E) is inside the derived footprint of {south}–{north}° N and {west}–{east}° E.</p>
        <Link href="/investigate?mode=native-cell">Inspect the Bahrain pilot ↗</Link>
      </aside>
    </section>
    <section className="publication-section" id="trend-evidence">
      <p className="publication-label">Evidence status</p>
      <h2>What the record supports.</h2>
      <div className="publication-grid publication-grid-three">
        <div className="publication-panel"><h3>Verified native pilot</h3><p>Only February and March 2025 are available. The pilot offers those two verified months without filling gaps.</p></div>
        <div className="publication-panel"><h3>Historical regional coverage</h3><p>A broader native-grid atlas requires additional extraction and coverage checks before values can be shown.</p></div>
        <div className="publication-panel"><h3>Limits of inference</h3><p>Two months cannot establish a long-term trend. A coarse cell that includes land and water cannot resolve neighbourhoods or represent a national average.</p></div>
      </div>
      <p>Reproducible extraction means the same granules and cell-selection rules yield the same values. File hashes check granule integrity. Comparing the extracted values with NASA POWER checks consistency across services: POWER meteorological parameters are also derived from MERRA-2. GulfScope does not currently demonstrate independent validation against ground-station observations.</p>
      <h3 id="aggregation">How the original POWER studies assess trends</h3>
      <p>The separate NASA POWER studies use archived requested-point records. GulfScope checks consecutive months and rejects incomplete series. Annual temperatures weight each month by its number of days. Annual precipitation sums estimated monthly depths from the reported daily rates.</p>
      <p>Sen’s slope estimates change per decade. Hamed–Rao tests account for serial dependence, with Holm adjustment across the three variables. An approximate 95% moving-block bootstrap interval describes uncertainty in the slope, using four-year blocks. The precipitation bootstrap block-length sensitivity analysis was conducted for Bahrain only.</p>
      <h3>How the field desk compares six sites</h3>
      <p>The field desk evaluates Sen’s slope only when the selected window contains at least 20 consecutive complete annual observations. Hamed–Rao modified Mann–Kendall accounts for serial dependence. Holm adjustment at 0.05 applies to the six sites for one variable and one period; repeated searches are not one corrected family. The approximate 95% interval uses a moving-block bootstrap of the slope, not a band around the time series. The interval and the significance test answer different questions.</p>
      <div className="publication-links"><Link href="/investigate?mode=series">Open the field desk ↗</Link><Link href="/investigate#method">Original POWER methods ↗</Link><Link href="/data-sources">View data sources ↗</Link></div>
    </section>
      </div>
    </div>
  </article>;
}
