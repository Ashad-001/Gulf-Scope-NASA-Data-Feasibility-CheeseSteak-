import { commonPeriods, filterYears, trendFamily } from './series-analysis.mjs';
import { variables } from './series-catalog.mjs';

export const precipitationOverview = 'precipitation:all';
export const precipitationMeasurements = variables.filter(variable =>
  variable.id === 'PRECTOTCORR' || variable.id === 'IMERG_PRECTOT');

export function preparePrecipitation(recordsByMeasurement, locationIndex, first, last, monthly) {
  const measurements = precipitationMeasurements.map((definition, index) => {
    const records = recordsByMeasurement[index];
    const annual = records.map(record => filterYears(record.annual, first, last));
    const record = records[locationIndex];
    const years = annual[locationIndex];
    return {
      definition,
      record,
      years,
      unit: monthly ? definition.monthlyUnit : definition.annualUnit,
      rows: commonPeriods([monthly ? filterYears(record.monthly, first, last) : years], monthly),
      trend: trendFamily(annual)[locationIndex],
    };
  });
  return {
    measurements,
    comparison: monthly ? [] : commonPeriods(measurements.map(measurement => measurement.years), false),
  };
}
