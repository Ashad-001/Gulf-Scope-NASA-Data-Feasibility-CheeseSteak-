const power = 'https://power.larc.nasa.gov/docs/services/api/temporal/monthly/';
const hydrology = 'https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/';
const point = 'Representative POWER requested point; coordinates do not identify the native grid-cell centre or a national average.';
const complete = 'Reject absent, masked, nonfinite or out-of-range values; derive annual values only for complete calendar years.';
const annualMean = 'Calendar-day-weighted annual mean of complete monthly values.';
const rateSum = 'Multiply each monthly mean daily rate by calendar days and sum the 12 depths.';
export const datasets = {
  'power-merra2': { name: 'POWER meteorology', provider: 'NASA POWER', product: 'MERRA-2 reanalysis', source: power, resolution: '0.5° latitude × 0.625° longitude', sampling: point, caveat: 'Coastal points can represent mixed land and water. Shared MERRA-2 lineage does not provide independent station validation.' },
  'power-solar': { name: 'POWER solar radiation', provider: 'NASA POWER', product: 'GEWEX SRB and CERES SYN1deg', source: power, resolution: '1° × 1°', sampling: point, caveat: 'POWER uses GEWEX SRB for 1984–2000 and CERES SYN1deg from 2001. Cross-transition trends are exploratory and can reflect changes in source products.' },
  'power-imerg': { name: 'GPM IMERG', provider: 'NASA POWER', product: 'GPM multi-satellite IMERG precipitation estimates', source: 'https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/', resolution: '0.1° × 0.1° (documented)', sampling: 'POWER requested point; the response does not supply native cell coordinates or land/water support.', caveat: 'UTC satellite-based estimates. The archive identifies IMERG but does not report its algorithm version or processing run. Coastal cells may mix land and water. Not directly interchangeable with local-solar-time MERRA-2 precipitation.' },
  'power-smap': { name: 'SMAP soil moisture', provider: 'NASA POWER', product: 'SMAP Level-4 satellite-constrained Catchment land model', source: hydrology, resolution: 'Approximately 9 km; POWER latitude–longitude grid', sampling: 'Nearest archive centre on each coordinate axis; no resampling or substitution of nearby land cells.', caveat: 'Modelled volumetric water content constrained by SMAP observations. The POWER archive flags these variables as reviewing. Do not splice with MERRA-2.' },
  'native-merra2': { name: 'Bahrain native-cell proof', provider: 'NASA GMAO', product: 'MERRA-2 M2TMNXSLV v5.12.4', source: 'https://doi.org/10.5067/AP1B0BA5PD2K', resolution: '0.5° latitude × 0.625° longitude', sampling: 'Native grid-cell extraction; midpoint-derived footprint.', caveat: 'Two verified months only. The conflicting TemporalRange attribute ends in 2016. No trend or independent station validation.' },
};
function series(dataset, id, name, sourceUnit, monthlyUnit, annualUnit = monthlyUnit, aggregation = annualMean, range = [-Infinity, Infinity], start = 1981, archive = 'legacy') {
  return { dataset, id, name, sourceUnit, monthlyUnit, annualUnit, aggregation, range, start, end: 2025, archive, temporalResolution: 'Monthly source; derived annual where eligible', missingPolicy: complete };
}
export const variables = [
  series('power-merra2', 'T2M', 'Mean air temperature at 2 m', 'C', '°C'),
  series('power-merra2', 'T2M_MIN_AVG', 'Mean daily minimum air temperature at 2 m', 'C', '°C'),
  series('power-merra2', 'PRECTOTCORR', 'Corrected precipitation', 'mm/day', 'mm/day', 'mm', rateSum),
  series('power-merra2', 'T2M_MAX_AVG', 'Mean daily maximum air temperature at 2 m', 'C', '°C', '°C', annualMean, [-90, 65], 1981, 'extension'),
  series('power-merra2', 'RH2M', 'Relative humidity at 2 m', '%', '%', '%', annualMean, [0, 100], 1981, 'extension'),
  series('power-merra2', 'WS2M', 'Mean wind speed at 2 m', 'm/s', 'm/s', 'm/s', annualMean, [0, 100], 1981, 'extension'),
  series('power-solar', 'ALLSKY_SFC_SW_DWN', 'All-sky surface downward shortwave radiation', 'MJ/m^2/day', 'MJ/m²/day', 'MJ/m²/day', annualMean, [0, 50], 1984, 'solar'),
  { ...series('power-imerg', 'IMERG_PRECTOT', 'IMERG precipitation', 'mm/day', 'mm', 'mm', 'Sum daily UTC precipitation depths into monthly and annual totals.', [0, Infinity], 2001, 'imerg-daily'),
    temporalResolution: 'Daily UTC source; derived monthly and annual totals',
    missingPolicy: 'Require every day for a monthly total and every complete month for an annual total; never impute missing values.' },
  ...[['SFMC', 'Surface soil moisture (0–5 cm)'], ['RZMC', 'Root-zone soil moisture (0–100 cm)']].map(([id, label]) => ({
    ...series('power-smap', id, label, 'm3 m-3', 'm³/m³', 'm³/m³', 'Arithmetic mean of valid daily UTC values in each complete period.', [0, 0.9], 2015, 'smap-daily'),
    temporalResolution: 'Daily UTC source; derived monthly and annual means',
    missingPolicy: 'Require every UTC day in a calendar month and all twelve complete months in a calendar year. Do not impute missing values.',
  })),
];
export const nativeVariable = { dataset: 'native-merra2', id: 'T2M', name: 'Monthly mean air temperature at 2 m', sourceUnit: 'K', monthlyUnit: '°C', temporalResolution: 'Monthly', aggregation: 'Kelvin minus 273.15; no annual aggregation', missingPolicy: 'Require a verified native cell and valid monthly values.' };
