# Challenge resource compliance

The [official Resources tab](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=resources) was inspected in the browser on November 14, 2026. The [Global Organizing Team guidance](https://github.com/nasa/spaceapps/discussions/1827) requires using at least one NASA data source included in the challenge resources for Global Award eligibility.

## Official NASA Data & Resources section

| Listed resource | Publisher and role in GulfScope |
| --- | --- |
| [Giovanni](https://giovanni.gsfc.nasa.gov/) | NASA GES DISC. The catalog exposes monthly MERRA-2 2-meter air temperature, M2TMNXSLV v5.12.4. Evaluated as a comparison source. |
| [Hydrology Time Series](https://disc.gsfc.nasa.gov/information/tools?title=Hydrology%20Time%20Series) | NASA GES DISC. Listed hydrology extraction tool. |
| [AppEEARS](https://appeears.earthdatacloud.nasa.gov/) | NASA Earthdata. Listed geospatial data extraction tool. |
| [Climate Data Online (CDO)](https://www.ncei.noaa.gov/cdo-web/) | NOAA. Listed in this section by the challenge. GulfScope uses NASA POWER for the study. |
| [Time-Series Analysis of Remotely-Sensed SeaWiFS Chlorophyll in River-Influenced Coastal Regions](https://ntrs.nasa.gov/api/citations/20090042747/downloads/20090042747.pdf) | NASA Technical Reports Server. Listed methods example. |

The separate partner section also lists KNMI Climate Explorer, two statistical articles, RADARSAT Constellation Mission data, Geo.ca, CSA SWOT information, CSA ecosystem monitoring, and a CSA SAR tutorial.

## Application source and status

NASA POWER is absent by name from the tab. The Bahrain workspace directly uses NASA POWER MERRA-2 monthly T2M, T2M_MIN_AVG and PRECTOTCORR to build its observations and trend results. The [validation record](DATA_VALIDATION.md) and manifest identify the requests, retrieval times, checksums and processing. Cite NASA Langley Research Center POWER and NASA GMAO MERRA-2 when presenting these series. [NASA POWER monthly API](https://power.larc.nasa.gov/docs/services/api/temporal/monthly/)

Giovanni is a listed route to MERRA-2. Its guest area-averaged time-series tool showed a four-step limit. The small 2025 comparison attempt did not produce a verified export during this mission. No Giovanni results enter the app. Global Award resource eligibility remains unverified. Obtain and preserve a validated export through a listed source and use it in the evidence view, or obtain organizer confirmation that the POWER delivery of MERRA-2 qualifies.

## Mission 004

NASA Earthdata confirms M2TMNXSLV v5.12.4 is a monthly, time-averaged MERRA-2 single-level diagnostic collection on a 0.5° latitude × 0.625° longitude grid. The candidate variable is 2-meter air temperature (`T2M`). Cite Global Modeling and Assimilation Office and Steven Pawson (2015), *MERRA-2 monthly time-averaged single-level diagnostics, V5.12.4*, NASA Goddard Earth Sciences Data and Information Services Center. [NASA Earthdata catalog](https://www.earthdata.nasa.gov/data/catalog/ges-disc-m2tmnxslv-5.12.4) · [DOI 10.5067/AP1B0BA5PD2K](https://doi.org/10.5067/AP1B0BA5PD2K)

The expected export, `data/raw/nasa-giovanni-m2tmnxslv-bahrain-1981-2025.csv`, is missing. There are no verified Giovanni observations, comparison statistics, or app contributions. Technical demonstration of the listed-resource requirement remains pending.

### Import procedure

1. Sign in to Giovanni personally with NASA Earthdata. Select **Time Series, Area-Averaged** and **2-meter air temperature (M2TMNXSLV v5.12.4)**. Choose January 1981 through December 2025.
2. Use a narrow bounding box containing the POWER request at 26.07° N, 50.55° E. Record its exact west, south, east, and north coordinates and the spatial aggregation shown in the export. For example, 50.3, 25.9, 50.8, 26.3 contains the point. The selected cells and weights require verification.
3. Save the untouched CSV at the path above. Retain the Giovanni source or session link, run date, dataset identifier, units, region, aggregation and any processing notes. Share only public provenance and export files.
4. Calculate SHA-256 and preserve the CSV and retrieval metadata. Verify 540 unique finite months and the product, units, grid selection, and time convention. Convert Kelvin to Celsius if the export uses Kelvin. Document UTC and Local Solar Time conventions and any mismatch in cells or weighting before comparing.
5. If compatible, aggregate by calendar days, calculate aligned monthly and annual differences and Sen slope comparisons, and render the comparison with provenance in the app. Both series share MERRA-2, so agreement measures consistency between delivery and sampling methods.

**Organizer clarification draft**

Does the verified NASA POWER delivery of MERRA‑2 satisfy the listed-resource requirement when the challenge lists Giovanni as a MERRA‑2 access tool, or must GulfScope use a Giovanni or other listed-tool export directly in its evidence view?
