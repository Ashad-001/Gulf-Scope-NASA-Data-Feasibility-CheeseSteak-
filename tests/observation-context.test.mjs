import assert from 'node:assert/strict';
import { test } from 'node:test';
import { observationContext } from '../lib/observation-context.mjs';

const archive = Array.from({ length: 8 }, (_, index) => [
  { year: 2000 + index, month: 2, value: index + 1 },
  { year: 2000 + index, month: 8, value: 90 + index },
]).flat();

test('monthly reference matches the calendar month and excludes the selected observation', () => {
  const selected = { year: 2008, month: 2, value: 15 };
  const { latest, count, reference } = observationContext([selected], [...archive, selected], true);
  assert.equal(latest, selected);
  assert.equal(count, 8);
  assert.deepEqual(reference, {
    first: 2000, last: 2007, lower: 2.75, upper: 6.25, median: 4.5, position: 'relatively high',
  });
});

test('annual reference classifies low and typical values descriptively', () => {
  const annual = archive.filter(row => row.month === 2).map(({ year, value }) => ({ year, value }));
  for (const [value, position] of [[1, 'relatively low'], [4, 'within the typical range']]) {
    assert.equal(observationContext([{ year: 2008, value }], annual, false).reference.position, position);
  }
});

test('empty windows and short reference samples produce no typical range', () => {
  assert.equal(observationContext([], archive, true), null);
  const selected = { year: 2007, month: 2, value: 8 };
  assert.deepEqual(observationContext([selected], archive, true), { latest: selected, count: 7, reference: null });
});
