'use client';

import { useState } from 'react';

type Reading = { year: number; value: number };

export function AnnualTrace({ readings, unit, name, compact = false }: {
  readings: Reading[]; unit: string; name: string; compact?: boolean;
}) {
  const [index, setIndex] = useState(readings.length - 1);
  const first = readings[0];
  const last = readings[readings.length - 1];
  const selected = readings[index];
  const width = 600;
  const height = compact ? 65 : 150;
  const min = Math.min(...readings.map(row => row.value));
  const max = Math.max(...readings.map(row => row.value));
  const x = (i: number) => 8 + i / (readings.length - 1) * (width - 16);
  const y = (value: number) => height - 8 - (value - min) / (max - min || 1) * (height - 16);

  return <div className={compact ? 'annual-trace compact' : 'annual-trace'}>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      {[.2, .5, .8].map(ratio => <line key={ratio} x1="8" x2={width - 8} y1={ratio * height} y2={ratio * height} className="trace-grid" />)}
      <polyline className="trace-line" points={readings.map((row, i) => `${x(i)},${y(row.value)}`).join(' ')} />
      <line className="trace-cursor" x1={x(index)} x2={x(index)} y1="4" y2={height - 4} />
      <circle cx={x(index)} cy={y(selected.value)} r="4" fill="currentColor" />
    </svg>
    <div className="trace-controls">
      <input type="range" min={0} max={readings.length - 1} value={index} onChange={event => setIndex(Number(event.target.value))}
        aria-label={`${name} year`} aria-valuetext={`${selected.year}, ${selected.value.toFixed(2)} ${unit}`} />
      <div className="trace-labels"><span>{first.year}</span><output>{selected.year} · {selected.value.toFixed(2)} {unit}</output><span>{last.year}</span></div>
    </div>
  </div>;
}
