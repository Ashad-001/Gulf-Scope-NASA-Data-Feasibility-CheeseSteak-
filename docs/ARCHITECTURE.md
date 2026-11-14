# Application architecture

Next.js App Router serves the landing page and the investigation. React and TypeScript handle the workspace. Tailwind CSS and project styles define the layout, Motion animates the illustrative orbital contours, Recharts renders annual observations and their fit, and MapLibre loads an attributed OpenStreetMap basemap. The generated opening art is illustrative.

## Data contract

`scripts/generate-public-data.mjs` checks the processed CSVs against their manifest and replays validation of the pinned raw snapshots. It recomputes Sen slope, ordinary and Hamed–Rao Mann–Kendall, Holm adjustment, and the bootstrap intervals using the existing analysis engine. It emits a deterministic JSON bundle. `lib/study.ts` validates the versioned study at the server boundary. The contract carries location, source and modeled grid spacing, coverage, monthly and annual observations, units, completeness, trend and uncertainty, statistical methods and checksums.

`GET /api/studies/bahrain` serves the validated bundle. Unknown IDs return 404. A dataset validation error returns 503. No live NASA call is necessary at runtime, so the pinned study remains usable during NASA service interruptions. The map tiles are external. Map failures leave the coordinate, attribution and resolution available as text.

The displayed period changes the chart and accessible values table. Trend statistics always use the full 1981–2025 record. The reported interval estimates slope uncertainty. A pointwise prediction band would require a different calculation.

Bahrain is the default. Riyadh (24.71° N, 46.68° E) and Muscat (23.59° N, 58.41° E) use separate checksummed NASA POWER AG monthly snapshots. All three parameters must have 540 valid months, consistent units and expected dates before each site can enter the bundle. Their bootstrap estimates and three-test Holm correction are calculated independently by site. The study is descriptive and does not perform cross-site hypothesis tests.
