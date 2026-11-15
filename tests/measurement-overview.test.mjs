import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { measurementGroups, prepareMeasurements } from '../lib/measurement-overview.mjs';
import { trendFamily } from '../lib/series-analysis.mjs';

const read = async file => JSON.parse(await readFile(new URL('../lib/generated/' + file, import.meta.url), 'utf8'));
const [studies, expanded] = await Promise.all([read('studies.json'), read('expanded-series.json')]);
const bahrain = studies.findIndex(study => study.id === 'bahrain');

function loadGroup(id) {
  const { definitions } = measurementGroups.find(group => group.id === id);
  const records = definitions.map(({ id, archive }) => studies.map(study =>
    archive === 'legacy' ? study.variables.find(variable => variable.id === id)
      : expanded.find(record => record.id === id && record.location === study.id)));
  return { definitions, records };
}

test('air temperature aligns three archived Celsius series and retains independent trend results', () => {
  const { definitions, records } = loadGroup('air-temperature');
  const { measurements, comparison } = prepareMeasurements(definitions, records, bahrain, 1981, 2025, false);
  assert.deepEqual(definitions.map(variable => variable.id), ['T2M', 'T2M_MIN_AVG', 'T2M_MAX_AVG']);
  assert.deepEqual(measurements.map(row => row.unit), ['°C', '°C', '°C']);
  assert.deepEqual(comparison.map(row => row.period), Array.from({ length: 45 }, (_, i) => 1981 + i));
  assert.deepEqual(comparison.at(-1).values, records.map(series => series[bahrain].annual.at(-1).value));
  assert.deepEqual(measurements.map(row => row.trend), records.map(series => trendFamily(series.map(row => row.annual))[bahrain]));
});

test('SMAP preserves depth series, omits incomplete periods and never estimates a trend from nine years', () => {
  const { definitions, records } = loadGroup('power-smap');
  assert.deepEqual(definitions.map(variable => variable.id), ['SFMC', 'RZMC']);
  const annual = prepareMeasurements(definitions, records, bahrain, 2015, 2025, false);
  assert.deepEqual(annual.comparison.map(row => row.period), Array.from({ length: 9 }, (_, i) => 2016 + i));
  assert.deepEqual(annual.measurements.map(row => row.unit), ['m³/m³', 'm³/m³']);
  assert.ok(annual.measurements.every(row => row.trend.estimate === null && row.trend.eligibility === 'short'));
  const monthly = prepareMeasurements(definitions, records, bahrain, 2025, 2025, true);
  assert.equal(monthly.comparison.length, 11);
  assert.ok(monthly.comparison.every(row => row.period !== 202509));
  assert.deepEqual(prepareMeasurements(definitions, records, bahrain, 2025, 2025, false).comparison, []);
});
