import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { loadDataset } from './build-analysis-dataset.mjs';
import { analyzeTrend, holmAdjust } from './trend-analysis.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(await read('data/processed/dataset-manifest.json'));
assert.equal(manifest.schemaVersion, 2);
const validated = await loadDataset();
for (const key of ['source', 'minimumSource', 'dailyValidationSource']) {
  assert.deepEqual(manifest[key], validated[key]);
}

async function rows(file, expected) {
  const bytes = await read(`data/processed/${file}`);
  assert.equal(sha256(bytes), manifest.files[file].sha256);
  const [header, ...lines] = bytes.toString('utf8').trimEnd().split(/\r?\n/);
  assert.equal(header, Object.keys(expected[0]).join(','));
  assert.deepEqual(lines, expected.map(row => Object.values(row).join(',')));
  return expected.map((row, index) => {
    const values = lines[index].split(',');
    return Object.fromEntries(Object.entries(row).map(([key, value], i) =>
      [key, typeof value === 'boolean' ? values[i] === 'true' : Number(values[i])]));
  });
}

const [monthly, annual] = await Promise.all([
  rows('bahrain-monthly.csv', validated.monthly),
  rows('bahrain-annual.csv', validated.annual),
]);
const definitions = [
  { id: 'T2M', name: 'Mean air temperature at 2 m', short: 'Mean temperature', originalUnit: '°C', unit: '°C',
    monthlyKey: 't2m_c', annualKey: 'mean_t2m_c', description: 'Annual mean of near-surface air temperature, weighted by the number of days in each month.' },
  { id: 'T2M_MIN_AVG', name: 'Mean daily minimum air temperature', short: 'Daily minimum', originalUnit: '°C', unit: '°C',
    monthlyKey: 't2m_min_avg_c', annualKey: 'mean_daily_min_t2m_c', description: 'The annual average of daily lows at 2 m, using calendar-day weights on the NASA monthly averages.' },
  { id: 'PRECTOTCORR', name: 'Estimated precipitation accumulation', short: 'Precipitation', originalUnit: 'mm/day', unit: 'mm',
    monthlyKey: 'prectotcorr_mm_day', annualKey: 'estimated_precipitation_mm', description: 'Estimated annual precipitation depth. Each monthly mean daily rate is multiplied by its calendar days, then summed.' },
];
function buildVariables(monthly, annual) {
const variables = definitions.map(({ monthlyKey, annualKey, ...definition }) => {
  const values = annual.map(row => row[annualKey]);
  const result = analyzeTrend(values);
  const residuals = values.map((value, index) => value - index * result.slopePerYear).sort((a, b) => a - b);
  const midpoint = Math.floor(residuals.length / 2);
  const intercept = (residuals[midpoint] + residuals[Math.floor((residuals.length - 1) / 2)]) / 2;
  assert.ok(Number.isFinite(result.hamedRao.p), 'Expected a usable modified test');
  return {
    ...definition,
    monthly: monthly.map(row => ({ year: row.year, month: row.month, days: row.days, value: row[monthlyKey],
      ...(monthlyKey === 'prectotcorr_mm_day' ? { estimatedDepth: row.estimated_precipitation_mm } : {}) })),
    annual: annual.map(row => ({ year: row.year, days: row.days, value: row[annualKey] })),
    trend: { ...result, intercept,
      adjustedP: 0, significant: false },
  };
});
const adjusted = holmAdjust(variables.map(variable => variable.trend.hamedRao.p));
variables.forEach(({ trend }, index) => {
  trend.adjustedP = adjusted[index];
  trend.significant = trend.adjustedP <= 0.05;
});
return variables;
}
const study = {
  schemaVersion: 1, id: 'bahrain', name: 'Bahrain', region: 'Arabian Gulf',
  ...manifest.source.coordinates, grid: manifest.source.gridDegrees,
  source: 'NASA POWER', product: 'MERRA-2 reanalysis',
  firstMonth: manifest.firstMonth, lastMonth: manifest.lastMonth,
  completeness: { months: monthly.length, years: annual.length, missing: 0 },
  provenance: [manifest.source, manifest.minimumSource, manifest.dailyValidationSource],
  processedChecksums: manifest.files,
  methodology: {
    alpha: 0.05,
    analysis: 'Sen’s slope summarizes the median rate of change between pairs of years. Hamed–Rao modified Mann–Kendall tests for a monotonic trend accounting for screened serial dependence. Holm adjustment controls familywise error across the three outcomes.',
    interval: 'Approximate 95% slope interval from a moving-block bootstrap of detrended residuals, with four-year blocks and 9,999 replicates.',
    limits: 'MERRA-2 combines observations with a numerical model. It represents a coarse grid estimate. The series cannot resolve individual reclaimed areas or establish causes of change.',
    precipitation: 'The precipitation interval is sensitive to bootstrap block length. Its upper bound changes sign across the reported sensitivity checks, and the primary Holm-adjusted test does not detect a significant trend.',
  },
  variables: buildVariables(monthly, annual),
};
async function buildComparator(id, name, region, latitude, longitude) {
  const file = `nasa-power-${id}-1981-2025`;
  const bytes = await read(`data/raw/${file}.json`);
  const source = JSON.parse(await read(`data/raw/${file}.metadata.json`));
  assert.equal(source.bodyFile, `${file}.json`);
  assert.equal(source.sha256, sha256(bytes));
  assert.equal(source.bytes, bytes.length);
  assert.equal(source.status, 200);
  const payload = JSON.parse(bytes);
  assert.equal(payload.type, 'Feature');
  assert.equal(payload.geometry.type, 'Point');
  assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [longitude, latitude]);
  assert.ok(payload.header.sources.includes('MERRA2'));
  assert.equal(payload.header.time_standard, 'LST');
  assert.equal(payload.header.start, '19810101');
  assert.equal(payload.header.end, '20251231');
  assert.ok(Number.isFinite(payload.header.fill_value));
  const series = payload.properties.parameter;
  for (const [id, unit] of Object.entries({ T2M: 'C', T2M_MIN_AVG: 'C', PRECTOTCORR: 'mm/day' })) {
    assert.equal(payload.parameters[id].units, unit);
    assert.equal(Object.keys(series[id]).filter(key => !key.endsWith('13')).length, 540);
  }
  const localMonthly = monthly.map(({ year, month, days }) => {
    const key = `${year}${String(month).padStart(2, '0')}`;
    const [t2m_c, t2m_min_avg_c, prectotcorr_mm_day] = definitions.map(({ id }) => {
      const value = series[id][key];
      assert.ok(Number.isFinite(value) && value !== payload.header.fill_value);
      assert.ok(Math.abs(value * 100 - Math.round(value * 100)) < 1e-9);
      return value;
    });
    assert.ok(t2m_min_avg_c <= t2m_c && prectotcorr_mm_day >= 0);
    return { year, month, days, t2m_c, t2m_min_avg_c, prectotcorr_mm_day,
      estimated_precipitation_mm: Math.round(prectotcorr_mm_day * 100) * days / 100 };
  });
  const localAnnual = annual.map(({ year, days }, index) => {
    const rows = localMonthly.slice(index * 12, index * 12 + 12);
    const weighted = key => rows.reduce((sum, row) => sum + Math.round(row[key] * 100) * row.days, 0);
    return { year, days, mean_t2m_c: weighted('t2m_c') / (100 * days),
      mean_daily_min_t2m_c: weighted('t2m_min_avg_c') / (100 * days),
      estimated_precipitation_mm: weighted('prectotcorr_mm_day') / 100 };
  });
  return { ...study, id, name, region, latitude, longitude,
    provenance: [source], processedChecksums: {},
    methodology: { ...study.methodology,
      precipitation: 'A moving-block interval depends on the selected block length. The primary significance decision uses the Holm-adjusted Hamed–Rao test.' },
    variables: buildVariables(localMonthly, localAnnual) };
}
await mkdir(new URL('lib/generated/', root), { recursive: true });
const studies = [study,
  await buildComparator('riyadh', 'Riyadh', 'Saudi Arabia', 24.71, 46.68),
  await buildComparator('muscat', 'Muscat', 'Oman', 23.59, 58.41),
];
await writeFile(new URL('lib/generated/studies.json', root), JSON.stringify(studies) + '\n');
await mkdir(new URL('public/map-workers/', root), { recursive: true });
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
  await copyFile(new URL(`node_modules/maplibre-gl/dist/${file}`, root), new URL(`public/map-workers/${file}`, root));
}
