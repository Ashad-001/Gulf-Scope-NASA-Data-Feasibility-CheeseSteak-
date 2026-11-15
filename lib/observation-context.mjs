export const minimumReferencePeriods = 8;

/**
 * @param {{year: number, month?: number, value: number}[]} selected
 * @param {{year: number, month?: number, value: number}[]} archive
 * @param {boolean} monthly
 */
export function observationContext(selected, archive, monthly) {
  const latest = selected.findLast(row => Number.isFinite(row.value));
  if (!latest) return null;

  const peers = archive.filter(row => row.year !== latest.year && Number.isFinite(row.value) &&
    (!monthly || row.month === latest.month));
  if (peers.length < minimumReferencePeriods) return { latest, count: peers.length, reference: null };

  const values = peers.map(row => row.value).sort((a, b) => a - b);
  const quantile = (/** @type {number} */ probability) => {
    const index = probability * (values.length - 1);
    const below = Math.floor(index);
    return values[below] + (index - below) * (values[Math.ceil(index)] - values[below]);
  };
  const lower = quantile(0.25);
  const upper = quantile(0.75);
  return {
    latest,
    count: peers.length,
    reference: {
      first: Math.min(...peers.map(row => row.year)),
      last: Math.max(...peers.map(row => row.year)),
      lower,
      upper,
      median: quantile(0.5),
      position: latest.value < lower ? 'relatively low' : latest.value > upper ? 'relatively high' : 'within the typical range',
    },
  };
}
