'use client';

import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { BahrainPilot } from '../lib/bahrain-pilot';

export default function BahrainCellMap({ cell }: { cell: BahrainPilot['cell'] }) {
  const host = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [tileError, setTileError] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const [w, s, e, n] = cell.bounds;
    let map: maplibregl.Map | undefined;
    let observer: ResizeObserver | undefined;
    try {
      maplibregl.setWorkerUrl('/map-workers/maplibre-gl-worker.mjs');
      map = new maplibregl.Map({
        container: host.current,
        bounds: [[w, s], [e, n]],
        fitBoundsOptions: { padding: 42, duration: 0 },
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
        cooperativeGestures: true,
        style: {
          version: 8,
          sources: {
            osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256, attribution: '© OpenStreetMap contributors', maxzoom: 19 },
            cell: { type: 'geojson', data: { type: 'Feature', properties: {},
              geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } } },
          },
          layers: [
            { id: 'geography', type: 'raster', source: 'osm', paint: { 'raster-saturation': -0.7 } },
            { id: 'cell-fill', type: 'fill', source: 'cell', paint: { 'fill-color': '#54858a', 'fill-opacity': 0.20 } },
            { id: 'cell-outline', type: 'line', source: 'cell', paint: { 'line-color': '#315d62', 'line-width': 2 } },
          ],
        },
      });
      observer = new ResizeObserver(() => {
        map?.resize();
        map?.fitBounds([[w, s], [e, n]], { padding: 38, duration: 0 });
      });
      observer.observe(host.current);
      map.on('error', () => setTileError(true));
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
      new maplibregl.Marker({ color: '#17191c' })
        .setLngLat([cell.reference[0], cell.reference[1]])
        .setPopup(new maplibregl.Popup().setText('Bahrain POWER reference point'))
        .addTo(map);
    } catch {
      setUnavailable(true);
    }
    return () => {
      observer?.disconnect();
      map?.remove();
    };
  }, [cell]);

  return <>
    <div className="pilot-map" ref={host} role="region" aria-label="Bahrain derived MERRA-2 grid-cell footprint and reference point" hidden={unavailable} />
    {unavailable && <p role="status">Interactive map unavailable. Cell bounds and reference coordinates are in the provenance below.</p>}
    {!unavailable && tileError && <p role="status">The basemap or a map layer may be unavailable. See the verified coordinates below.</p>}
  </>;
}
