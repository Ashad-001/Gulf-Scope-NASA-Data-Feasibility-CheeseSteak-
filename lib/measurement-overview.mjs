import { commonPeriods, filterYears, trendFamily } from './series-analysis.mjs';
import { variables } from './series-catalog.mjs';

export const measurementGroups = [
  { id: 'air-temperature', name: 'Air Temperature', codes: ['T2M', 'T2M_MIN_AVG', 'T2M_MAX_AVG'] },
  { id: 'precipitation', name: 'Precipitation', codes: ['PRECTOTCORR', 'IMERG_PRECTOT'] },
  { id: 'power-smap', name: 'Soil Moisture', codes: ['SFMC', 'RZMC'] },
].map(group => ({
  ...group,
  overview: group.id + ':all',
  definitions: variables.filter(variable => group.codes.includes(variable.id)),
}));

/**
 * @param {typeof variables} definitions
 * @param {ReturnType<typeof import('./expanded-series').recordsFor>[]} recordsByMeasurement
 * @param {number} locationIndex
 * @param {number} first
 * @param {number} last
 * @param {boolean} monthly
 */
export function prepareMeasurements(definitions, recordsByMeasurement, locationIndex, first, last, monthly) {
  const measurements = definitions.map((definition, index) => {
    const records = recordsByMeasurement[index];
    const annual = records.map(record => filterYears(record.annual, first, last));
    const record = records[locationIndex];
    const years = annual[locationIndex];
    const displayed = monthly ? filterYears(record.monthly, first, last) : years;
    return {
      definition,
      record,
      years,
      unit: monthly ? definition.monthlyUnit : definition.annualUnit,
      displayed,
      rows: commonPeriods([displayed], monthly),
      trend: trendFamily(annual)[locationIndex],
    };
  });
  return {
    measurements,
    comparison: measurements.every(measurement => measurement.unit === measurements[0].unit)
      ? commonPeriods(measurements.map(measurement => measurement.displayed), monthly) : [],
  };
}
