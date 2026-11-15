import { analyzeTrend, holmAdjust } from './annual-trend.mjs';

export const minimumYears = 20;
export const alpha = 0.05;

export function selectPeriod(firstInput, lastInput, start, end) {
  const year = (input, fallback) => input === undefined || input === '' ? fallback :
    typeof input === 'string' && /^\d{4}$/.test(input) ? Number(input) : null;
  const first = year(firstInput, start);
  const last = year(lastInput, end);
  return { first, last, valid: first !== null && last !== null && first >= start && last <= end && first <= last };
}

export function seriesStatus(archive, monthlyCount, annualCount) {
  if (archive === 'imerg' || archive === 'smap') return 'Not integrated';
  if (!monthlyCount) return 'No valid observations';
  if (!annualCount) return 'No complete annual observations';
  return 'Available';
}

export function filterYears(rows, first, last) {
  return rows.filter(({ year }) => year >= first && year <= last);
}

export function commonPeriods(series, monthly) {
  if (!series.length) return [];
  const key = row => monthly ? row.year * 100 + row.month : row.year;
  const indexes = series.map(rows => new Map(rows.map(row => [key(row), row.value])));
  return [...indexes[0].keys()].filter(period => indexes.every(index => index.has(period)))
    .map(period => ({ period, values: indexes.map(index => index.get(period)) }));
}

export function trendFamily(annualSeries) {
  const eligibility = annualSeries.map(rows => {
    if (rows.length < minimumYears) return 'short';
    if (!rows.every((row, i) =>
      Number.isInteger(row.year) && row.year === rows[0].year + i && Number.isFinite(row.value) &&
      row.days === (Date.UTC(row.year + 1, 0, 1) - Date.UTC(row.year, 0, 1)) / 86400000)) return 'gap';
    return 'eligible';
  });
  const estimates = annualSeries.map((rows, i) =>
    eligibility[i] === 'eligible' ? analyzeTrend(rows.map(row => row.value), { replicates: 1999 }) : null);
  const adjusted = holmAdjust(estimates.map(estimate => estimate?.hamedRao.p ?? null));
  return estimates.map((estimate, i) => ({
    estimate, eligibility: eligibility[i], adjustedP: adjusted[i],
    status: estimate === null ? 'Trend not evaluated' : adjusted[i] === null ? 'Adjusted significance not estimable' :
      adjusted[i] <= alpha ? 'Statistically significant' : 'Not statistically significant',
  }));
}
