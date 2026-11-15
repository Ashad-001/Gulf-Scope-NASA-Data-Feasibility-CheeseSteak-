# Data sources

The [NASA POWER Monthly and Annual API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) serves historical meteorology from NASA GMAO's Modern-Era Retrospective analysis for Research and Applications, Version 2 (MERRA-2). The response identifies `MERRA2` and `POWER`. MERRA-2 combines observations and a numerical atmospheric model through data assimilation. Its fields are gridded reanalysis estimates. Satellite inputs can inform these estimates alongside other observations. [NASA POWER meteorological methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)

The native meteorological grid spacing is **0.5° latitude × 0.625° longitude**. The point request samples a coarse grid estimate. The returned longitude and latitude identify the requested point and do not establish a grid-cell centroid, the land fraction, or a Bahrain-wide average. Coastal grid values can reflect surrounding land and water, and this resolution cannot distinguish individual reclaimed areas. [NASA POWER data services](https://power.larc.nasa.gov/docs/services/) · [NASA POWER data FAQ](https://power.larc.nasa.gov/docs/faqs/data/)

| Parameter | Meaning | Unit in the AG response |
| --- | --- | --- |
| `T2M` | Monthly mean air temperature at 2 m | `C` (°C) |
| `T2M_MIN` | Minimum air temperature at 2 m, an extreme-value parameter | `C` (°C) |
| `T2M_MIN_AVG` | Monthly mean of daily minimum air temperatures at 2 m | `C` (°C) |
| `T2M_MAX_AVG` | Monthly mean of daily maximum air temperatures at 2 m | `C` (°C) |
| `RH2M` | Mean relative humidity at 2 m | `%` |
| `WS2M` | Mean wind speed at 2 m | `m/s` |
| `PRECTOTCORR` | Corrected precipitation expressed as a monthly mean daily rate | `mm/day` |

POWER distinguishes extreme-value parameters from averages of daily extremes. The Mission 002 spot check showed that the February 2025 snapshot value matched the lowest daily minimum. See [Analysis method](ANALYSIS_METHOD.md) for the comparison. MERRA-2 uses observationally corrected precipitation forcing over land. The response does not describe how that correction applies to the sampled coastal grid cell. Monthly precipitation depth in mm can be derived by multiplying the monthly rate by the number of days in that month, including leap days. [NASA POWER temporal processing](https://power.larc.nasa.gov/docs/methodology/data/processing/) · [NASA POWER meteorological methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)

`T2M_MIN` is retained for source verification; the published six-site minimum-temperature series is `T2M_MIN_AVG`. Bahrain, Kuwait City, Muscat, Doha, Riyadh and Abu Dhabi have 540 valid months and 45 complete years per published meteorological variable, 1981–2025.

## Additional products

| Product | Available record | Processing and limits |
| --- | --- | --- |
| NASA POWER solar, `ALLSKY_SFC_SW_DWN` | 1984–2025, 504 months and 42 years at each point; 1° grid | Mean daily energy in MJ/m²/day. GEWEX SRB transitions to CERES in 2001; trends spanning the change are exploratory. |
| GPM IMERG via NASA POWER, `IMERG_PRECTOT` | 2001–2025, 9,131 valid UTC days, 300 months and 25 years at each point; documented 0.1° grid | Complete monthly and annual totals in mm sum daily depths. The API identifies IMERG but does not expose the sampled cell centre, exact algorithm version, or processing run. |
| NASA POWER high-resolution SMAP Level-4, `SFMC` and `RZMC` | March 2015–December 2025 daily archive; 3,928 valid days, 128 months, nine complete years (2016–2024) per point and variable | Satellite-constrained model estimates, m³/m³, approximately 9 km. Require all days in each UTC month and all months in an annual mean. March 2015 is partial; the missing September 20, 2025 removes that month and year. Nine years do not qualify for the 20-year trend test. |
| Native Bahrain MERRA-2, `T2M` | February and March 2025 only | Separate coarse native-cell pilot. Preserve the conflicting 2016 `TemporalRange` metadata. Comparison with POWER does not independently validate either source against ground stations. |

See the [scientific catalog](SCIENTIFIC_CATALOG.md) and [hydrology verification notes](HYDROLOGY_INTEGRATION.md) for archive paths, checksums, aggregation rules, and the reasons the original probes were not used.
