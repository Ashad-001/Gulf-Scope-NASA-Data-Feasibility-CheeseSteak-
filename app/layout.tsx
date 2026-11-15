import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import './mission.css';
import './orbita.css';
import { HomeNav } from '../components/home-nav';

export const metadata: Metadata = {
  title: 'GulfScope | Earth system trends',
  description: 'Investigate Earth-system records across six Gulf study points with archived NASA data.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="orbita">
    <a className="skip" href="#main">Skip to content</a>
    <header className="orbita-header">
      <div className="orbita-header-inner">
        <Link href="/" className="orbita-wordmark">GulfScope</Link>
        <HomeNav />
      </div>
    </header>
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="editorial-shell editorial-footer">
      <div>
        <Link href="/" className="editorial-footer-brand">GulfScope</Link>
        <p>NASA Space Apps Challenge 2026</p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/methodology">Methodology</Link>
        <Link href="/data-sources">Data sources</Link>
        <Link href="/about">About</Link>
        <a href="https://power.larc.nasa.gov/">NASA POWER <span aria-hidden="true">↗</span></a>
      </nav>
    </footer>
  </body></html>;
}
