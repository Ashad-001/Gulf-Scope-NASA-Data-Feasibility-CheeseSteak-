# GulfScope

Investigate historical air temperature and precipitation in Bahrain using NASA POWER MERRA-2 reanalysis from 1981–2025.

## Run locally

Use Node.js 22 and npm.

```sh
npm ci
npm run dev
```

Open [GulfScope](http://localhost:3000). For production verification, run `npm test`, `npm run build`, then `npm start`. The build and development scripts regenerate validated public data from the repository snapshots.

- [Architecture and data contract](docs/ARCHITECTURE.md)
- [Scientific methods](docs/ANALYSIS_METHOD.md) and [results](docs/ANALYSIS_RESULTS.md)
- [NASA source validation](docs/DATA_VALIDATION.md) and [challenge resources](docs/CHALLENGE_RESOURCE_COMPLIANCE.md)
- [Demo walkthrough](docs/DEMO_WALKTHROUGH.md)
