import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { measurementGroups, prepareMeasurements } from '../lib/measurement-overview.mjs';
import { filterYears, trendFamily } from '../lib/series-analysis.mjs';

const read = async file => JSON.parse(await readFile(new URL('../lib/generated/' + file, import.meta.url), 'utf8'));
const [studies, expanded] = await Promise.all([read('studies.json'), read('expanded-series.json')]);
const records = [
  studies.map(study => study.variables.find(variable => variable.id === 'PRECTOTCORR')),
  studies.map(study => expanded.find(record => record.location === study.id && record.id === 'IMERG_PRECTOT')),
];
const precipitation = measurementGroups.find(group => group.id === 'precipitation');
const preparePrecipitation = (...args) => prepareMeasurements(precipitation.definitions, ...args);

test('annual charts use shared complete years and keep the two site-specific depths in mm', () => {
  for (const site of ['bahrain', 'muscat']) {
    const index = studies.findIndex(study => study.id === site);
    const { measurements, comparison } = preparePrecipitation(records, index, 2001, 2025, false);
    assert.deepEqual(measurements.map(measurement => measurement.unit), ['mm', 'mm']);
    assert.deepEqual(comparison.map(row => row.period), Array.from({ length: 25 }, (_, i) => 2001 + i));
    assert.deepEqual(comparison.find(row => row.period === 2024).values,
      records.map(product => product[index].annual.find(row => row.year === 2024).value));
  }
});

test('monthly plots keep rates and depths separate, with no paired series', () => {
  const { measurements, comparison } = preparePrecipitation(records, 0, 2025, 2025, true);
  assert.deepEqual(measurements.map(measurement => measurement.unit), ['mm/day', 'mm']);
  assert.deepEqual(comparison, []);
  assert.deepEqual(measurements.map(measurement => measurement.rows.find(row => row.period === 202502).values[0]),
    records.map(product => product[0].monthly.find(row => row.year === 2025 && row.month === 2).value));
});

test('each overview trend matches its own six-site family and handles unavailable coverage independently', () => {
  const first = 1981;
  const last = 2025;
  const { measurements, comparison } = preparePrecipitation(records, 0, first, last, false);
  assert.deepEqual(measurements.map(measurement => measurement.trend),
    records.map(product => trendFamily(product.map(record => filterYears(record.annual, first, last)))[0]));
  assert.deepEqual(measurements.map(measurement => measurement.trend.estimate.n), [45, 25]);
  assert.equal(comparison.length, 25);
  const early = preparePrecipitation(records, 0, 1981, 2000, false);
  assert.deepEqual(early.comparison, []);
  assert.equal(early.measurements[0].trend.estimate.n, 20);
  assert.equal(early.measurements[1].trend.estimate, null);
});
