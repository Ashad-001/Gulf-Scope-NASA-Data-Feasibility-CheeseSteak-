# Submission references

## Scientific data and methods

- NASA Langley Research Center, Prediction Of Worldwide Energy Resources. AG monthly point responses for Bahrain, Riyadh, and Muscat and a February 2025 Bahrain daily cross-check. See repository `data/raw/` for all response bodies, requests, retrieval times and hashes. [NASA POWER monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) · [Daily API](https://power.larc.nasa.gov/docs/services/api/temporal/daily/) · [Temporal processing](https://power.larc.nasa.gov/docs/methodology/data/processing/) · [Meteorological methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/) · [Grid resolution](https://power.larc.nasa.gov/docs/services/)
- NASA Giovanni, a challenge-listed tool evaluated for a comparison. Candidate dataset M2TMNXSLV v5.12.4, NASA GMAO and Steven Pawson (2015), NASA GES DISC. Export and integration remain pending. [Giovanni](https://giovanni.gsfc.nasa.gov/) · [NASA Earthdata dataset record](https://www.earthdata.nasa.gov/data/catalog/ges-disc-m2tmnxslv-5.12.4) · [Dataset DOI](https://doi.org/10.5067/AP1B0BA5PD2K)
- Sen slope, Hamed–Rao Mann–Kendall, Holm correction, and moving-block bootstrap. [Sen (1968)](https://doi.org/10.2307/2285891) · [Hamed and Rao (1998)](https://doi.org/10.1016/S0022-1694(97)00125-X) · [Holm (1979)](https://www.jstor.org/stable/4615733) · [Künsch (1989)](https://doi.org/10.1214/aos/1176347265) · [Reference implementation consulted](https://raw.githubusercontent.com/cran/modifiedmk/master/R/mmkh.R)

## Code, dependencies and assets

- GulfScope source and original analysis code. The repository lockfile lists exact package versions and transitive dependencies. [GitHub repository](https://github.com/Ashad-001/Gulf-Scope-NASA-Data-Feasibility-CheeseSteak-) · [Dependency manifest](../package.json) · [Lockfile](../package-lock.json)
- Runtime and interface tools. [Node.js](https://nodejs.org/) · [Next.js](https://nextjs.org/) · [React](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [Tailwind CSS](https://tailwindcss.com/) · [Motion](https://motion.dev/) · [Recharts](https://recharts.org/) · [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- Basemap tiles and geographic labels. [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [Tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
- Orbital illustration generated with OpenAI image generation. The contour illustration is rendered from the project's Motion component. Codex assisted with development, QA, and writing. [Hero image](../public/orbit.png) · [Contour code](../components/contours.tsx)

## Competition

- [Official challenge Resources](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources) · [Global Organizing Team resource guidance](https://github.com/nasa/spaceapps/discussions/1827) · [Global awards](https://www.spaceappschallenge.org/awards/)
