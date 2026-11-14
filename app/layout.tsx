import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'GulfScope | Earth system trends',
  description: 'Investigate decades of temperature and precipitation in Bahrain with verified NASA POWER data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip" href="#main">Skip to content</a>
    <header className="mast"><div className="shell mast-inner">
      <Link href="/" className="wordmark">
        {/* The approved Figma export has a fixed 31 × 31 viewport. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/orbital-g-light.svg" width={31} height={31} alt="" />
        <span>GulfScope</span>
      </Link>
      <nav aria-label="Main navigation"><Link href="/investigate">Investigation</Link><Link href="/investigate#method">Methodology</Link></nav>
    </div></header>
    <main id="main">{children}</main>
    <footer className="shell footer"><span>GulfScope / NASA Space Apps Challenge 2026</span><a href="https://power.larc.nasa.gov/">NASA POWER ↗</a></footer>
  </body></html>;
}
