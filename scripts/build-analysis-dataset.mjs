import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const units = { T2M: 'C', T2M_MIN: 'C', PRECTOTCORR: 'mm/day' };

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

async function readSnapshot(name, pinnedSha256, start, end) {
  const stem = `data/raw/nasa-power-bahrain-${name}`;
  const [raw, metadata] = await Promise.all([
    readFile(new URL(`${stem}.json`, root)),
    readFile(new URL(`${stem}.metadata.json`, root), 'utf8').then(text => JSON.parse(text.replace(/^\uFEFF/, ''))),
  ]);
  assert.equal(digest(raw), pinnedSha256);
  assert.equal(metadata.sha256, pinnedSha256);
  assert.equal(metadata.bodyFile, stem.split('/').at(-1) + '.json');
  assert.equal(raw.length, metadata.bytes);
  const payload = JSON.parse(raw);
  assert.equal(payload.type, 'Feature');
  assert.equal(payload.geometry.type, 'Point');
  assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [50.55, 26.07]);
  assert.ok(payload.header.sources.includes('MERRA2'));
  assert.equal(payload.header.start, start);
  assert.equal(payload.header.end, end);
  assert.equal(payload.header.time_standard, 'LST');
  assert.equal(metadata.status, 200);
  assert.match(metadata.contentType, /^application\/json\b/i);
  assert.ok(Number.isFinite(payload.header.fill_value));
  return {
    payload,
    source: {
      ...metadata, rawPath: `${stem}.json`, metadataPath: `${stem}.metadata.json`,
      coordinates: { latitude: 26.07, longitude: 50.55 },
      gridDegrees: { latitude: 0.5, longitude: 0.625 },
      nasaHeader: payload.header,
    },
  };
}

function readValue(payload, key, date) {
  const value = payload.properties.parameter[key][date];
  assert.ok(Number.isFinite(value) && value !== payload.header.fill_value, `Invalid ${key} at ${date}`);
  assert.ok(Math.abs(value * 100 - Math.round(value * 100)) < 1e-9, `Unexpected source precision at ${date}`);
  return value;
}

export async function loadDataset() {
  const [original, minimum, daily] = await Promise.all([
    readSnapshot('2026-11-14T12-43-27.267Z', 'c853b14a7fd81574ef6c6154480e34dcf5f355adea4cdbcaae3aaf78d2a6be6a', '19810101', '20251231'),
    readSnapshot('min-avg-1981-2025', 'ef31b430be3c87c356e28c2aa614fba148f2174b3aab239dfbff05049a8ed12d', '19810101', '20251231'),
    readSnapshot('daily-min-2025-02', '6fced0a41cc5d50dd90e60ce089c255ae8190b1f6c9076e71ba788bd82894dd8', '20250201', '20250228'),
  ]);
  const { payload, source } = original;
  const keys = Object.keys(units);
  const years = Array.from({ length: 45 }, (_, index) => 1981 + index);
  const annualKeys = new Set(years.map(year => `${year}13`));
  for (const key of keys) {
    assert.equal(payload.parameters[key].units, units[key]);
    assert.equal(Object.keys(payload.properties.parameter[key]).filter(date => !annualKeys.has(date)).length, 540);
  }
  assert.equal(minimum.payload.parameters.T2M_MIN_AVG.units, 'C');
  assert.match(minimum.payload.parameters.T2M_MIN_AVG.longname, /Minimum Average/i);
  const minimumKeys = Object.keys(minimum.payload.properties.parameter.T2M_MIN_AVG);
  assert.equal(minimumKeys.filter(date => !annualKeys.has(date)).length, 540);
  assert.equal(daily.payload.parameters.T2M_MIN.units, 'C');
  const dailyCount = daysInMonth(2025, 2);
  assert.equal(Object.keys(daily.payload.properties.parameter.T2M_MIN).length, dailyCount);
  const dailyValues = Array.from({ length: dailyCount }, (_, index) =>
    readValue(daily.payload, 'T2M_MIN', `202502${String(index + 1).padStart(2, '0')}`));
  const dailyMeanC = dailyValues.reduce((sum, value) => sum + Math.round(value * 100), 0) / (100 * dailyCount);
  const dailyMinimumC = Math.min(...dailyValues);
  const monthlyMeanC = readValue(minimum.payload, 'T2M_MIN_AVG', '202502');
  assert.ok(Math.abs(monthlyMeanC - dailyMeanC) <= 0.005, 'February 2025 mean differs beyond rounding');
  assert.equal(dailyMinimumC, readValue(payload, 'T2M_MIN', '202502'));
  const minimumValidation = { month: '2025-02', dailyCount, dailyMeanC, dailyMinimumC, monthlyMeanC };

  const monthly = [];
  const annual = [];
  for (const year of years) {
    const months = [];
    for (let month = 1; month <= 12; month++) {
      const date = `${year}${String(month).padStart(2, '0')}`;
      const [temperature, extreme, rate] = keys.map(key => readValue(payload, key, date));
      const meanMinimum = readValue(minimum.payload, 'T2M_MIN_AVG', date);
      assert.ok(rate >= 0 && extreme <= meanMinimum && meanMinimum <= temperature, `Inconsistent values at ${date}`);
      const days = daysInMonth(year, month);
      months.push({
        year, month, days, t2m_c: temperature, t2m_min_c: extreme, t2m_min_avg_c: meanMinimum, prectotcorr_mm_day: rate,
        estimated_precipitation_mm: Math.round(rate * 100) * days / 100,
      });
    }
    const days = months.reduce((sum, row) => sum + row.days, 0);
    // Sum the snapshot's exact hundredths before dividing to preserve ties.
    const weighted = key => months.reduce((sum, row) => sum + Math.round(row[key] * 100) * row.days, 0);
    monthly.push(...months);
    annual.push({
      year, days,
      mean_t2m_c: weighted('t2m_c') / (100 * days),
      day_weighted_t2m_min_c: weighted('t2m_min_c') / (100 * days),
      mean_daily_min_t2m_c: weighted('t2m_min_avg_c') / (100 * days),
      estimated_precipitation_mm: weighted('prectotcorr_mm_day') / 100,
      valid_t2m_months: months.length,
      valid_t2m_min_months: months.length,
      valid_t2m_min_avg_months: months.length,
      valid_precipitation_months: months.length,
      complete: months.length === 12,
    });
  }
  return {
    monthly, annual, source, minimumSource: minimum.source, dailyValidationSource: daily.source, minimumValidation,
  };
}

function csv(rows) {
  const columns = Object.keys(rows[0]);
  return [columns.join(','), ...rows.map(row => columns.map(key => row[key]).join(','))].join('\n') + '\n';
}

async function build() {
  const { monthly, annual, source, minimumSource, dailyValidationSource, minimumValidation } = await loadDataset();
  const outputs = {
    'bahrain-monthly.csv': csv(monthly),
    'bahrain-annual.csv': csv(annual),
  };
  const manifest = {
    schemaVersion: 2, source, minimumSource, dailyValidationSource, minimumValidation,
    monthlyRecords: monthly.length, annualRecords: annual.length,
    firstMonth: '1981-01', lastMonth: '2025-12',
    validMonthlyCounts: Object.fromEntries([...Object.keys(units), 'T2M_MIN_AVG'].map(key => [key, monthly.length])),
    sourceUnits: { ...units, T2M_MIN_AVG: 'C' },
    annualMinimumDefinition: 'Calendar-day-weighted mean of monthly T2M_MIN_AVG. T2M_MIN extrema remain descriptive.',
    precipitationDefinition: 'Estimated depth = source rate (mm/day) × calendar days; annual depth = sum of monthly estimates.',
    files: Object.fromEntries(Object.entries(outputs).map(([file, content]) => [file, { sha256: digest(content) }])),
  };
  const directory = new URL('data/processed/', root);
  await mkdir(directory, { recursive: true });
  for (const [file, content] of Object.entries(outputs)) {
    await writeFile(new URL(file, directory), content);
  }
  await writeFile(new URL('dataset-manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}
