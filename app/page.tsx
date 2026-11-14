import Link from 'next/link';
import { getStudy } from '../lib/study';
import { Contours } from '../components/contours';

export default function Home() {
  const study = getStudy()!;
  return <>
    <section className="hero">
      <div className="hero-photo" aria-hidden="true" />
      <Contours />
      <div className="shell hero-inner">
        <p className="eyebrow accent"><span className="signal" /> Earth system trends · Bahrain</p>
        <h1>Earth is always<br />changing.<br /><span>The evidence is<br />in its data.</span></h1>
        <p className="hero-prompt">Discover the trends.</p>
        <p className="hero-copy">Follow {study.completeness.years} years of NASA data to see how air temperature and precipitation have changed in the Arabian Gulf.</p>
        <Link className="action" href="/investigate">Begin investigation <span aria-hidden="true">↗</span></Link>
      </div>
      <div className="hero-caption"><span>26.07° N / 50.55° E</span><span>Illustrated orbital view</span></div>
    </section>
    <section className="shell intro">
      <div><p className="eyebrow">The Bahrain study</p><h2>A record of change</h2></div>
      <div><p>GulfScope traces three environmental series from {study.firstMonth.slice(0, 4)} to {study.lastMonth.slice(0, 4)}. Explore each year, compare the long-term trend and see how much uncertainty surrounds it.</p>
      <p>NASA POWER supplies the historical meteorology from MERRA‑2, a gridded reanalysis that combines observations with an atmospheric model.</p>
      <Link href="/investigate#provenance">Inspect the NASA sources ↗</Link></div>
    </section>
  </>;
}
