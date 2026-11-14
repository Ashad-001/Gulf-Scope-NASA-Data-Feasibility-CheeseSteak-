'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';

const links = [
  { href: '/#study', label: 'The study' },
  { href: '/#method', label: 'Method' },
  { href: '/investigate', label: 'Investigate ↗' },
];

export function HomeNav() {
  const onHome = usePathname() === "/";
  const items = onHome ? links.map(item => ({ ...item, href: item.href.replace(/^\/#/, "#") })) : [links[0], { href: "/investigate#method", label: "Methodology" }, links[2]];
  const menu = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const close = () => { if (menu.current) menu.current.open = false; };
  return <>
    <nav className="home-links" aria-label="Main navigation">
      {items.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
    </nav>
    <details className="home-menu" ref={menu} onKeyDown={event => {
      if (event.key === 'Escape' && menu.current?.open) {
        close();
        summary.current?.focus();
      }
    }}>
      <summary ref={summary}>Menu <span aria-hidden="true">≡</span></summary>
      <nav aria-label="Mobile navigation">
        {items.map(({ href, label }) => <Link key={href} href={href} onClick={() => {
          close();
          if (href.startsWith('#')) summary.current?.focus({ preventScroll: true });
        }}>{label}</Link>)}
      </nav>
    </details>
  </>;
}
