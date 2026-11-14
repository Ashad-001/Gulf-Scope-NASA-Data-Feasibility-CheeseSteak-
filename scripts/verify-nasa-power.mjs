import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const parameters = { T2M: 'C', T2M_MIN: 'C', PRECTOTCORR: 'mm/day' };
const start = 1981;
const end = 2025;
const endpoint = new URL('https://power.larc.nasa.gov/api/temporal/monthly/point');
endpoint.search = new URLSearchParams({
  parameters: Object.keys(parameters).join(','),
  community: 'AG',
  longitude: '50.55',
  latitude: '26.07',
  start,
  end,
  format: 'JSON',
}).toString();

const years = Array.from({ length: end - start + 1 }, (_, index) => start + index);
const months = years.flatMap(year =>
  Array.from({ length: 12 }, (_, index) => `${year}${String(index + 1).padStart(2, '0')}`),
);
const annualKeys = years.map(year => `${year}13`);
const expectedKeys = new Set([...months, ...annualKeys]);

function validate(payload) {
  assert.equal(payload.type, 'Feature');
  assert.equal(payload.geometry.type, 'Point');
  assert.deepEqual(payload.geometry.coordinates.slice(0, 2), [50.55, 26.07]);
  const { header, properties, parameters: definitions } = payload;
  assert.equal(header.start, `${start}0101`);
  assert.equal(header.end, `${end}1231`);
  assert.ok(header.sources.includes('MERRA2'), 'Response must identify MERRA2');
  assert.ok(Number.isFinite(header.fill_value), 'Missing or invalid fill sentinel');

  const series = Object.entries(parameters).map(([name, unit]) => {
    const values = properties.parameter[name];
    assert.ok(values && typeof values === 'object' && !Array.isArray(values), `Missing series ${name}`);
    assert.equal(definitions[name].units, unit, `Unexpected units for ${name}`);
    const keys = Object.keys(values);
    assert.ok(keys.every(key => expectedKeys.has(key)), `Unexpected date keys in ${name}`);
    const valid = key => Number.isFinite(values[key]) && values[key] !== header.fill_value;
    const available = months.filter(valid);
    return {
      name,
      unit,
      description: definitions[name].longname,
      firstValidMonth: available.at(0),
      lastValidMonth: available.at(-1),
      validMonths: available.length,
      absentMonths: months.filter(key => !Object.hasOwn(values, key)),
      fillMonths: months.filter(key => values[key] === header.fill_value),
      invalidMonths: months.filter(key => Object.hasOwn(values, key) && !Number.isFinite(values[key])),
      annualEntries: annualKeys.filter(key => Object.hasOwn(values, key)).length,
      unusableAnnualEntries: annualKeys.filter(key => Object.hasOwn(values, key) && !valid(key)),
      qualityFlags: months.filter(key => valid(key) && (
        (name === 'PRECTOTCORR' && values[key] < 0) ||
        (name === 'T2M_MIN' && Number.isFinite(properties.parameter.T2M?.[key]) &&
          properties.parameter.T2M[key] !== header.fill_value && values[key] > properties.parameter.T2M[key])
      )),
    };
  });
  return { header, coordinates: payload.geometry.coordinates, messages: payload.messages, series };
}

async function main() {
  const [input, ...extra] = process.argv.slice(2);
  assert.equal(extra.length, 0, 'Usage: node scripts/verify-nasa-power.mjs [saved-response.json]');
  let body;
  let metadata;
  if (input) {
    body = await readFile(input);
  } else {
    const response = await fetch(endpoint, {
      redirect: 'error',
      signal: AbortSignal.timeout(60_000),
    });
    body = Buffer.from(await response.arrayBuffer());
    const retrievedAt = new Date().toISOString();
    const directory = new URL('../data/raw/', import.meta.url);
    await mkdir(directory, { recursive: true });
    const stem = `nasa-power-bahrain-${retrievedAt.replaceAll(':', '-')}`;
    const bodyFile = `${stem}.${response.ok ? 'json' : 'error.txt'}`;
    metadata = {
      url: response.url,
      retrievedAt,
      status: response.status,
      contentType: response.headers.get('content-type'),
      bodyFile,
      bytes: body.length,
      sha256: createHash('sha256').update(body).digest('hex'),
    };
    await writeFile(new URL(bodyFile, directory), body, { flag: 'wx' });
    await writeFile(new URL(`${stem}.metadata.json`, directory), JSON.stringify(metadata, null, 2) + '\n', { flag: 'wx' });
    assert.ok(response.ok, `NASA POWER returned HTTP ${response.status}. See ${bodyFile}.`);
    assert.match(metadata.contentType ?? '', /application\/json/i);
  }

  const summary = validate(JSON.parse(body.toString('utf8')));
  console.log(JSON.stringify({ metadata, expectedMonths: months.length, ...summary }, null, 2));
  if (summary.series.some(item => item.validMonths !== months.length || item.qualityFlags.length)) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
