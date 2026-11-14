# Data sources

The [NASA POWER Monthly and Annual API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/) serves historical meteorology from NASA GMAO's Modern-Era Retrospective analysis for Research and Applications, Version 2 (MERRA-2). The response identifies `MERRA2` and `POWER`. MERRA-2 combines observations and a numerical atmospheric model through data assimilation. Its fields are gridded reanalysis estimates. Satellite inputs can inform these estimates alongside other observations. [NASA POWER meteorological methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)

The native meteorological grid spacing is **0.5° latitude × 0.625° longitude**. The point request samples a coarse grid estimate. The returned longitude and latitude identify the requested point and do not establish a grid-cell centroid, the land fraction, or a Bahrain-wide average. Coastal grid values can reflect surrounding land and water, and this resolution cannot distinguish individual reclaimed areas. [NASA POWER data services](https://power.larc.nasa.gov/docs/services/) · [NASA POWER data FAQ](https://power.larc.nasa.gov/docs/faqs/data/)

| Parameter | Meaning | Unit in the AG response |
| --- | --- | --- |
| `T2M` | Monthly mean air temperature at 2 m | `C` (°C) |
| `T2M_MIN` | Minimum air temperature at 2 m, an extreme-value parameter | `C` (°C) |
| T2M_MIN_AVG | Monthly mean of daily minimum air temperatures at 2 m | C |
| `PRECTOTCORR` | Corrected precipitation expressed as a monthly mean daily rate | `mm/day` |

POWER distinguishes extreme-value parameters from averages of daily extremes. The Mission 002 spot check showed that the February 2025 snapshot value matched the lowest daily minimum. See [Analysis method](ANALYSIS_METHOD.md) for the comparison. MERRA-2 uses observationally corrected precipitation forcing over land. The response does not describe how that correction applies to the sampled coastal grid cell. Monthly precipitation depth in mm can be derived by multiplying the monthly rate by the number of days in that month, including leap days. [NASA POWER temporal processing](https://power.larc.nasa.gov/docs/methodology/data/processing/) · [NASA POWER meteorological methodology](https://power.larc.nasa.gov/docs/methodology/data/sources_meteorology/)
