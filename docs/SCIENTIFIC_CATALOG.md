# Scientific series catalog

The point-series explorer at `/investigate?mode=series` reads the catalog in `lib/series-catalog.mjs` and local snapshots. The six representative POWER coordinates and three legacy records retain their original values and provenance. A point is neither a country average nor a verified native grid-cell centre.

| Dataset and codes | Coverage at each of the six points | Monthly units | Annual statistic |
| --- | --- | --- | --- |
| POWER/MERRA-2: T2M, T2M_MIN_AVG, T2M_MAX_AVG | 1981–2025; 540 months / 45 years each | °C | Calendar-day-weighted mean of the monthly mean temperature, mean daily minimum, or mean daily maximum, respectively |
| POWER/MERRA-2: RH2M, WS2M | 1981–2025; 540 months / 45 years each | %, m/s | Calendar-day-weighted annual mean |
| POWER/MERRA-2: PRECTOTCORR | 1981–2025; 540 months / 45 years | mm/day | Estimated annual depth in mm: sum the monthly means multiplied by their actual month lengths, including leap days |
| POWER solar: ALLSKY_SFC_SW_DWN | 1984–2025; 504 months / 42 years | MJ/m²/day | Calendar-day-weighted mean daily downward shortwave energy |
| GPM IMERG: IMERG_PRECTOT | 2001–2025; 300 complete months / 25 complete years per point | mm, summed from daily UTC depth | Annual depth in mm |
| SMAP L4: SFMC, RZMC | 2015–2025 source; 128 complete months / 9 complete years per point | m³/m³ | Arithmetic mean of valid daily values in complete UTC years |
| Bahrain native M2TMNXSLV v5.12.4: T2M | Bahrain only; February and March 2025 | K source; °C displayed | None |

POWER meteorology uses MERRA-2 (0.5° latitude × 0.625° longitude). Solar uses GEWEX SRB (1984–2000) and CERES SYN1deg (2001 onward), 1° × 1°. Solar slopes crossing the source change are exploratory. IMERG is a distinct GPM satellite precipitation product (documented 0.1°); SMAP L4 assimilates SMAP observations into a land model (approximately 9 km). The old monthly hydrology probes returned only fill values and no source identifiers. The [hydrology integration notes](HYDROLOGY_INTEGRATION.md) document the successful daily paths, coverage, extraction verification and limitations. Do not treat UTC IMERG and local-solar-time MERRA-2 totals as interchangeable or splice SMAP and MERRA-2 moisture.

Source responses and Zarr objects are preserved under `data/raw/` with SHA-256 metadata. `npm run data:public` reads the local archives, validates source identity, coordinates, temporal coverage, fill values, units and physical ranges before writing the separate ignored expanded snapshot. No API call is made by generation. For daily hydrology, a month missing any day is excluded, and a year missing any month is never aggregated. Comparisons use shared periods and a common unit.

The interactive explorer analyzes consecutive complete annual values only (minimum 20 years), even with monthly plotting selected. It reuses Sen's slope and Hamed–Rao modified Mann–Kendall, with Holm adjustment at 0.05 across the six sites for the selected variable and period. A deterministic 1,999-replicate moving-block bootstrap gives an approximate 95% slope interval; the default block length is the rounded cube root of the sample count, minimum two years. Intervals are marginal and do not establish significance. Repeated comparisons across windows or variables are exploratory; there is no global correction across those user searches. This explorer does not overwrite the legacy analyses, which use a different test family. The documented bootstrap block-length sensitivity check was for Bahrain only.

Bahrain's two native observations (17.93 °C and 20.74 °C; centre 26.000° N, 50.625° E, footprint 25.75–26.25° N and 50.3125–50.9375° E) stay separate. The conflicting 2016 `TemporalRange` is disclosed. A coarse cell cannot resolve individual coastal developments; the related POWER comparison does not independently validate these observations against ground stations.

Official sources: [POWER monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) · [POWER hydrology products](https://power.larc.nasa.gov/docs/methodology/data/sources_hydrology/) · [MERRA-2 native monthly collection](https://doi.org/10.5067/AP1B0BA5PD2K).
