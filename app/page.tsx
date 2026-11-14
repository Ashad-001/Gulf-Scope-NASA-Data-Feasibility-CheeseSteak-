import Link from 'next/link';
import { AnnualTrace } from '../components/annual-trace';
import { getLocations, getStudy } from '../lib/study';
import './home.css';

const steps = [
  ['Observe', 'Inspect an annual value in NASA’s record.'],
  ['Measure', 'Estimate change per decade.'],
  ['Test', 'Assess significance and uncertainty.'],
  ['Understand', 'Read the limits of the evidence.'],
];

export default function Home() {
  const study = getStudy()!;
  const locations = getLocations().map(({ id }) => getStudy(id)!);
  const [temperature] = study.variables;
  const first = temperature.annual[0].year;
  const last = temperature.annual.at(-1)!.year;
  return <div className="living-home">
    <section className="living-hero" aria-labelledby="earth-title">
      <div className="earth-copy">
        <p className="living-kicker">NASA POWER / MERRA-2</p>
        <h1 id="earth-title">The Earth leaves signals.<br />We uncover the evidence.</h1>
      </div>
      <div className="earth-scene" aria-hidden="true">
        <img src="/white-dust-earth.webp" width={960} height={960} alt="" fetchPriority="high" />
      </div>
      <div className="earth-actions">
        <Link href="/investigate" className="living-cta">Start investigation <span aria-hidden="true">↗</span></Link>
        <a className="earth-cue" href="#study"><span aria-hidden="true">↓</span> Follow the record</a>
      </div>
    </section>

    <section className="living-section" id="study" aria-labelledby="record-title">
      <div className="living-shell">
        <p className="living-kicker">The record / {first}–{last}</p>
        <h2 id="record-title">{study.completeness.years} years of change</h2>
        <p className="living-note">Explore the years that make up the Bahrain temperature record.</p>
        <AnnualTrace readings={temperature.annual} name="Bahrain mean air temperature" unit={temperature.unit} />
      </div>
    </section>

    <section className="living-section living-signals" aria-labelledby="signals-title">
      <div className="living-shell">
        <p className="living-kicker">The Bahrain record / {first}–{last}</p>
        <h2 id="signals-title">Three environmental signals</h2>
        <div className="signal-grid">
          {study.variables.map(variable => {
            const { significant, slopePerDecade } = variable.trend;
            const value = Math.abs(slopePerDecade).toFixed(variable.unit === '°C' ? 3 : 2);
            const prefix = slopePerDecade < 0 ? '−' : slopePerDecade > 0 ? '+' : '';
            return <article key={variable.id} data-variable={variable.id}>
              <h3>{variable.name}</h3>
              <p className="signal-slope">{prefix}{value} <span>{variable.unit} / decade</span></p>
              <p className={significant ? 'signal-status' : 'signal-status inconclusive'}>
                <span aria-hidden="true">{significant ? '●' : '◇'}</span> {significant ? 'Statistically significant' : 'Not statistically significant'}
              </p>
              <AnnualTrace readings={variable.annual} name={variable.name} unit={variable.unit} compact />
            </article>;
          })}
        </div>
        <p className="living-note">Use a trace’s year control to inspect an annual value. The significance labels use Holm-adjusted tests across the three outcomes.</p>
      </div>
    </section>

    <section className="living-section living-method" id="method" aria-labelledby="method-title">
      <div className="living-shell">
        <p className="living-kicker">How the investigation works</p>
        <h2 id="method-title">From observation to evidence</h2>
        <ol className="evidence-steps">{steps.map(([title, description], index) => <li key={title}>
          <span className="step-number" aria-hidden="true">{index + 1}</span><h3>{title}</h3><p>{description}</p>
        </li>)}</ol>
      </div>
    </section>

    <section className="living-section" aria-labelledby="gulf-title">
      <div className="living-shell">
        <p className="living-kicker">The study locations</p>
        <h2 id="gulf-title">A changing Gulf</h2>
        <div className="gulf-map" role="group" aria-label="Schematic map of GulfScope study locations"><div className="gulf-map-plane">
          <img src="/gulf-context.svg" width={1248} height={350} loading="lazy" alt="" />
          {locations.map(site => {
            const x = 624 + (site.longitude - 52.5) * (302 / 13);
            const y = 175 + (26 - site.latitude) * (302 / 13);
            return <Link key={site.id} href={`/investigate?location=${site.id}`} className="gulf-pin"
              style={{ left: `${x / 12.48}%`, top: `${y / 3.5}%` }} aria-label={`Investigate ${site.name}`}>
              <span aria-hidden="true" />{site.name}
            </Link>;
          })}
        </div></div>
        <ul className="gulf-links">{locations.map(site => <li key={site.id}>
          <Link href={`/investigate?location=${site.id}`}>{site.name} <span aria-hidden="true">↗</span></Link>
          <span>{site.latitude.toFixed(2)}° N · {site.longitude.toFixed(2)}° E</span>
        </li>)}</ul>
        <p className="living-note">Schematic geography. Study points are plotted from verified coordinates.</p>
      </div>
    </section>

    <section className="living-section living-close" aria-labelledby="begin-title">
      <div className="living-shell closing-layout">
        <div>
          <p className="living-kicker">NASA POWER / MERRA-2</p>
          <h2 id="begin-title">Begin the investigation.</h2>
          <Link href="/investigate" className="living-cta">Open the Bahrain study <span aria-hidden="true">↗</span></Link>
          <p className="closing-source">Earth imagery: <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/">NASA Blue Marble / Reto Stöckli, NASA Earth Observatory (GSFC) ↗</a></p>
        </div>
        <div className="closing-earth" aria-hidden="true"><img src="/white-dust-earth.webp" width={960} height={960} alt="" loading="lazy" /></div>
      </div>
    </section>
  </div>;
}
