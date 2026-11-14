# GulfScope analysis method

## Snapshot and aggregation

Use the pinned Mission 001 monthly NASA POWER response at 26.07° N, 50.55° E in local solar time. The builder verifies the saved response against the original SHA-256 and metadata, then checks units, dates, completeness, finite values, the fill sentinel and basic physical consistency. It rejects an incomplete series. The manifest links provenance, counts and output hashes. The 45 NASA annual summary keys per variable are outside the monthly input set.

Each monthly row preserves the three API values and their original units. Estimated monthly precipitation depth is `PRECTOTCORR × calendar days` in mm. Annual estimated depth sums the twelve monthly depths. Annual mean air temperature is the sum of monthly `T2M × calendar days` divided by the calendar year length. Gregorian leap days contribute to both calculations. Annual rows record valid monthly counts and completeness. Reported values inherit rounding and uncertainty from the API rates and temperatures.

### Minimum temperature definition

The original snapshot's February 2025 `T2M_MIN` is 13.42°C. A Mission 002 metadata check used the corresponding February 2025 daily series at the same coordinates, AG community and local solar time. Across 28 daily minima, the lowest value was 13.42°C and their mean was 16.340357°C. The check used the daily response solely to resolve the parameter definition. The processed data and statistics use only the original monthly snapshot. NASA's processing documentation distinguishes the extreme series from averages of daily extremes. [NASA daily definition check](https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MIN&community=AG&longitude=50.55&latitude=26.07&start=20250201&end=20250228&format=JSON&time-standard=LST) · [NASA temporal processing](https://power.larc.nasa.gov/docs/methodology/data/processing/)

Mission 002.1 adds the monthly T2M_MIN_AVG snapshot. The pipeline verifies its February 2025 value of 16.34 degrees C against 16.340357 degrees C derived from the archived daily comparison, with a tolerance of 0.005 degrees C. It day-weights the monthly averages to compute mean_daily_min_t2m_c. The annual mean of monthly extremes remains a separate descriptive field. The daily sample serves only as a validation check.

## Trend and significance

- Sen's slope is the median of all pairwise value differences divided by elapsed years. Direction follows its sign. Multiply by 10 for the per-decade slope. [Sen (1968)](https://doi.org/10.1080/01621459.1968.10480934)
- Ordinary Mann–Kendall sums the signs of all pairwise differences. Equal values contribute zero and their groups reduce the null variance. Report the continuity-corrected two-sided normal p-value for comparison.
- The Hamed–Rao assessment subtracts the Sen trend and calculates the sample ACF of mean ranks, with tied residuals receiving average ranks. Report lag-one ACF for the input series and the full detrended rank ACF. Include lags `k = 1…n−3` whose absolute rank ACF exceeds `1.959964 / sqrt(n)`. The ordinary variance is multiplied by `1 + 2 Σ[(n−k)(n−k−1)(n−k−2) × ACF(k)] / [n(n−1)(n−2)]`. The signed correction matches the published R reference implementation. A nonpositive factor leaves modified significance unavailable. The lag screen is approximate and does not establish independence. An exactly constant residual series has undefined ACF and no selected lags. [Hamed and Rao (1998)](https://doi.org/10.1016/S0022-1694(97)00125-X) · [modifiedmk reference implementation](https://raw.githubusercontent.com/cran/modifiedmk/master/R/mmkh.R)
- Apply Holm–Bonferroni at familywise α = 0.05 to the Hamed–Rao p-values. Use all three computed p-values. Mission 002 assigned p = 1 internally for the unavailable test. The new observed p-value ranks second and precipitation ranks third. [Holm (1979)](https://www.jstor.org/stable/4615733)

## Confidence intervals

Use a basic moving-block residual bootstrap. Detrend by the Sen slope. Resample overlapping, consecutive blocks of residuals with replacement, concatenate up to the original length and compute Sen's slope on each resampled sequence. These slopes estimate the error about the fitted slope. Reflect their interpolated 2.5th and 97.5th percentiles around the fitted slope. Use 9,999 replicates and a fixed seed of 20261114. Block length is the rounded cube root of the sample size with a minimum of two, giving four years here. The intervals are marginal, approximate 95% intervals. Holm inference comes from the modified test. [Künsch (1989)](https://doi.org/10.1214/aos/1176347265)

The bootstrap assumes an additive trend with approximately stationary, short-memory residuals. Four-year blocks preserve local dependence within blocks, but cannot preserve lag-nine dependence within a block. The precipitation series triggers that rank screen, so the results also report sensitivity at block lengths of three, six and ten years. Forty-five years limit the precision of the ACF and the asymptotic significance calculation. Annual aggregation removes the need to compare different calendar months within the test, while obscuring season-specific changes.

## Reproduction and checks

```powershell
node scripts/build-analysis-dataset.mjs
node scripts/trend-analysis.mjs
node --test
```

The trend command uses the same in-memory annual rows as the CSV builder. The tied autocorrelated fixture was checked against a separate Python standard-library calculation of the Sen median, tie correction, signed rank ACF correction, normal tail via `math.erfc` and bootstrap quantiles. Tests also cover exact slopes, the degenerate interval for a constant series, and Holm adjustment.
