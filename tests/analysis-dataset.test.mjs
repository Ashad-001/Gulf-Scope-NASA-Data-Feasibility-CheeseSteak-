import assert from 'node:assert/strict';
import test from 'node:test';
import { loadDataset, daysInMonth } from '../scripts/build-analysis-dataset.mjs';

test('Gregorian February handles ordinary, leap and century years', () => {
  assert.deepEqual([1981, 1984, 1900, 2000].map(year => daysInMonth(year, 2)), [28, 29, 28, 29]);
});

test('verified snapshot produces 540 complete months and 45 complete years', async () => {
  const { monthly, annual, source } = await loadDataset();
  assert.equal(source.sha256, 'c853b14a7fd81574ef6c6154480e34dcf5f355adea4cdbcaae3aaf78d2a6be6a');
  assert.equal(monthly.length, 540);
  assert.equal(annual.length, 45);
  assert.deepEqual([monthly[0].year, monthly[0].month, monthly.at(-1).year, monthly.at(-1).month], [1981, 1, 2025, 12]);
  for (const row of annual) {
    assert.equal(row.complete, true);
    assert.deepEqual([row.valid_t2m_months, row.valid_t2m_min_months, row.valid_precipitation_months], [12, 12, 12]);
  }
  const leap = monthly.filter(row => row.year === 2000);
  const row = annual.find(row => row.year === 2000);
  assert.equal(row.days, 366);
  assert.equal(leap[1].days, 29);
  assert.ok(Math.abs(leap[1].estimated_precipitation_mm - leap[1].prectotcorr_mm_day * 29) < 1e-10);
  assert.ok(Math.abs(row.estimated_precipitation_mm - leap.reduce((sum, m) => sum + m.prectotcorr_mm_day * m.days, 0)) < 1e-9);
  for (const [monthlyKey, annualKey] of [['t2m_c', 'mean_t2m_c'], ['t2m_min_c', 'day_weighted_t2m_min_c']]) {
    const reference = leap.flatMap(m => Array(m.days).fill(m[monthlyKey])).reduce((a, b) => a + b, 0) / 366;
    assert.ok(Math.abs(row[annualKey] - reference) < 1e-9);
  }
});

test('NASA monthly mean of daily minima agrees with archived daily February 2025', async () => {
  const { monthly, annual, minimumValidation } = await loadDataset();
  assert.equal(minimumValidation.dailyCount, 28);
  assert.equal(minimumValidation.dailyMinimumC, 13.42);
  assert.ok(Math.abs(minimumValidation.dailyMeanC - 16.3403571428571) < 1e-10);
  assert.equal(monthly.find(row => row.year === 2025 && row.month === 2).t2m_min_avg_c, 16.34);
  assert.equal(monthly.filter(row => Number.isFinite(row.t2m_min_avg_c)).length, 540);
  for (const row of annual) {
    const months = monthly.filter(month => month.year === row.year);
    const reference = months.reduce((sum, month) => sum + month.t2m_min_avg_c * month.days, 0) / row.days;
    assert.ok(Math.abs(row.mean_daily_min_t2m_c - reference) < 1e-10);
    assert.equal(row.valid_t2m_min_avg_months, 12);
  }
});
