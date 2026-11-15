import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../data/raw/', import.meta.url);

export function aggregateDaily(raw, { start, end, fill, range, reduction }) {
  const months = new Map();
  const years = new Map();
  let missingDays = 0;
  let expectedDays = 0;
  for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) {
    for (let month = 1; month <= 12; month++) {
      const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
      const prefix = String(year) + String(month).padStart(2, '0');
      let sum = 0;
      let valid = 0;
      for (let day = 1; day <= days; day++) {
        const date = prefix + String(day).padStart(2, '0');
        if (date < start || date > end) continue;
        expectedDays++;
        const value = raw[date];
        if (value === undefined || value === null || value === fill) { missingDays++; continue; }
        assert.ok(Number.isFinite(value) && value >= range[0] && value <= range[1], 'Invalid daily value at ' + date);
        valid++;
        sum += value;
      }
      if (valid !== days) continue;
      const annual = years.get(year) ?? { sum: 0, days: 0, months: 0 };
      months.set(prefix, { year, month, days, value: reduction === 'sum' ? sum : sum / days });
      annual.sum += sum;
      annual.days += days;
      annual.months++;
      years.set(year, annual);
    }
  }
  assert.ok(Object.keys(raw).every(key => /^\d{8}$/.test(key) && key >= start && key <= end &&
    Number(key.slice(4, 6)) >= 1 && Number(key.slice(4, 6)) <= 12 && Number(key.slice(6)) >= 1 &&
    Number(key.slice(6)) <= new Date(Date.UTC(Number(key.slice(0, 4)), Number(key.slice(4, 6)), 0)).getUTCDate()),
  'Unexpected archive date');
  return { monthly: [...months.values()], annual: [...years].filter(([, row]) => row.months === 12)
    .map(([year, row]) => ({ year, days: row.days, value: reduction === 'sum' ? row.sum : row.sum / row.days })),
  expectedDays, missingDays };
}

export async function loadDailyHydrology(study, definitions, { group, codes, start, end, lineage, reduction }) {
  const bodyFile = 'nasa-power-' + study.id + '-' + group + '-daily.json';
  const [bytes, metadata] = await Promise.all([
    readFile(new URL(bodyFile, root)), readFile(new URL(bodyFile.replace(/\.json$/, '.metadata.json'), root), 'utf8'),
  ]);
  const provenance = JSON.parse(metadata);
  const payload = JSON.parse(bytes);
  const { header } = payload;
  const url = new URL(provenance.url);
  assert.equal(url.origin + url.pathname, 'https://power.larc.nasa.gov/api/temporal/daily/point');
  for (const [name, value] of Object.entries({ start, end, parameters: codes, community: 'AG',
    'time-standard': 'UTC', format: 'JSON', latitude: String(study.latitude), longitude: String(study.longitude) })) {
    assert.equal(url.searchParams.get(name), value);
  }
  assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [study.longitude, study.latitude]);
  assert.equal(provenance.bodyFile, bodyFile);
  assert.equal(provenance.status, 200);
  assert.equal(provenance.sha256, createHash('sha256').update(bytes).digest('hex'));
  assert.equal(provenance.bytes, bytes.length);
  assert.ok(Number.isFinite(Date.parse(provenance.retrievedAt)));
  assert.equal(header.time_standard, 'UTC');
  assert.equal(header.start, start);
  assert.equal(header.end, end);
  assert.ok(Number.isFinite(header.fill_value) && header.fill_value < 0);
  assert.deepEqual(header.sources, [lineage]);
  return definitions.map(({ id, dataset, sourceUnit, range }) => {
    assert.equal(payload.parameters[id].units, sourceUnit);
    return { dataset, id, location: study.id, provenance, sources: header.sources,
      ...aggregateDaily(payload.properties.parameter[id], { start, end, fill: header.fill_value, range, reduction }),
    };
  });
}
