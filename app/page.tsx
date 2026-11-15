import Link from 'next/link';
import Image from 'next/image';
import { OrbitaHero } from '../components/orbita-hero';
import { AnnualTrace } from '../components/annual-trace';
import { LivingEarth } from '../components/living-earth';
import { MissionAtlas } from '../components/mission-atlas';
import { getLocations, getStudy } from '../lib/study';
import { variables } from '../lib/series-catalog.mjs';
import './home.css';

const explore = '/investigate?mode=series';
const links = [
  ['Air temperature', 'power-merra2:T2M'],
  ['Corrected precipitation', 'power-merra2:PRECTOTCORR'],
  ['Relative humidity', 'power-merra2:RH2M'],
  ['Near-surface wind', 'power-merra2:WS2M'],
  ['Solar radiation', 'power-solar:ALLSKY_SFC_SW_DWN'],
];

export default function Home() {
  const study = getStudy()!;
  const temperature = study.variables[0];
  const order = ['bahrain', 'kuwait-city', 'muscat', 'doha', 'riyadh', 'abu-dhabi'];
  const points = getLocations().sort((a,b) => order.indexOf(a.id) - order.indexOf(b.id)).map(site => ({ ...site, href: explore + '&location=' + site.id }));
  const { significant, slopePerDecade } = temperature.trend;
  return <div className="mission-home">
    <section className="orbita-opening" aria-labelledby="earth-title">
      <div className="orbita-orbit-art"><Image src="/orbita/earth.png" fill priority sizes="(max-width: 650px) 1450px, 100vw" alt="" /></div>
      <div className="orbita-cross" aria-hidden="true"><img src="/orbita/cross.svg" alt="" /></div>
      <p className="orbita-opening-chapter orbita-label">01 / The Earth Observatory</p>
      <div className="orbita-opening-copy">
        <h1 id="earth-title"><span>Read the Earth.</span><span className="orbita-desktop-intro"> Discover how<br /> our region is changing through<br /> decades of real NASA data.</span></h1>
        <p className="orbita-mobile-copy">Six places. One changing region.<br />Explore the evidence beneath<br /> the surface of our planet.</p>
        <a className="orbita-mobile-copy orbita-label orbita-open-link" href="#region">Explore the Atlas <img src="/orbita/arrow.svg" alt="" /></a>
      </div>
      <p className="orbita-opening-note">Six places. Decades of NASA records.<br />A clearer view of environmental<br /> change across the Gulf.</p>
    </section>

    <section className="orbita-atlas" id="region" aria-labelledby="atlas-heading">
      <OrbitaHero scene="gulf" chapter="Chapter 02 / Regional atlas" heading="h2" titleId="atlas-heading"
        title={<><span className="orbita-desktop-title">Six places. One<br /> changing region.</span><span className="orbita-mobile-title">The Gulf,<br /> in view.</span></>}
        description="Begin with a place. Follow decades of observations to find what changed."
        note={<>The Gulf is our focus.<br /> A point is a sampling location,<br /> not a national average.</>} />
      <div className="orbita-width orbita-atlas-index">
        <p className="orbita-label">Select a study point / 06 locations</p>
        <ol>{points.map((site,i) => <li key={site.id}><Link href={site.href}>
          <img src="/orbita/point.svg" alt="" /><span className="orbita-label">{String(i+1).padStart(2,'0')}</span>
          <span><strong>{site.name}</strong><small>{site.latitude.toFixed(2)}° N / {site.longitude.toFixed(2)}° E</small></span>
        </Link></li>)}</ol>
        <p className="orbita-label orbita-atlas-caption">Orbital artwork / Illustrative. Study locations use source coordinates.</p>
        <details><summary>Open the interactive regional map</summary><MissionAtlas points={points} /></details>
      </div>
    </section>

    <section id="study" className="mission-width mission-observation" aria-labelledby="observation-title">
      <header><span className="mission-meta">02 / Read the evidence</span><h2 id="observation-title">A changing record.</h2>
        <p>How much has Bahrain warmed? Start with its annual mean air temperature, then compare the evidence across the region.</p>
        <p className="mission-slope">{slopePerDecade > 0 ? '+' : ''}{slopePerDecade.toFixed(3)} <small>{temperature.unit} / decade</small></p>
        <p>{significant ? 'Statistically significant' : 'Not statistically significant'} in the Bahrain point study. A trend does not establish its cause.</p>
        <Link href={explore + '&location=bahrain'} className="mission-text-link">Open Bahrain’s investigation ↗</Link>
      </header>
      <div className="mission-figure">
        <p className="mission-meta">NASA POWER / {study.firstMonth.slice(0, 4)}–{study.lastMonth.slice(0, 4)}</p>
        <AnnualTrace readings={temperature.annual} name="Bahrain mean air temperature" unit={temperature.unit} />
        <details><summary>Other Bahrain point-study signals</summary>
          {study.variables.slice(1).map(variable => <div className="mission-mini-trace" key={variable.id}>
            <h3>{variable.name}</h3>
            <p>{variable.trend.slopePerDecade.toFixed(variable.unit === '°C' ? 3 : 2)} {variable.unit} per decade · {variable.trend.significant ? 'Statistically significant' : 'Not statistically significant'}</p>
            <AnnualTrace readings={variable.annual} name={variable.name} unit={variable.unit} compact />
          </div>)}
        </details>
      </div>
    </section>

    <section id="method" className="mission-width mission-records" aria-labelledby="records-title">
      <header><span className="mission-meta">03 / Choose a signal</span><h2 id="records-title">Look for what changed.</h2>
        <p>Compare observations on shared dates and units. Check the slope, uncertainty and source before drawing a conclusion.</p>
        <Link className="mission-text-link" href="/methodology">How we test a trend ↗</Link></header>
      <ul className="mission-record-index">{links.map(([label, id], i) => {
        const variable = variables.find(v => v.dataset + ':' + v.id === id)!;
        return <li key={id}><Link href={explore + '&series=' + encodeURIComponent(id)}>
          <span className="mission-meta">{String(i + 1).padStart(2, '0')}</span><strong>{label}</strong><small>{variable.start}–{variable.end}</small><span aria-hidden="true">↗</span>
        </Link></li>;
      })}</ul>
    </section>
    <aside className="mission-native-callout"><div className="mission-width">
      <span className="mission-meta">Separate native-grid case study</span><h2>Bahrain in one MERRA-2 cell.</h2>
      <p>See how two authenticated granules become two observations on their original grid.</p>
      <Link className="mission-action" href="/investigate?mode=native-cell">Inspect the native cell ↗</Link>
    </div></aside>
    <details className="orbita-width orbita-extra-globe"><summary>Explore the interactive Blue Marble globe</summary>
      <div><LivingEarth><img src="/white-dust-earth.webp" width={960} height={960} alt="" /></LivingEarth></div>
      <a href="https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/">NASA Blue Marble · Reto Stöckli / Earth Observatory</a>
    </details>
  </div>;
}
