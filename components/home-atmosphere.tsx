'use client';

import { useEffect, useRef, useState } from 'react';

export function HomeAtmosphere() {
  const control = useRef<HTMLButtonElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const home = control.current?.closest<HTMLElement>('.living-home');
    const hero = home?.querySelector('.living-hero');
    if (!home || !hero || !('IntersectionObserver' in window)) return;

    const visibility = () => { home.dataset.homeVisible = String(!document.hidden); };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        target.dataset.motionVisible = String(entry.isIntersecting);
      }
    });
    observer.observe(hero);
    home.querySelectorAll('.home-haze').forEach(layer => observer.observe(layer));
    visibility();
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);

  return <>
    <div className="home-atmosphere" aria-hidden="true">
      <div className="home-haze"><span /></div>
      <div className="home-haze"><span /></div>
    </div>
    <div className="home-dust" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
    </div>
    <button ref={control} className="home-motion-control" type="button"
      aria-pressed={!paused} onClick={() => setPaused(value => !value)}>
      Atmospheric motion <span aria-hidden="true">· {paused ? 'Off' : 'On'}</span>
    </button>
  </>;
}
