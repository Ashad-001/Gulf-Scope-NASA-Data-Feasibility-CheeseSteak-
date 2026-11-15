import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../data/raw/', import.meta.url);
const sites = {
  bahrain: [26.07, 50.55], riyadh: [24.71, 46.68], muscat: [23.59, 58.41],
  'kuwait-city': [29.37, 47.97], doha: [25.29, 51.53], 'abu-dhabi': [24.45, 54.40],
};
const [product, ...ids] = process.argv.slice(2);
const products = {
  imerg: { codes: 'IMERG_PRECTOT', start: '20010101', source: /imerg/i },
};
const config = products[product];
assert.ok(config && ids.length && ids.every(id => Object.hasOwn(sites, id)), 'Specify imerg and one or more configured sites');

for (const id of ids) {
  const [latitude, longitude] = sites[id];
  const query = new URLSearchParams({ parameters: config.codes, latitude, longitude,
    start: config.start, end: '20251231', format: 'JSON', 'time-standard': 'UTC', community: 'AG' });
  const url = 'https://power.larc.nasa.gov/api/temporal/daily/point?' + query;
  const bodyFile = 'nasa-power-' + id + '-' + product + '-daily.json';
  const metadataFile = bodyFile.replace(/\.json$/, '.metadata.json');
  for (const name of [bodyFile, metadataFile]) {
    const exists = await readFile(new URL(name, root)).then(() => true, error => {
      if (error.code !== 'ENOENT') throw error;
      return false;
    });
    assert.ok(!exists, 'Archive already exists: ' + name);
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.ok(response.ok, response.status + ' ' + bytes.toString('utf8').slice(0, 500));
  const payload = JSON.parse(bytes);
  assert.equal(payload.header.time_standard, 'UTC');
  assert.ok(payload.header.sources.some(source => config.source.test(source)), 'Series lacks expected product identity');
  assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [longitude, latitude]);
  const metadata = { url, retrievedAt: new Date().toISOString(), status: response.status, bodyFile,
    bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  await writeFile(new URL(bodyFile, root), bytes, { flag: 'wx' });
  await writeFile(new URL(metadataFile, root), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
  console.log(id, payload.header, payload.parameters);
  for (const [code, series] of Object.entries(payload.properties.parameter)) {
    const values = Object.values(series);
    const valid = values.filter(value => Number.isFinite(value) && value !== payload.header.fill_value);
    console.log(code, 'values:', values.length, 'valid:', valid.length, 'range:', Math.min(...valid), Math.max(...valid));
  }
}
