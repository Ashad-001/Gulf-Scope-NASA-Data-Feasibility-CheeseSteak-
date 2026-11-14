import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { HomeNav } from '../components/home-nav';

export const metadata: Metadata = {
  title: 'GulfScope | Earth system trends',
  description: 'Investigate decades of temperature and precipitation in Bahrain with verified NASA POWER data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>
    <a className="skip" href="#main">Skip to content</a>
    <header className="mast site-mast"><div className="shell mast-inner">
      <Link href="/" className="wordmark">
        <img src="/icon.svg" width={31} height={31} alt="" />
        <span>GulfScope</span>
      </Link>
      <HomeNav />
    </div></header>
    <main id="main">{children}</main>
    <footer className="shell footer"><span>GulfScope / NASA Space Apps Challenge 2026</span><a href="https://power.larc.nasa.gov/">NASA POWER ↗</a></footer>
  </body></html>;
}
