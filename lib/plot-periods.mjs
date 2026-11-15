/**
 * Add empty plot positions only; the underlying date/value table stays untouched.
 * @param {{period: number, values: (number | null)[]}[]} rows
 * @param {boolean} monthly
 * @param {number} seriesCount
 * @returns {{period: number, values: (number | null)[]}[]}
 */
export function plotPeriods(rows, monthly, seriesCount) {
  if (rows.length < 2) return rows;
  const positions = new Map(rows.map(row => [row.period, row]));
  const end = rows[rows.length - 1].period;
  const output = [];
  for (let period = rows[0].period; period <= end; period = monthly && period % 100 === 12 ? period + 89 : period + 1) {
    output.push(positions.get(period) ?? { period, values: Array(seriesCount).fill(null) });
  }
  return output;
}
