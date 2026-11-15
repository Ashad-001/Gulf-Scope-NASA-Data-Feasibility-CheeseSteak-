import snapshots from './generated/studies.json';

export type VariableId = 'T2M' | 'T2M_MIN_AVG' | 'PRECTOTCORR';
type Observation = { year: number; days: number; value: number };
type Provenance = { url: string; retrievedAt: string; sha256: string; bytes: number; bodyFile: string; coordinates?: { source: string } };
export type Trend = {
  slopePerYear: number; slopePerDecade: number; intercept: number; significant: boolean; adjustedP: number;
  ordinary: { p: number }; hamedRao: { p: number; selectedLags: number[] };
  interval: { perDecade: [number, number]; blockLength: number; replicates: number };
};
export type Variable = {
  id: VariableId; name: string; short: string; unit: string; originalUnit: string; description: string;
  monthly: (Observation & { month: number; estimatedDepth?: number })[];
  annual: Observation[]; trend: Trend;
};
export type Study = {
  schemaVersion: 1; id: string; name: string; region: string; latitude: number; longitude: number;
  grid: { latitude: number; longitude: number }; source: string; product: string;
  firstMonth: string; lastMonth: string;
  completeness: { months: number; years: number; missing: number };
  provenance: Provenance[]; processedChecksums: Record<string, { sha256: string }>;
  methodology: { alpha: number; analysis: string; interval: string; limits: string; precipitation: string };
  variables: Variable[];
};

const ids = ['T2M', 'T2M_MIN_AVG', 'PRECTOTCORR'];
const hash = /^[a-f0-9]{64}$/;
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateStudy(data: (typeof snapshots)[number]): Study {
  const require = (condition: boolean) => {
    if (!condition) throw new Error('Invalid GulfScope dataset');
  };
  require(data.schemaVersion === 1 && ['bahrain', 'riyadh', 'muscat', 'kuwait-city', 'doha', 'abu-dhabi'].includes(data.id));
  require(Number.isFinite(data.latitude) && Math.abs(data.latitude) <= 90 &&
    Number.isFinite(data.longitude) && Math.abs(data.longitude) <= 180);
  require(data.grid.latitude > 0 && data.grid.longitude > 0);
  require(monthPattern.test(data.firstMonth) && monthPattern.test(data.lastMonth));
  require(data.completeness.months === 540 && data.completeness.years === 45 && data.completeness.missing === 0);
  require(data.provenance.length === (data.id === 'bahrain' ? 3 : 1) && data.provenance.every(row => hash.test(row.sha256) &&
    row.url.startsWith('https://power.larc.nasa.gov/api/') && Number.isFinite(Date.parse(row.retrievedAt)) && row.bytes > 0));
  require(Object.values(data.processedChecksums).every(row => hash.test(row.sha256)));
  require(data.variables.length === ids.length);
  data.variables.forEach((variable, index) => {
    require(variable.id === ids[index]);
    require(variable.monthly.length === 540 && variable.annual.length === 45);
    require(variable.monthly.every((row, i) => row.year === 1981 + Math.floor(i / 12) &&
      row.month === i % 12 + 1 && Number.isFinite(row.value) &&
      row.days === new Date(Date.UTC(row.year, row.month, 0)).getUTCDate()));
    require(variable.annual.every((row, i) => row.year === 1981 + i && Number.isFinite(row.value)));
    const trend = variable.trend;
    require([trend.slopePerYear, trend.slopePerDecade, trend.intercept].every(Number.isFinite));
    require([trend.adjustedP, trend.hamedRao.p ?? NaN, trend.ordinary.p].every(p => p >= 0 && p <= 1));
    require(trend.interval.perDecade.length === 2 && trend.interval.perDecade.every(Number.isFinite) &&
      trend.interval.perDecade[0] <= trend.interval.perDecade[1]);
    require(trend.significant === (trend.adjustedP <= data.methodology.alpha));
  });
  return data as unknown as Study;
}

export function getStudy(id = 'bahrain') {
  const snapshot = snapshots.find(item => item.id === id);
  return snapshot && validateStudy(snapshot);
}

export function getLocations() {
  return snapshots.map(({ id, name, region, latitude, longitude }) => ({
    id, name, country: id === 'bahrain' ? 'Bahrain' : region, latitude, longitude,
  }));
}
