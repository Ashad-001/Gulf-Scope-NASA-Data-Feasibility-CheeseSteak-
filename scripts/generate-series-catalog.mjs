import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { variables } from '../lib/series-catalog.mjs';
import { loadDailyHydrology } from './load-daily-hydrology.mjs';
import { loadSmapArchive } from './load-smap-archive.mjs';

const root = new URL('../', import.meta.url);
export async function loadExpandedSeries(studies) {
  const records = await loadSmapArchive(studies, variables.filter(variable => variable.archive === 'smap-daily'));
  for (const study of studies) {
    records.push(...await loadDailyHydrology(study, variables.filter(variable => variable.archive === 'imerg-daily'), {
      group: 'imerg', codes: 'IMERG_PRECTOT', start: '20010101', end: '20251231', lineage: 'IMERG', reduction: 'sum',
    }));
    for (const group of ['extension', 'solar']) {
      const bodyFile = `nasa-power-${study.id}-${group}.json`;
      const path = `data/raw/${bodyFile}`;
      const bytes = await readFile(new URL(path, root));
      const provenance = JSON.parse(await readFile(new URL(path.replace(/\.json$/, '.metadata.json'), root), 'utf8'));
      const payload = JSON.parse(bytes);
      const url = new URL(provenance.url);
      const definitions = variables.filter(variable => variable.archive === group);
      const { header, geometry } = payload;
      assert.equal(url.origin, 'https://power.larc.nasa.gov');
      assert.equal(url.pathname, '/api/temporal/monthly/point');
      assert.equal(url.searchParams.get('community'), 'AG');
      assert.equal(provenance.status, 200);
      assert.equal(provenance.bodyFile, bodyFile);
      assert.ok(Number.isFinite(Date.parse(provenance.retrievedAt)));
      assert.equal(provenance.bytes, bytes.length);
      assert.equal(provenance.sha256, createHash('sha256').update(bytes).digest('hex'));
      assert.deepEqual(geometry.coordinates.slice(0, 2), [study.longitude, study.latitude]);
      assert.equal(+url.searchParams.get('latitude'), study.latitude);
      assert.equal(+url.searchParams.get('longitude'), study.longitude);
      assert.equal(header.time_standard, 'LST');
      assert.ok(Number.isFinite(header.fill_value));
      assert.deepEqual(url.searchParams.get('parameters').split(',').sort(), definitions.map(v => v.id).sort());
      for (const definition of definitions) {
        const { dataset, id, sourceUnit, start, end, range } = definition;
        assert.equal(payload.parameters[id].units, sourceUnit);
        assert.equal(header.start, `${start}0101`);
        assert.equal(header.end, `${end}1231`);
        const raw = payload.properties.parameter[id];
        const monthly = [];
        const annual = [];
        assert.equal(Object.keys(raw).filter(date => !date.endsWith('13')).length, (end - start + 1) * 12);
        for (let year = start; year <= end; year++) {
          let sum = 0, dayCount = 0, complete = true;
          for (let month = 1; month <= 12; month++) {
            const date = `${year}${String(month).padStart(2, '0')}`;
            assert.ok(Object.hasOwn(raw, date));
            const value = raw[date];
            if (value === header.fill_value) { complete = false; continue; }
            assert.ok(Number.isFinite(value) && value >= range[0] && value <= range[1], `${study.id} ${id} ${date}`);
            const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
            monthly.push({ year, month, days, value });
            dayCount += days;
            sum += value * days;
          }
          if (complete) annual.push({ year, days: dayCount, value: definition.annualUnit === 'mm' ? sum : sum / dayCount });
        }
        assert.equal(annual.length, end - start + 1);
        const sources = group === 'extension' ? ['MERRA2', 'POWER'] : ['SRB', 'SYN1DEG'];
        assert.deepEqual([...header.sources].sort(), sources.sort());
        records.push({ dataset, id, location: study.id, provenance, sources: header.sources, monthly, annual });
      }
    }
  }
  return records;
}

export async function generateSeriesCatalog(studies) {
  const records = await loadExpandedSeries(studies);
  await writeFile(new URL('lib/generated/expanded-series.json', root), JSON.stringify(records) + '\n');
}
