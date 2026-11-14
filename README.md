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
- [Submission draft](docs/SUBMISSION_CONTENT.md), [references](docs/SUBMISSION_REFERENCES.md), and [seven-slide outline](docs/FINAL_DEMO_SCRIPT.md)

## Publish on Vercel

1. Sign in to the [Vercel dashboard](https://vercel.com/dashboard) and select your personal Hobby scope.
2. Choose **Add New → Project**. Connect GitHub if prompted. Grant Vercel access to the existing `Ashad-001/Gulf-Scope-NASA-Data-Feasibility-CheeseSteak-` repository and select **Import**.
3. Keep **Next.js** as the framework, the repository root as the root directory, and select Node.js 22.x in project settings. Set **Build Command** to `npm run build` and leave **Output Directory** and **Environment Variables** at their defaults. Deploy `master` as the production branch.
4. Open the production domain from **Deployments** or **Settings → Domains** in a signed-out browser. The stable production domain should be public. Preview protection can remain in place.
5. Check `/investigate`, map tiles and all three endpoints `/api/studies/bahrain`, `/api/studies/riyadh`, and `/api/studies/muscat`. Each endpoint should return 540 months and 45 years. Add the public production URL to the submission after verification.
