'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';

const links = [
  { href: '/#region', label: 'Regional atlas' },
  { href: '/investigate?mode=series', label: 'Investigation' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/data-sources', label: 'Data Sources' },
  { href: '/about', label: 'About' },
];

export function HomeNav() {
  const menu = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const home = usePathname() === '/';
  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }
  return <nav className="orbita-nav" aria-label="Main navigation" data-home={home}>
    <div className="orbita-shortcuts">
      <Link href="/#region">{home ? 'Explore the Atlas' : 'Atlas'} {home && <img src="/orbita/arrow.svg" alt="" />}</Link>
      {!home && <Link href="/investigate?mode=series">Investigation</Link>}
    </div>
    <details ref={menu} onKeyDown={event => {
      if (event.key === 'Escape' && menu.current?.open) {
        event.preventDefault();
        closeMenu();
        summary.current?.focus();
      }
    }}>
      <summary ref={summary} aria-label="Menu"><span>Menu</span><img src="/orbita/menu.svg" alt="" /></summary>
      <div className="orbita-menu-links">{links.map(({ href, label }) =>
        <Link key={href} href={href} onClick={closeMenu}>{label}</Link>)}</div>
    </details>
  </nav>;
}
