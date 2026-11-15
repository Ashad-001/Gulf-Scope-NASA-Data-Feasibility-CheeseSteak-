import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { aggregateDaily } from '../scripts/load-daily-hydrology.mjs';
import { plotPeriods } from '../lib/plot-periods.mjs';
import { test } from 'node:test';
import { loadExpandedSeries } from '../scripts/generate-series-catalog.mjs';
import { variables, nativeVariable } from '../lib/series-catalog.mjs';
import { commonPeriods, filterYears, selectPeriod, seriesStatus, trendFamily } from '../lib/series-analysis.mjs';

const sites = [
  ['bahrain', 26.07, 50.55], ['riyadh', 24.71, 46.68], ['muscat', 23.59, 58.41],
  ['kuwait-city', 29.37, 47.97], ['doha', 25.29, 51.53], ['abu-dhabi', 24.45, 54.40],
].map(([id, latitude, longitude]) => ({ id, latitude, longitude }));

test('expanded archives validate SHA-256, point identity, units, source family and complete calendars', async () => {
  const records = await loadExpandedSeries(sites);
  assert.equal(records.length, 42);
  for (const definition of variables.filter(row => row.archive !== 'legacy')) {
    const rows = records.filter(row => row.id === definition.id);
    assert.deepEqual(rows.map(row => row.location), sites.map(site => site.id));
    const smap = definition.archive === 'smap-daily';
    for (const row of rows) {
      assert.equal(row.monthly.length, smap ? 128 : (2026 - definition.start) * 12);
      assert.equal(row.annual.length, smap ? 9 : 2026 - definition.start);
      assert.equal(row.monthly[0].year, definition.start);
      assert.equal(row.monthly.at(-1).month, 12);
      const year = row.annual.find(value => value.year === 2024);
      assert.equal(year.days, 366);
      assert.equal(row.monthly.find(value => value.year === 2024 && value.month === 2).days, 29);
      const monthly = filterYears(row.monthly, 2024, 2024);
      const independent = monthly.reduce((sum, month) => sum + (definition.archive === 'imerg-daily' ?
        month.value : month.value * month.days / 366), 0);
      assert.ok(Math.abs(independent - year.value) < 1e-10);
    }
    for (const monthly of [true, false]) {
      const field = monthly ? 'monthly' : 'annual';
      const filtered = rows.map(row => filterYears(row[field], 2001, 2025));
      assert.equal(commonPeriods(filtered, monthly).length, smap ? (monthly ? 128 : 9) : (monthly ? 300 : 25));
    }
  }
  const humidity = records.filter(row => row.id === 'RH2M');
  assert.notDeepEqual(humidity[3].monthly, humidity[4].monthly);
  assert.equal(nativeVariable.dataset, 'native-merra2');
  assert.ok(records.every(row => row.dataset !== nativeVariable.dataset));
});

test('SMAP means match UTC source extracts independently; gaps and partial years remain unpublished', async () => {
  const source = JSON.parse(await readFile(new URL('../data/raw/power-smap-zarr/point-extraction.json', import.meta.url)));
  const records = (await loadExpandedSeries(sites)).filter(row => row.dataset === 'power-smap');
  assert.equal(records.length, 12);
  for (const record of records) {
    const point = source.sites[record.location];
    const entries = Object.entries(point.values[record.id]);
    assert.deepEqual(record.cellCentre, point.centre);
    assert.equal(record.expectedDays, 3929);
    assert.equal(record.missingDays, 1);
    assert.deepEqual(entries.filter(([, value]) => value === null), [['20250920', null]]);
    const mean = prefix => {
      const values = entries.filter(([key]) => key.startsWith(prefix)).map(([, value]) => value);
      assert.ok(values.every(Number.isFinite));
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };
    assert.equal(record.monthly[0].month, 4);
    assert.equal(record.annual[0].year, 2016);
    assert.equal(record.annual.at(-1).year, 2024);
    assert.ok(!record.monthly.some(row => row.year === 2025 && row.month === 9));
    for (const row of record.monthly) assert.ok(Math.abs(row.value - mean(String(row.year) + String(row.month).padStart(2,'0'))) < 1e-12);
    for (const row of record.annual) assert.ok(Math.abs(row.value - mean(String(row.year))) < 1e-12);
    assert.equal(trendFamily([record.annual])[0].eligibility, 'short');
  }
});

test('plot dates retain a null gap, without altering the observations or filling with zero', () => {
  const rows = [{ period: 202508, values: [0] }, { period: 202510, values: [.2] }];
  assert.deepEqual(plotPeriods(rows, true, 1), [rows[0], { period: 202509, values: [null] }, rows[1]]);
  assert.equal(rows.length, 2);
  assert.deepEqual(plotPeriods([{period: 202512, values: [1]}, {period: 202602, values: [2]}], true, 1)
    .map(row => row.period), [202512, 202601, 202602]);
});

test('six IMERG records independently match daily archives for every published month and year', async () => {
  const records = (await loadExpandedSeries(sites)).filter(row => row.id === 'IMERG_PRECTOT');
  assert.equal(records.length, 6);
  for (const record of records) {
    const { properties } = JSON.parse(await readFile(new URL('../data/raw/' + record.provenance.bodyFile, import.meta.url)));
    const daily = Object.entries(properties.parameter.IMERG_PRECTOT);
    assert.equal(record.expectedDays, 9131);
    assert.equal(record.missingDays, 0);
    const aggregate = prefix => daily.filter(([date]) => date.startsWith(prefix)).reduce((sum, [, value]) => sum + value, 0);
    for (const row of record.monthly) assert.ok(Math.abs(row.value - aggregate(String(row.year) + String(row.month).padStart(2,'0'))) < 1e-10);
    for (const row of record.annual) assert.ok(Math.abs(row.value - aggregate(String(row.year))) < 1e-10);
    if (record.location === 'bahrain') assert.deepEqual(daily.filter(([key]) => key >= '20250201' && key <= '20250207').map(([, v]) => v), [0, 0, 0, 0, 0, 2.6, 0]);
  }
});

test('daily aggregation excludes incomplete periods and preserves a real zero', () => {
  const raw = Object.fromEntries(Array.from({length: 29}, (_, i) => ['202402' + String(i + 1).padStart(2,'0'), 0]));
  const config = { start: '20240201', end: '20240229', fill: -999, range: [0, Infinity], reduction: 'sum' };
  assert.deepEqual(aggregateDaily(raw, config).monthly, [{ year: 2024, month: 2, days: 29, value: 0 }]);
  raw['20240229'] = -999;
  const gap = aggregateDaily(raw, config);
  assert.deepEqual(gap.monthly, []);
  assert.deepEqual(gap.annual, []);
  assert.equal(gap.missingDays, 1);
  raw['20240229'] = -1;
  assert.throws(() => aggregateDaily(raw, config), /Invalid daily value/);
});

test('comparison excludes nonshared dates; trend requires consecutive complete years and reports adjusted evidence', async () => {
  assert.deepEqual(commonPeriods([[{ year: 2024, month: 2, value: 2 }], [{ year: 2024, month: 3, value: 3 }]], true), []);
  const records = await loadExpandedSeries(sites);
  for (const variable of ['T2M_MAX_AVG', 'RH2M', 'WS2M', 'ALLSKY_SFC_SW_DWN', 'IMERG_PRECTOT']) {
    const selected = records.filter(row => row.id === variable).map(row => filterYears(row.annual, 2001, 2025));
    const results = trendFamily(selected);
    for (const result of results) {
      assert.equal(result.estimate.n, 25);
      assert.ok(Number.isFinite(result.estimate.slopePerDecade));
      assert.ok(result.estimate.interval.perDecade.every(Number.isFinite));
      if (result.adjustedP !== null) {
        assert.ok(result.adjustedP >= result.estimate.hamedRao.p);
        assert.equal(result.status === 'Statistically significant', result.adjustedP <= .05);
      }
    }
    assert.equal(trendFamily([selected[0].slice(-19)])[0].estimate, null);
    assert.equal(trendFamily([selected[0].filter(row => row.year !== 2012)])[0].estimate, null);
    assert.equal(trendFamily([selected[0].filter(row => row.year !== 2012)])[0].eligibility, 'gap');
    assert.equal(trendFamily([selected[0].map((row, i) => i === 0 ? { ...row, days: row.days - 1 } : row)])[0].estimate, null);
  }
});

test('blank years use coverage; invalid years never silently select a different period', () => {
  assert.deepEqual(selectPeriod('', undefined, 1981, 2025), { first: 1981, last: 2025, valid: true });
  assert.deepEqual(selectPeriod('2001', '2025', 1981, 2025), { first: 2001, last: 2025, valid: true });
  for (const [first, last] of [['bad', '2025'], [['2001', '2002'], '2025'], ['1981', '2026'], ['2025', '2001']]) {
    assert.equal(selectPeriod(first, last, 1981, 2025).valid, false);
  }
  assert.equal(selectPeriod('1981', '2025', 1984, 2025).valid, false);
});

test('dataset integration status is separate from observation availability', () => {
  assert.equal(seriesStatus('imerg', 0, 0), 'Not integrated');
  assert.equal(seriesStatus('smap', 0, 0), 'Not integrated');
  assert.equal(seriesStatus('extension', 0, 0), 'No valid observations');
  assert.equal(seriesStatus('extension', 11, 0), 'No complete annual observations');
  assert.equal(seriesStatus('extension', 540, 45), 'Available');
});
