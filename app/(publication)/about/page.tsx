import type { Metadata } from 'next';
import Link from 'next/link';
import { OrbitaHero } from '../../../components/orbita-hero';
import { MissionAtlas } from '../../../components/mission-atlas';
import { getLocations } from '../../../lib/study';
import { JournalContents } from '../journal-contents';

export const metadata: Metadata = {
  title: 'About | GulfScope',
  description: 'An independent Space Apps project exploring environmental change across the Gulf.',
};

const countries = ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi Arabia', 'United Arab Emirates'];
const principles = [
  ['Transparency', 'Show the measurement', 'Keep the units, month, spatial footprint and source attached to each value.'],
  ['Reproducibility', 'Keep the method visible', 'Document cell selection, unit conversion, quality checks and statistical choices.'],
  ['Scientific caution', 'State where evidence stops', 'Match the conclusion to the record’s length and geographic resolution.'],
];

export default function About() {
  const points = getLocations().map(site => ({ ...site, href: '/investigate?mode=series&location=' + site.id }));
  return <article className="orbita-publication orbita-about">
    <OrbitaHero scene="earth" chapter="08 / About GulfScope" title={<>We begin<br /> in the Gulf.</>}
      description="An independent atlas for reading environmental change with scientific care."
      note={<>Independent Space Apps project<br />Not a NASA-endorsed product</>} />
    <div className="orbita-width orbita-commitments">
      <p className="orbita-label">Our commitments / 2026</p>
      <div>
        <section><p className="orbita-label">01</p><h2>The region</h2><p>Bahrain was the starting point. Six study locations invite a broader comparison across the Peninsula.</p></section>
        <section><p className="orbita-label">02</p><h2>The evidence</h2><p>Every finding should be traceable to a product, an archive and a documented method.</p></section>
        <section><p className="orbita-label">03</p><h2>The limits</h2><p>A sampled location is not a country, a coarse cell is not a street, and a trend does not establish cause.</p></section>
      </div>
      <nav className="orbita-evidence-links" aria-label="Explore GulfScope">
        <Link href="/investigate?mode=series">Explore the Field Desk</Link><Link href="/investigate?mode=native-cell">View the native Bahrain case</Link><Link href="/methodology">Read the methodology</Link>
      </nav>
    </div>
    <div className="mission-width journal-layout">
      <JournalContents items={[["region","The Gulf region"],["principles","Our principles"],["challenge","The challenge"]]} />
      <div className="journal-body">
    <section className="publication-section" id="region">
      <p className="publication-label">One connected region</p>
      <h2>Six countries. Shared systems. Different local stories.</h2>
      <MissionAtlas points={points} />
      <ul className="publication-countries">{countries.map(country => <li key={country}>{country}</li>)}</ul>
      <p>Heat and rainfall matter to daily life and water planning across the Gulf. Bahrain was the starting point for the project’s temperature and precipitation study. Its islands and surrounding water make it a useful case for showing how much area one reanalysis value represents.</p>
      <p>Today the atlas shows two verified native-grid months for Bahrain. Separate NASA POWER records support longer point studies for Bahrain, Kuwait City, Muscat, Doha, Riyadh and Abu Dhabi. Historical native-grid coverage across the GCC is future work.</p>
    </section>
    <section className="publication-section" id="principles">
      <p className="publication-label">What guides the work</p>
      <h2>How we present evidence.</h2>
      <ol className="publication-grid publication-grid-three">{principles.map(([label, title, detail], i) => <li key={title} className="publication-panel">
        <p className="publication-label">{label}</p><h3>{String(i + 1).padStart(2, '0')} / {title}</h3><p>{detail}</p>
      </li>)}</ol>
    </section>
    <section className="publication-panel publication-invitation" id="challenge">
      <h2>The Gulf is part of a changing Earth.</h2>
      <p>For <a href="https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/">Be An Earth System Trend Detective!</a>, GulfScope demonstrates how to trace a reading to its source and inspect the evidence behind a trend.</p>
      <Link className="publication-cta" href="/investigate?mode=series">Explore the study atlas ↗</Link>
      <Link href="/investigate?mode=native-cell">Read the native Bahrain proof ↗</Link>
    </section>
      </div>
    </div>
  </article>;
}
