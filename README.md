# GulfScope

GulfScope is an independent NASA Space Apps 2026 project for investigating environmental change at six representative Gulf study points: Bahrain, Kuwait City, Muscat, Doha, Riyadh, and Abu Dhabi. The Orbita-inspired Earth opening leads to the regional atlas and the interactive Field Desk, where visitors can select a source, variable, period, and temporal view; compare sites; and inspect evidence and provenance.

| Evidence | Coverage and interpretation |
| --- | --- |
| NASA POWER meteorology (MERRA-2) | Six variables at all six points, January 1981–December 2025; 540 valid months and 45 complete years per variable and point. The underlying grid is 0.5° latitude × 0.625° longitude. |
| NASA POWER solar | 1984–2025, 1° grid. Trends spanning the 2001 GEWEX SRB–CERES transition are exploratory. |
| GPM IMERG via NASA POWER | 2001–2025; 9,131 valid UTC days, 300 complete months and 25 complete years per point. Monthly and annual precipitation totals are in mm. NASA documents a 0.1° grid. |
| NASA POWER high-resolution SMAP Level-4 | Surface and root-zone moisture, daily source from March 2015 through December 2025; 128 complete months and nine complete years (2016–2024) per variable and point. Values are descriptive satellite-constrained model estimates in m³/m³, at approximately 9 km. |
| Native Bahrain MERRA-2 pilot | February and March 2025 only, with a derived native-cell footprint and separate provenance. Comparison with POWER is a processing-consistency check, not independent station validation. |

The records are representative point or cell estimates, not national averages or neighbourhood observations. Incomplete hydrology periods are omitted. Field Desk trends require at least 20 consecutive complete annual observations and use Sen's slope, Hamed–Rao modified Mann–Kendall, Holm adjustment across the six points for the selected variable and period, and an approximate moving-block bootstrap slope interval. A trend does not establish causation.

## Run and verify

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open [GulfScope](http://localhost:3000). The Field Desk is at `/investigate?mode=series`. The original POWER view and native case remain at `/investigate` and `/investigate?mode=native-cell`.

```sh
npm test
npm run build
node scripts/audit-power-investigation.mjs
npm start
```

Builds regenerate the public snapshots from checksummed repository archives. The application does not need NASA credentials, Python, local downloads, or a live NASA request to display its archived evidence. The optional SMAP extraction script can reproduce the derived points offline from the preserved source chunks.

- [Data sources](docs/DATA_SOURCES.md) and [scientific catalog](docs/SCIENTIFIC_CATALOG.md)
- [Hydrology source verification and limitations](docs/HYDROLOGY_INTEGRATION.md)
- [Architecture and data contract](docs/ARCHITECTURE.md)
- [Original Bahrain analysis methods](docs/ANALYSIS_METHOD.md) and [results](docs/ANALYSIS_RESULTS.md)
- [NASA source validation](docs/DATA_VALIDATION.md) and [challenge resources](docs/CHALLENGE_RESOURCE_COMPLIANCE.md)

## Deployment

Use the existing linked Vercel project if available. Keep the repository root, Next.js preset, Node.js 22.x, and `npm run build`; no application environment variables are required. Deploy the exact release commit as a preview before publishing to the existing production domain. Keep the current production deployment available for rollback.

On the public domain, check the homepage, atlas links, Field Desk with POWER, IMERG and SMAP, and the native Bahrain month selector. Verify the six `/api/studies/<site>` responses and test the site from a signed-out mobile browser. OpenStreetMap tiles provide map context; the site index and coordinate fallback remain usable without tiles.
