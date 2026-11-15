# GulfScope | Earth system trends in the Arabian Gulf

**Challenge** Be An Earth System Trend Detective!

**Summary** GulfScope helps Gulf learners investigate environmental change with NASA data. Start at the cinematic Earth, use the atlas to choose Bahrain, Riyadh, Muscat, Kuwait City, Doha or Abu Dhabi, then examine the selected record in the Field Desk. These are representative study points. The chart, data table, evidence card and provenance disclosure let learners trace a conclusion back to its source.

## NASA evidence

| Record | What the release uses |
| --- | --- |
| NASA POWER meteorology | 1981–2025 monthly MERRA-2-derived point records at all six sites, with 540 months and 45 complete annual values in the verified series. Annual temperatures weight monthly means by calendar days. Annual corrected precipitation depth sums the monthly mean daily rates multiplied by the days in each month. |
| GPM IMERG precipitation | NASA POWER daily UTC satellite precipitation estimates, 2001–2025 at all six sites. Complete daily depths are summed into monthly and annual totals in mm. NASA documents a 0.1° grid. The response identifies IMERG but omits the exact algorithm version, run and sampled cell centre. |
| SMAP Level-4 soil moisture | Surface and root-zone volumetric soil moisture estimates from NASA POWER's high-resolution daily UTC Zarr archive. At all six sites the record spans parts of 2015–2025, with nine complete years, 2016–2024. Complete-period means are descriptive. A partial first month and a missing day in 2025 exclude those incomplete periods. POWER regrids the approximately 9 km upstream product to about 0.09°. |
| Native Bahrain MERRA-2 | Direct NASA GES DISC M2TMNXSLV v5.12.4 granules for February and March 2025. One native cell yielded 17.93 °C and 20.74 °C for monthly 2 m air temperature, rounded after conversion from kelvin. The footprint uses adjacent-coordinate midpoints. Its scale and two-month coverage preclude local detail and trend inference. The archive's TemporalRange ends in 2016 despite the two verified 2025 granules. |

## Findings and methods

- **Field Desk demonstration.** For Bahrain, annual mean 2 m air temperature increased by about 0.425 °C per decade over 1981–2025 and met the six-site adjusted significance threshold. The same site's POWER precipitation estimate had a slope of approximately −6.68 mm per decade and did not meet that threshold. The point estimate alone cannot substantiate a decline.
- **Original Bahrain study.** The three outcomes in its Holm family were mean air temperature, mean daily minimum air temperature and estimated annual precipitation depth. The two temperature trends, approximately +0.425 and +0.410 °C per decade, met the adjusted threshold. Precipitation did not. The Field Desk applies Holm across eligible sites for the selected variable and period, so its p-values belong to a different family. [Original Bahrain analysis](ANALYSIS_RESULTS.md)
- **Statistical safeguards.** The Field Desk tests contiguous annual series with at least 20 complete years. It reports Sen's slope, Hamed–Rao modified Mann–Kendall, Holm adjustment at α = 0.05 and an approximate marginal 95% moving-block bootstrap slope interval. Field Desk intervals use 1,999 replicates. The original Bahrain analysis used 9,999 and documented block-length sensitivity for Bahrain precipitation. Monthly charts display descriptive values. Any accompanying trend evidence still uses complete annual values. A marginal interval and a Holm-adjusted significance decision can disagree.
- **Interpretation.** Grid estimates represent an area and cannot isolate reclaimed land, provide a country's average, or establish causation. POWER meteorology and the native pilot share MERRA-2 ancestry. Comparing them checks cross-service consistency. Independent ground-station validation has not been demonstrated.

## Technology and attribution

Next.js, React, TypeScript, Three.js, MapLibre GL JS and Recharts support the interactive experience. The application serves archived data and reproducible extractions without live NASA requests from the Field Desk.

OpenAI Codex assisted development, verification and writing. OpenAI image generation was used for an earlier orbital concept. The current Orbita scene assets are illustrative artwork from the approved Figma design. The separately credited interactive Blue Marble globe provides geographic imagery. Scientific values and statistics come from archived NASA products and reproducible code. [Full citations and disclosures](SUBMISSION_REFERENCES.md)

Use separate, anonymously accessible links for the final project and the short demo. Confirm the challenge's accepted resource pathway and any local requirements with the organizer before making an eligibility claim. [Competition guidance](https://github.com/nasa/spaceapps/discussions/1827)
