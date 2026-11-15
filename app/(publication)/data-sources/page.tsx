import type { Metadata } from 'next';
import Link from 'next/link';
import { OrbitaHero } from '../../../components/orbita-hero';
import { JournalContents } from '../journal-contents';
import { bahrainPilot } from '../../../lib/bahrain-pilot';
import { getStudy } from '../../../lib/study';
import { datasets, variables } from '../../../lib/series-catalog.mjs';

export const metadata: Metadata = {
  title: 'Data sources | GulfScope',
  description: 'Trace GulfScope evidence to its NASA MERRA-2 granules and archived NASA POWER records.',
};

const trace = [
  ['Original granule', 'Keep the original NASA granule and its filename.'],
  ['Checksum and metadata', 'Verify SHA-256, coordinates, time and units.'],
  ['Grid cell and value', 'Record the native indices, derived footprint and selected T2M.'],
  ['Display and limits', 'Publish the converted value and explain what the grid can resolve.'],
];

export default function DataSources() {
  const { source, variable, grid, observations, caveats } = bahrainPilot;
  const [longitudeSpacing, latitudeSpacing] = grid.spacingDegrees;
  const study = getStudy()!;

  return <article className="orbita-publication orbita-data-sources">
    <OrbitaHero scene="horizon" chapter="07 / Data Source Register" title="Follow the evidence back."
      description="Explore the coverage, origins and limitations of each product." />
    <div className="orbita-width orbita-register">
      <p className="orbita-label">Product lineage / Scientific records</p>
      <ol>
        <li><span>01</span><a href="#power"><strong>POWER meteorology</strong><small>MERRA-2-derived requested-point records across six Gulf locations.</small></a><span>1981–2025 / 0.5° × 0.625°</span><span>Available</span></li>
        <li><span>02</span><a href="#solar"><strong>POWER solar</strong><small>All-sky downward shortwave radiation.</small></a><span>1984–2025 / 1° grid</span><span>Caution: 2001</span></li>
        <li><span>03</span><a href="#native"><strong>Native MERRA-2</strong><small>Two verified Bahrain monthly readings and a derived footprint.</small></a><span>Feb–Mar 2025 / T2M</span><span>Pilot only</span></li>
        <li><span>04</span><a href="#imerg"><strong>GPM IMERG</strong><small>Daily UTC satellite precipitation estimates, aggregated into complete periods.</small></a><span>2001–2025 / 0.1° grid</span><span>Available</span></li>
        <li><span>05</span><a href="#hydrology"><strong>SMAP Level-4</strong><small>Daily UTC surface and root-zone moisture from the NASA POWER high-resolution archive.</small></a><span>2015–2025 / ~9 km</span><span>Descriptive only</span></li>
      </ol>
      <p className="orbita-label">Archive → integrity check → coordinate selection → analysis → published finding</p>
    </div>
    <div className="mission-width journal-layout">
      <JournalContents items={[["native","Native MERRA-2"],["power","POWER product register"],["solar","Solar and hydrology"],["chain","Provenance chain"]]} />
      <div className="journal-body">
    <section className="publication-section" id="native">
      <p className="publication-label">Native grid data</p>
      <div className="publication-panel publication-source">
        <div>
          <p className="publication-label">{source.provider} · Global atmospheric reanalysis</p>
          <h2>MERRA-2 monthly surface diagnostics</h2>
          <p>Original monthly NetCDF-4 granules provide {variable.id}, monthly mean air temperature at 2 metres. The native grid spacing is {latitudeSpacing}° latitude × {longitudeSpacing}° longitude. Values are stored in kelvin and displayed in °C.</p>
          <div className="publication-links"><a href={`https://doi.org/${source.doi}`}>DOI {source.doi} ↗</a><a href={`https://cmr.earthdata.nasa.gov/search/concepts/${source.cmrCollection}.html`}>NASA Earthdata collection ↗</a></div>
        </div>
        <div>
          <p className="publication-label">Collection and pilot coverage</p>
          <p><strong>{source.collection} · Version {source.version}</strong></p>
          <p>Bahrain · February and March 2025 only</p>
          <ul className="publication-granules">{observations.map(row => <li key={row.month}><code>{row.granule}</code></li>)}</ul>
          <Link href="/investigate?mode=native-cell#pilot-source">Inspect granule metadata and SHA-256 ↗</Link>
        </div>
      </div>
    </section>
    <section className="publication-section" id="power">
      <p className="publication-label">Archived point studies</p>
      <div className="publication-panel publication-source">
        <div>
          <p className="publication-label">NASA Prediction Of Worldwide Energy Resources</p>
          <h2>NASA POWER representative point records</h2>
          <p>Bahrain, Kuwait City, Muscat, Doha, Riyadh and Abu Dhabi each have {study.completeness.months} monthly records and {study.completeness.years} derived annual values per meteorological variable, January 1981 through December 2025.</p>
          <dl className="publication-variables">
            <div><dt>T2M</dt><dd>Mean 2 m air temperature (°C)</dd></div>
            <div><dt>T2M_MIN_AVG</dt><dd>Mean of daily minimum 2 m temperatures (°C)</dd></div>
            <div><dt>PRECTOTCORR</dt><dd>Corrected precipitation rate (mm/day), aggregated to annual estimated depth (mm)</dd></div>
            {variables.filter(row => row.archive === 'extension').map(row => <div key={row.id}><dt>{row.id}</dt><dd>{row.name} ({row.monthlyUnit})</dd></div>)}
          </dl>
          <div className="publication-links"><a href="https://power.larc.nasa.gov/docs/services/api/temporal/monthly/">NASA POWER monthly API ↗</a><a href="/investigate?mode=series#series-provenance">Inspect archived retrievals ↗</a><Link href="/investigate">Original Research Archive — NASA POWER ↗</Link></div>
        </div>
        <aside className="publication-tint">
          <p className="publication-label">Important distinction</p>
          <h3>Point value ≠ native cell value.</h3>
          <p>POWER meteorological parameters are derived from MERRA-2 and reported here as requested-point records in local solar time. The pilot extracts a native MERRA-2 cell directly from each granule and retains its time metadata. Comparing the two checks consistency across services with different processing. GulfScope does not currently demonstrate independent validation against ground-station observations.</p>
        </aside>
      </div>
    </section>
    <section className="publication-section" id="solar">
      <p className="publication-label">Solar energy and water</p>
      <h2>Different products, different histories.</h2>
      {variables.filter(row => row.archive === 'solar').map(row => <div key={row.id} className="journal-register">
        <p className="publication-label">{row.id} / {row.start}–{row.end}</p>
        <h3>{row.name}</h3><p>{datasets['power-solar'].product} · {datasets['power-solar'].resolution} · {row.monthlyUnit}. {datasets['power-solar'].caveat}</p>
      </div>)}
      <div className="journal-register" id="imerg"><p className="publication-label">GPM IMERG / Daily UTC</p><h3>Satellite precipitation estimates</h3><p>All six points have complete 2001–2025 records. Monthly and annual totals in millimetres sum the daily UTC depths; incomplete periods are not used. NASA documents a 0.1° grid. The API returns requested coordinates, not cell centres or land/water fractions. The response identifies IMERG but does not record the algorithm version or run.</p></div>
      <div className="journal-register" id="hydrology"><p className="publication-label">SMAP Level-4 / Descriptive only</p><h3>Surface and root-zone soil moisture</h3><p>All six points have verified estimates from the NASA POWER daily UTC archive. The two variables are volumetric model estimates constrained by satellite data. The monthly and annual means require complete UTC periods. March 2015 is partial, and September 20, 2025 is missing; nine complete years (2016–2024) do not qualify for a long-term trend test.</p></div>
    </section>
    <section className="publication-section" id="chain">
      <p className="publication-label">Provenance chain</p>
      <h2>Original file → reproducible extraction → published evidence.</h2>
      <ol className="publication-grid publication-grid-four">{trace.map(([title, detail]) => <li className="publication-panel" key={title}><h3>{title}</h3><p>{detail}</p></li>)}</ol>
      <ul className="publication-notes">
        <li>Coordinate bounds are absent. The pilot footprint uses midpoints between adjacent cell centres.</li>
        {caveats.map(note => <li key={note}>{note}</li>)}
      </ul>
      <p>Wider native-grid coverage requires additional extraction and coverage checks before publication. Map tiles from <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a> provide geographic context. The cinematic Orbita scenes are illustrative artwork. The separate interactive globe uses <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/">Blue Marble imagery by Reto Stöckli, NASA Earth Observatory (GSFC)</a>.</p>
    </section>
      </div>
    </div>
  </article>;
}
