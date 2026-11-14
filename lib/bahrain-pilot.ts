import data from '../data/atlas/bahrain/merra2-t2m-pilot.json';

export type BahrainPilot = typeof data;

const { observations, cell, source, variable, power } = data;
const [west, south, east, north] = cell.bounds;
const [x, y] = cell.reference;
if (data.schemaVersion !== 1 || source.collection !== 'M2TMNXSLV' ||
    source.version !== '5.12.4' || variable.id !== 'T2M' || variable.sourceUnit !== 'K' ||
    cell.bounds.length !== 4 || !cell.containsReference ||
    !(west < x && x < east && south < y && y < north) ||
    observations.length !== 2 || power.observations.length !== 2 ||
    !observations.every((row, i) => row.month === ['2025-02', '2025-03'][i] &&
      Number.isFinite(row.kelvin) && row.celsius === row.kelvin - 273.15 &&
      /^[a-f0-9]{64}$/.test(row.sha256) && power.observations[i].month === row.month)) {
  throw new Error('Invalid Bahrain native-cell pilot artifact');
}

export const bahrainPilot: BahrainPilot = data;
