import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeTrend, holmAdjust } from '../scripts/trend-analysis.mjs';

function near(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);
}

test('ties reduce ordinary variance and contribute zero to the score', () => {
  const trend = analyzeTrend([1, 1, 3, 3, 5, 5]);
  assert.equal(trend.score, 12);
  near(trend.ordinary.variance, (6 * 5 * 17 - 3 * 2 * 1 * 9) / 18);
});

for (const slope of [2, -2, 0]) {
  test(`exact slope ${slope} and degenerate interval`, () => {
    const trend = analyzeTrend(Array.from({ length: 12 }, (_, i) => 4 + i * slope));
    assert.equal(trend.slopePerYear, slope);
    assert.equal(trend.slopePerDecade, slope * 10);
    assert.equal(trend.direction, slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'flat');
    assert.deepEqual(trend.interval.perDecade, [slope * 10, slope * 10]);
    assert.equal(trend.hamedRao.factor, 1);
    if (slope === 0) assert.equal(trend.hamedRao.p, 1);
  });
}

test('serially correlated, tied series matches independent Python arithmetic and erfc reference', () => {
  const trend = analyzeTrend([3,4,5,7,8,9,10,8,7,6,6,8,11,13,14,15,14,12,11,10,10,12,15,18]);
  near(trend.slopePerYear, 0.4444444444444444);
  assert.equal(trend.score, 168);
  assert.equal(trend.ordinary.variance, 1612);
  near(trend.rankAcf[0], 0.6968641114982579);
  assert.deepEqual(trend.hamedRao.selectedLags, [1,4,5,6,9,10]);
  near(trend.hamedRao.factor, 0.7558109308506975);
  near(trend.ordinary.p, 3.1904100326357565e-05);
  near(trend.hamedRao.p, 1.714999212571282e-06);
  near(trend.interval.perDecade[0], 2.479190716690716);
  near(trend.interval.perDecade[1], 6.303571428571429);
});

test('Holm retains unavailable hypotheses and preserves input order', () => {
  assert.deepEqual(holmAdjust([0.04, null, 0.01]), [0.08, null, 0.03]);
  assert.deepEqual(holmAdjust([0.04, 0.01, 0.03]), [0.06, 0.03, 0.06]);
});

test('nonfinite observations are rejected', () => {
  assert.throws(() => analyzeTrend([0, 1, NaN, 2]), /finite/);
});
