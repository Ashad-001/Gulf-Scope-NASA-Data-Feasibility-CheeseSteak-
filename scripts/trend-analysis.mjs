import { pathToFileURL } from 'node:url';
import { loadDataset } from './build-analysis-dataset.mjs';
import { analyzeTrend, holmAdjust } from '../lib/annual-trend.mjs';
export { analyzeTrend, holmAdjust } from '../lib/annual-trend.mjs';

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { annual, source, minimumSource } = await loadDataset();
  const tests = [
    { variable: 'annual_mean_air_temperature', unit: 'C', ...analyzeTrend(annual.map(row => row.mean_t2m_c)) },
    { variable: 'annual_mean_daily_minimum_air_temperature', unit: 'C', ...analyzeTrend(annual.map(row => row.mean_daily_min_t2m_c)) },
    { variable: 'annual_estimated_precipitation_accumulation', unit: 'mm', ...analyzeTrend(annual.map(row => row.estimated_precipitation_mm)) },
  ];
  const adjusted = holmAdjust(tests.map(result => result.hamedRao?.p ?? null));
  tests.forEach((result, index) => {
    result.holmP = adjusted[index];
    result.significant = result.holmP === null ? null : result.holmP <= 0.05;
  });
  console.log(JSON.stringify({ snapshotSha256: source.sha256, minimumSnapshotSha256: minimumSource.sha256, alpha: 0.05, tests }, null, 2));
}
