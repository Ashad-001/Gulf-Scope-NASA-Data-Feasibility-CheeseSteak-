'use client';

import dynamic from 'next/dynamic';

export type AtlasPoint = { id: string; name: string; latitude: number; longitude: number; href: string };
const Map = dynamic(() => import('./mission-map'), { ssr: false });

export function MissionAtlas({ points, selected, focusPoint }: { points: AtlasPoint[]; selected?: string; focusPoint?: boolean }) {
  return <div className="mission-map">
    <div className="mission-coordinate-grid" aria-label="Regional coordinate plot">
      <span className="mission-grid-north">33° N / 43° E</span><span className="mission-grid-east">62° E</span>
      {points.map((point, i) => <a key={point.id} href={point.href} className="mission-pin-dot"
        aria-label={point.name} aria-current={point.id === selected ? 'location' : undefined}
        style={{left: (point.longitude - 43) / 19 * 100 + '%', top: (33 - point.latitude) / 13 * 100 + '%'}}>
        {String(i + 1).padStart(2, '0')}
      </a>)}
    </div>
    <Map points={points} selected={selected} focusPoint={focusPoint} />
    <div className="mission-map-credit">Study points · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>
  </div>;
}
