import expanded from './generated/expanded-series.json';
import { getLocations, getStudy } from './study';
import { datasets, variables } from './series-catalog.mjs';

type Observation = { year: number; month?: number; days: number; value: number };
type Definition = (typeof variables)[number];
type Record = {
  monthly: Observation[]; annual: Observation[];
  provenance: { url: string; bodyFile: string; sha256: string; retrievedAt?: string }[];
  cellCentre?: number[];
};

export const locations = getLocations();
export const pointDatasets = datasets;

export function recordsFor(definition: Definition): Record[] {
  return locations.map(({ id }) => {
    if (definition.archive === 'legacy') {
      const study = getStudy(id)!;
      const variable = study.variables.find(variable => variable.id === definition.id)!;
      const provenance = id === 'bahrain'
        ? [study.provenance[definition.id === 'T2M_MIN_AVG' ? 1 : 0]] : study.provenance;
      return { monthly: variable.monthly, annual: variable.annual, provenance };
    }
    const row = expanded.find(record => record.dataset === definition.dataset && record.id === definition.id && record.location === id);
    if (!row) throw new Error('Missing validated catalog entry');
    return { monthly: row.monthly, annual: row.annual, provenance: [row.provenance],
      cellCentre: 'cellCentre' in row ? row.cellCentre : undefined };
  });
}
