import assert from 'node:assert/strict';

const criticalZ = 1.959963984540054;
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function median(sorted) {
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function pairwiseSlopes(values) {
  const slopes = [];
  for (let i = 0; i < values.length - 1; i++) {
    for (let j = i + 1; j < values.length; j++) {
      slopes.push((values[j] - values[i]) / (j - i));
    }
  }
  return slopes.sort((a, b) => a - b);
}

function ranks(values) {
  const indices = values.map((_, i) => i).sort((a, b) => values[a] - values[b]);
  const result = [];
  for (let first = 0; first < indices.length;) {
    let end = first + 1;
    while (end < indices.length && values[indices[end]] === values[indices[first]]) end++;
    const rank = (first + end + 1) / 2;
    for (let i = first; i < end; i++) result[indices[i]] = rank;
    first = end;
  }
  return result;
}

function autocorrelations(values) {
  const center = mean(values);
  const centered = values.map(value => value - center);
  const denominator = centered.reduce((sum, value) => sum + value ** 2, 0);
  return centered.slice(1).map((_, index) => {
    const lag = index + 1;
    if (denominator === 0) return null;
    return centered.slice(lag).reduce((sum, value, i) => sum + value * centered[i], 0) / denominator;
  });
}

function significance(score, variance) {
  if (score === 0) return { variance, z: 0, p: 1 };
  if (!(variance > 0)) return { variance, z: null, p: null };
  const z = (score - Math.sign(score)) / Math.sqrt(variance);
  if (z === 0) return { variance, z, p: 1 };
  // Numerical Recipes erfc approximation, evaluated directly in the small tail.
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1 / (1 + 0.5 * x);
  const coefficients = [1.00002368, 0.37409196, 0.09678418, -0.18628806,
    0.27886807, -1.13520398, 1.48851587, -0.82215223, 0.17087277];
  const polynomial = coefficients.reduceRight((sum, coefficient) => coefficient + t * sum, 0);
  const p = t * Math.exp(-x * x - 1.26551223 + t * polynomial);
  return { variance, z, p };
}

function quantile(sorted, probability) {
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  return sorted[lower] + (position - lower) * (sorted[Math.ceil(position)] - sorted[lower]);
}

function bootstrapInterval(residuals, slope, blockLength, replicates, seed) {
  const n = residuals.length;
  let state = seed;
  const errors = [];
  for (let replicate = 0; replicate < replicates; replicate++) {
    const sample = [];
    while (sample.length < n) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const start = Math.floor(state / 2 ** 32 * (n - blockLength + 1));
      sample.push(...residuals.slice(start, start + Math.min(blockLength, n - sample.length)));
    }
    // A fitted linear trend adds the same slope to every pairwise slope.
    errors.push(median(pairwiseSlopes(sample)));
  }
  errors.sort((a, b) => a - b);
  const perYear = [slope - quantile(errors, 0.975), slope - quantile(errors, 0.025)];
  return { blockLength, replicates, seed, perYear, perDecade: perYear.map(value => 10 * value) };
}

/** Analyze equally spaced consecutive annual observations. */
export function analyzeTrend(values, {
  replicates = 9999, seed = 20261114, blockLength = Math.max(2, Math.round(Math.cbrt(values.length))),
} = {}) {
  assert.ok(values.length >= 4 && values.every(Number.isFinite), 'Expected at least four finite annual observations');
  assert.ok(Number.isInteger(replicates) && replicates >= 2);
  const n = values.length;
  assert.ok(Number.isInteger(blockLength) && blockLength >= 2 && blockLength < n);
  const slopes = pairwiseSlopes(values);
  const slope = median(slopes);
  const score = slopes.reduce((sum, value) => sum + Math.sign(value), 0);
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  const tieTerm = [...counts.values()].reduce((sum, t) => sum + t * (t - 1) * (2 * t + 5), 0);
  const variance = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18;
  const residuals = values.map((value, index) => value - index * slope);
  // Suppress detrending roundoff at tied residuals for a numerically exact line.
  const tolerance = 16 * Number.EPSILON * values.reduce((scale, value) => Math.max(scale, Math.abs(value)), 0);
  const effectivelyConstant = residuals.every(value => Math.abs(value - residuals[0]) <= tolerance);
  const detrended = effectivelyConstant ? residuals.map(() => 0) : residuals;
  const rankAcf = autocorrelations(ranks(detrended));
  const cutoff = criticalZ / Math.sqrt(n);
  const selectedLags = [];
  let weightedAcf = 0;
  for (let lag = 1; lag <= n - 3; lag++) {
    const correlation = rankAcf[lag - 1];
    if (correlation !== null && Math.abs(correlation) > cutoff) {
      selectedLags.push(lag);
      weightedAcf += (n - lag) * (n - lag - 1) * (n - lag - 2) * correlation;
    }
  }
  const factor = 1 + 2 * weightedAcf / (n * (n - 1) * (n - 2));
  const modified = factor > 0 ? significance(score, variance * factor) : { variance: null, z: null, p: null };
  return {
    n, score, direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'flat',
    slopePerYear: slope, slopePerDecade: 10 * slope,
    ordinary: significance(score, variance),
    rawLag1: autocorrelations(values)[0], rankAcf,
    hamedRao: { ...modified, factor, cutoff, selectedLags },
    interval: bootstrapInterval(detrended, slope, blockLength, replicates, seed),
  };
}

/** Count unavailable tests as p = 1 internally and preserve null in the output. */
export function holmAdjust(pValues) {
  const sorted = pValues.map((p, index) => ({ p: p ?? 1, index })).sort((a, b) => a.p - b.p);
  const adjusted = [];
  let running = 0;
  for (const [rank, { p, index }] of sorted.entries()) {
    running = Math.max(running, Math.min(1, p * (sorted.length - rank)));
    adjusted[index] = pValues[index] === null ? null : running;
  }
  return adjusted;
}
