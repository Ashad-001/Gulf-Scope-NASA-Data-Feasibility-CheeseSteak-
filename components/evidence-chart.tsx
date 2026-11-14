'use client';

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type PlotRow = { year: number; [series: string]: number };
type Series = { key: string; name: string; color: string; dash?: string };

export default function EvidenceChart({ rows, series, unit, year, selectYear, inspectYear }: {
  rows: PlotRow[]; series: Series[]; unit: string; year?: number;
  selectYear?: (year: number) => void; inspectYear?: (year: number) => void;
}) {
  const compare = !selectYear;
  const last = rows.at(-1)!;
  const labelOrder = [...series].sort((a, b) => last[b.key] - last[a.key]);
  const values = rows.flatMap(row => series.map(item => row[item.key]));
  const range = Math.max(...values) - Math.min(...values);
  return <div className="field-plot">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} accessibilityLayer margin={{ top: 16, left: 4, right: compare ? 66 : 16, bottom: 16 }}
        onClick={event => {
          if (event?.activeLabel !== undefined) selectYear?.(Number(event.activeLabel));
        }}
        onMouseMove={event => {
          if (event?.activeLabel !== undefined) inspectYear?.(Number(event.activeLabel));
        }}>
        <CartesianGrid vertical={false} stroke="#d5d6d8" />
        <XAxis dataKey="year" minTickGap={18} tick={{ fontSize: 11 }} label={{ value: 'Year', position: 'insideBottom', offset: -10 }} />
        <YAxis width={48} domain={['auto', 'auto']} tick={{ fontSize: 11 }}
          label={{ value: unit, angle: -90, position: 'insideLeft' }} />
        <Tooltip isAnimationActive={false} formatter={value => `${Number(value).toFixed(2)} ${unit}`} />
        {year !== undefined && <ReferenceLine x={year} stroke="#535b68" strokeDasharray="4 4" />}
        {series.map(item => <Line key={item.key} dataKey={item.key} name={item.name} stroke={item.color}
          strokeDasharray={item.dash} strokeWidth={2} type="linear" isAnimationActive={false}
          dot={({ cx, cy, payload, index }) => {
            if (cx === undefined || cy === undefined || !Number.isFinite(cx) || !Number.isFinite(cy)) return <g key={index} />;
            if (compare && index === rows.length - 1) {
              const labelIndex = labelOrder.indexOf(item);
              const highest = last[labelOrder[0].key];
              const difference = highest - last[item.key];
              const offset = difference < range * .15 ? labelIndex * 13 : 0;
              return <g key={index}>
                <line x1={cx} y1={cy} x2={cx + 7} y2={cy + offset} stroke={item.color} />
                <text x={cx + 9} y={cy + offset} dy=".32em" fill={item.color} fontSize="11" fontWeight="700">{item.name}</text>
              </g>;
            }
            return payload?.year === year && item.key === 'value'
              ? <circle key={index} cx={cx} cy={cy} r={4.5} fill={item.color} stroke="white" />
              : <g key={index} />;
          }} />)}
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
