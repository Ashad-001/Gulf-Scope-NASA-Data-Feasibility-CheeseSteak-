'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Study } from '../lib/study';

export function StudyMap({ study }: { study: Pick<Study, 'latitude' | 'longitude' | 'name'> }) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tileError, setTileError] = useState(false);
  const { latitude, longitude, name } = study;
  useEffect(() => {
    if (!host.current) return;
    let map: maplibregl.Map | undefined;
    try {
      maplibregl.setWorkerUrl('/map-workers/maplibre-gl-worker.mjs');
      map = new maplibregl.Map({
        container: host.current, center: [longitude, latitude], zoom: 6, minZoom: 3, maxZoom: 10,
        scrollZoom: false, dragRotate: false, pitchWithRotate: false, attributionControl: false,
        cooperativeGestures: true,
        style: {
          version: 8,
          sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256,
            maxzoom: 19, attribution: '© OpenStreetMap contributors' } },
          layers: [{ id: 'basemap', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.7, 'raster-opacity': 0.92 } }],
        },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('error', () => setTileError(true));
      new maplibregl.Marker({ color: '#08765f' }).setLngLat([longitude, latitude])
        .setPopup(new maplibregl.Popup().setText(`${name} sampling point`)).addTo(map);
    } catch {
      setUnavailable(true);
    }
    return () => map?.remove();
  }, [latitude, longitude, name]);
  return <>
    <div ref={host} className="map" role="region" aria-label={`Interactive map centered on ${name}`} hidden={unavailable} />
    {unavailable && <p className="map-status" role="status">Interactive map unavailable. Coordinates are listed below.</p>}
    {!unavailable && tileError && <p className="map-status" role="status">The basemap may be unavailable. Coordinates are listed below.</p>}
    <div className="map-meta"><span>{latitude.toFixed(2)}° N / {longitude.toFixed(2)}° E</span><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a></div>
  </>;
}
