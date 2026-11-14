# GulfScope | Earth system trends in the Arabian Gulf

**Challenge** Be An Earth System Trend Detective!

**Public app** [Insert verified production URL]

**Summary** GulfScope turns 45 years of NASA POWER meteorology into an interactive investigation of temperature and precipitation in Bahrain, with Riyadh and Muscat as regional context. Users can inspect annual values, trends, uncertainty, and the NASA sources behind each result.

## Problem and solution

One hot year or a short spell of low rainfall is hard to interpret. GulfScope gives students, educators, and residents a way to explore longer records and judge how much evidence supports a trend. The investigation defaults to Bahrain and provides a map, interactive chart, accessible data table, statistical evidence, and a provenance panel for each site.

## NASA data and findings

NASA POWER provides MERRA-2 gridded reanalysis. For 1981–2025 we use monthly mean air temperature at 2 m, mean daily minimum air temperature, and corrected precipitation rates. Annual temperatures weight each month by calendar days. Annual precipitation sums estimated depths from the daily rates and each month's length.

In the Bahrain grid series, annual mean air temperature increased by about **0.425°C per decade** and annual mean daily minimum temperature by **0.410°C per decade**. Both temperature trends met the adjusted significance threshold. Estimated precipitation had a negative slope of **6.68 mm per decade** in magnitude. No statistically significant monotonic precipitation trend was detected. [Full results and intervals](ANALYSIS_RESULTS.md)

Sen's slope estimates trend magnitude. Hamed–Rao modified Mann–Kendall accounts for screened serial dependence. Holm adjustment controls the three comparisons within each site. A moving-block bootstrap estimates the 95% slope interval. The precipitation interval is sensitive to block length. The 0.5° × 0.625° grid cannot resolve individual reclaimed areas or attribute observed trends to causes.

Giovanni is listed in the official challenge resources. GulfScope has verified its candidate MERRA-2 product identity. Direct use of its export and Global Awards resource eligibility are pending. [Compliance record](CHALLENGE_RESOURCE_COMPLIANCE.md)

## Technology and disclosure

Next.js, React, TypeScript, Tailwind CSS, Motion, Recharts, and MapLibre GL power the app. Build-time validation connects the displayed values to archived NASA responses and checksums. The app serves these pinned data without calling NASA at runtime.

OpenAI Codex assisted with development, verification workflows, and documentation. OpenAI image generation created the illustrative orbital hero. The illustration is labeled in the app. Scientific values and tests come from the validated NASA data and reproducible code. [References](SUBMISSION_REFERENCES.md)
