import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { variables } from '../lib/series-catalog.mjs';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root));
const parse = bytes => JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''));
const studies = parse(await read('lib/generated/studies.json'));
const expanded = parse(await read('lib/generated/expanded-series.json'));
const codes = variables.filter(variable => variable.dataset === 'power-merra2');
const sites = ['bahrain', 'riyadh', 'muscat', 'kuwait-city', 'doha', 'abu-dhabi'];
assert.deepEqual(studies.map(site => site.id).sort(), sites.sort());
const archiveCache = new Map();
async function archive(source) {
  if (!archiveCache.has(source.bodyFile)) {
    const bytes = await read('data/raw/' + source.bodyFile);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, source.bodyFile);
    const meta = parse(await read('data/raw/' + source.bodyFile.replace(/\.json$/, '.metadata.json')));
    assert.equal(meta.sha256, source.sha256);
    assert.equal(meta.bytes, bytes.length);
    assert.equal(meta.url, source.url);
    archiveCache.set(source.bodyFile, parse(bytes));
  }
  return archiveCache.get(source.bodyFile);
}

for (const site of studies) {
  for (const definition of codes) {
    const { id, sourceUnit, archive: group } = definition;
    const legacy = group === 'legacy';
    const record = legacy ? site.variables.find(row => row.id === id) :
      expanded.find(row => row.location === site.id && row.id === id);
    const source = legacy ? site.provenance[site.id === 'bahrain' && id === 'T2M_MIN_AVG' ? 1 : 0] : record.provenance;
    const payload = await archive(source);
    const scope = site.id + ' ' + id;
    assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [site.longitude, site.latitude], scope);
    assert.equal(payload.header.time_standard, 'LST', scope);
    assert.ok(payload.header.sources.includes('MERRA2'), scope);
    assert.equal(payload.parameters[id].units, sourceUnit, scope);
    assert.equal(record.monthly.length, 540, scope);
    assert.equal(record.annual.length, 45, scope);
    const raw = payload.properties.parameter[id];
    const expected = new Set();
    for (let year = 1981; year <= 2025; year++) {
      let sum = 0, days = 0;
      for (let month = 1; month <= 12; month++) {
        const key = String(year) + String(month).padStart(2, '0');
        expected.add(key);
        assert.ok(Object.hasOwn(raw, key), scope + ' ' + key);
        const value = raw[key];
        assert.ok(Number.isFinite(value) && value !== payload.header.fill_value, scope + ' ' + key);
        const monthDays = [31, (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
        const published = record.monthly[(year - 1981) * 12 + month - 1];
        assert.deepEqual([published.year, published.month, published.days, published.value], [year, month, monthDays, value], scope + ' ' + key);
        sum += value * monthDays;
        days += monthDays;
      }
      const row = record.annual[year - 1981];
      const independentlyAggregated = id === 'PRECTOTCORR' ? sum : sum / days;
      assert.equal(row.year, year, scope);
      assert.equal(row.days, days, scope);
      assert.ok(Math.abs(row.value - independentlyAggregated) < 1e-9, scope + ' ' + year);
    }
    assert.equal(Object.keys(raw).filter(key => !/^\d{4}13$/.test(key) && !expected.has(key)).length, 0, scope);
  }
  console.log(site.name + ': 6 variables, 3,240 monthly values, 270 annual values, no missing or fill values');
}
console.log('Verified: 19,440 monthly values and 1,620 annual values across 36 series against ' + archiveCache.size + ' archived NASA POWER responses.');
