'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibre from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { AtlasPoint } from './mission-atlas';

export default function MissionMap({ points, selected, focusPoint }: { points: AtlasPoint[]; selected?: string; focusPoint?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const reset = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    let map: maplibre.Map | undefined;
    try {
      maplibre.setWorkerUrl('/map-workers/maplibre-gl-worker.mjs');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)');
      const bounds: maplibre.LngLatBoundsLike = [[44, 21], [60, 32]];
      map = new maplibre.Map({
        container: host.current, bounds, fitBoundsOptions: { padding: 24 },
        maxZoom: 10, scrollZoom: false, dragRotate: false, pitchWithRotate: false, attributionControl: false,
        style: {
          version: 8,
          sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 19 } },
          layers: [{ id: 'basemap', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.85 } }],
        },
      });
      const instance = map;
      reset.current = () => instance.fitBounds(bounds, { padding: 24, duration: reduced.matches ? 0 : 550 });
      instance.on('load', () => { if (instance.isSourceLoaded('osm')) setReady(true); });
      instance.on('error', () => setReady(false));
      instance.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
      for (const [i, point] of points.entries()) {
        const link = document.createElement('a');
        link.href = point.href;
        link.className = 'mission-pin-dot';
        link.setAttribute('aria-label', point.name);
        if (point.id === selected) link.setAttribute('aria-current', 'location');
        link.textContent = String(i + 1).padStart(2, '0');
        new maplibre.Marker({ element: link }).setLngLat([point.longitude, point.latitude]).addTo(instance);
      }
      const focus = () => {
        const point = points.find(p => p.id === selected);
        if (focusPoint && point) instance.easeTo({ center: [point.longitude, point.latitude], zoom: Math.max(instance.getZoom(), 5.1),
          duration: reduced.matches ? 0 : 650 });
      };
      instance.on('load', focus);
    } catch {
      setReady(false);
    }
    return () => { reset.current = null; map?.remove(); };
  }, [points, selected, focusPoint]);
  return <>
    <div ref={host} className="mission-map-live" data-ready={ready} inert={!ready}
      role="region" aria-label="Interactive map of the Arabian Peninsula" />
    {ready && <button type="button" className="mission-map-reset" onClick={() => reset.current?.()}>Regional view</button>}
  </>;
}
