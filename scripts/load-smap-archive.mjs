import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { aggregateDaily } from './load-daily-hydrology.mjs';

const root = new URL('../data/raw/power-smap-zarr/', import.meta.url);
const archive = 'https://nasa-power-smap.s3.amazonaws.com/smap/temporal/power_smap_daily_temporal_utc.zarr/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export async function loadSmapArchive(studies, definitions) {
  const bytes = await readFile(new URL('point-extraction.json', root));
  const extracted = JSON.parse(bytes);
  assert.equal(extracted.archive, archive);
  assert.equal(extracted.product, 'power_smap_daily_temporal_utc.zarr');
  assert.equal(extracted.schemaVersion, 1);
  assert.equal(extracted.start, '20150331');
  assert.equal(extracted.end, '20251231');
  assert.equal(extracted.units, 'm3 m-3');
  await Promise.all(Object.entries(extracted.objects).map(async ([key, object]) => {
    assert.match(key, /^(?:\.zmetadata|(?:lat|lon|time)\/0|(?:SFMC|RZMC)\/\d+\.\d+\.\d+)$/);
    assert.equal(object.file, key.replace('/', '--'));
    const original = await readFile(new URL(object.file, root));
    assert.equal(original.length, object.bytes);
    assert.equal(hash(original), object.sha256, key);
  }));
  const metadata = JSON.parse(await readFile(new URL('.zmetadata', root))).metadata;
  assert.equal(metadata['.zattrs'].processing_level, '4');
  assert.equal(metadata['.zattrs'].id, extracted.product);
  assert.equal(metadata['.zattrs'].version, extracted.version);
  assert.ok(metadata['.zattrs'].time_standard.endsWith('(UTC)'));
  return studies.flatMap(study => {
    const point = extracted.sites[study.id];
    assert.deepEqual(point.requested, [study.latitude, study.longitude]);
    assert.ok(point.centre.every((coordinate, i) => Number.isFinite(coordinate) &&
      Math.abs(coordinate - point.requested[i]) < 0.06));
    return definitions.map(({ id, dataset, sourceUnit, range }) => {
      const archiveField = metadata[id + '/.zattrs'];
      const array = metadata[id + '/.zarray'];
      assert.equal(archiveField.units, sourceUnit);
      assert.deepEqual(archiveField._ARRAY_DIMENSIONS, ['time', 'lat', 'lon']);
      assert.ok(point.indices.length === 2 && point.indices.every((index, i) => Number.isInteger(index) && index >= 0 && index < array.shape[i + 1]));
      const days = 3929;
      const expectedKeys = Array.from({length: Math.ceil(days / array.chunks[0])}, (_, i) =>
        id + '/' + [i, ...point.indices.map((index, dim) => Math.floor(index / array.chunks[dim + 1]))].join('.'));
      assert.deepEqual(point.sources[id], expectedKeys);
      assert.ok(expectedKeys.every(key => Object.hasOwn(extracted.objects, key)));
      return { dataset, id, location: study.id, sources: ['SMAP L4 / NASA POWER'], cellCentre: point.centre,
        provenance: { url: archive + '.zmetadata', bodyFile: 'power-smap-zarr/point-extraction.json',
          sha256: hash(bytes), bytes: bytes.length },
        ...aggregateDaily(point.values[id], { start: extracted.start, end: extracted.end, range,
          fill: null, reduction: 'mean' }) };
    });
  });
}
