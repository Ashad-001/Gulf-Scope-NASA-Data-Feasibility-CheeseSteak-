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
