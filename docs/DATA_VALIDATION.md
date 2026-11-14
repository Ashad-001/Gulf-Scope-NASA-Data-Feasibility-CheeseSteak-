# Mission 001 data validation

NASA POWER returned HTTP 200 and `application/json` on 2026-11-14 at 12:43:27 UTC. The exact [request](https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M%2CT2M_MIN%2CPRECTOTCORR&community=AG&longitude=50.55&latitude=26.07&start=1981&end=2025&format=JSON) used Bahrain coordinates 26.07° N, 50.55° E and the Agroclimatology (`AG`) community.

```text
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M%2CT2M_MIN%2CPRECTOTCORR&community=AG&longitude=50.55&latitude=26.07&start=1981&end=2025&format=JSON
```

The response is a GeoJSON Point Feature with longitude and latitude echoed in the geometry. Parameter definitions and units are in `parameters`. Time series are in `properties.parameter`. The header identifies POWER API v2.10.0, sources `MERRA2` and `POWER`, Local Solar Time (`LST`), and a fill sentinel of `-999`. The header bounds are `19810101` and `20251231`. The API returned no messages.

| Parameter | Unit | First valid month | Last valid month | Valid months | Absent / fill / invalid months | Annual entries |
| --- | --- | --- | --- | ---: | --- | ---: |
| `T2M` | °C | 1981-01 | 2025-12 | 540 | 0 / 0 / 0 | 45 |
| `T2M_MIN` | °C | 1981-01 | 2025-12 | 540 | 0 / 0 / 0 | 45 |
| `PRECTOTCORR` | mm/day | 1981-01 | 2025-12 | 540 | 0 / 0 / 0 | 45 |

The response contains 540 distinct months and 1,620 monthly parameter values. Each series also has 45 usable annual summaries under `YYYY13`, which are excluded from the monthly counts. Monthly checks flagged zero negative precipitation values and zero minimum temperatures above the corresponding mean. These tests establish completeness and basic consistency. They cannot establish agreement with local measurements.

The [raw response](../data/raw/nasa-power-bahrain-2026-11-14T12-43-27.267Z.json) contains the saved NASA response body. Its [retrieval metadata](../data/raw/nasa-power-bahrain-2026-11-14T12-43-27.267Z.metadata.json) records the URL, UTC retrieval time, status, content type, byte count and SHA-256.

Run a live retrieval using Node.js 22 from the repository root. Each run creates a timestamped snapshot and metadata. To replay the checks without network access, pass a saved response.

```powershell
node scripts/verify-nasa-power.mjs
node scripts/verify-nasa-power.mjs data/raw/nasa-power-bahrain-2026-11-14T12-43-27.267Z.json
```

The first connectivity probe failed DNS resolution in the sandbox. With network access the probe and the verifier both received HTTP 200. No NASA POWER HTTP errors were observed. The official challenge page returned HTTP 502 through the research browser, so its contents could not be independently verified there.

NASA documents a 0.5° latitude × 0.625° longitude meteorological grid. The estimates represent reanalysis at coarse spatial scale, with no basis for reclaimed-area attribution. Correlation cannot establish causation. This mission did not estimate trends. Remaining analysis decisions include the monthly minimum aggregation check, precipitation rate-to-depth conversion, and treatment of seasonality and serial dependence. [NASA monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) · [NASA spatial resolution](https://power.larc.nasa.gov/docs/services/) · [Data sources and parameter semantics](DATA_SOURCES.md)

## Mission 002.1 supplemental validation

NASA returned HTTP 200 for monthly `T2M_MIN_AVG` using AG, 26.07° N, 50.55° E, 1981–2025 and JSON. The header identifies MERRA2 and POWER, LST, API v2.10.0 and fill value −999. The definition is “Temperature at 2 Meters Minimum Average” in °C. All 540 months are valid. The 45 annual keys are excluded from aggregation. [Exact NASA monthly request](https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=T2M_MIN_AVG&community=AG&longitude=50.55&latitude=26.07&start=1981&end=2025&format=JSON)

The archived February 2025 daily `T2M_MIN` series has 28 valid observations at the same point, AG community and LST. Its minimum is 13.42°C, matching the original monthly extreme. Its mean is 16.340357°C, matching the supplemental monthly value of 16.34°C within rounding.

- [Monthly response](../data/raw/nasa-power-bahrain-min-avg-1981-2025.json) and [metadata](../data/raw/nasa-power-bahrain-min-avg-1981-2025.metadata.json)
- [Daily comparison](../data/raw/nasa-power-bahrain-daily-min-2025-02.json) and [metadata](../data/raw/nasa-power-bahrain-daily-min-2025-02.metadata.json)
