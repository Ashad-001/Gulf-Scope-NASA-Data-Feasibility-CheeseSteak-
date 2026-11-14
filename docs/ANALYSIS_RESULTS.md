# GulfScope annual trend results

NASA POWER supplied 540 complete months for each input and 45 complete calendar years (1981–2025). The [Mission 002 results](ANALYSIS_RESULTS_MISSION_002.md) preserve the analysis before the third series was available.

| Annual variable | Sen slope per year | Per decade | Approximate 95% block CI per decade | Ordinary MK p | Hamed–Rao p | Holm p |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Mean air temperature at 2 m | +0.04248 °C | +0.4248 °C | [0.3125, 0.5344] °C | 2.56e-9 | 2.56e-9 | 7.69e-9 |
| Mean daily minimum air temperature at 2 m | +0.04099 °C | +0.4099 °C | [0.2996, 0.5191] °C | 2.89e-9 | 2.89e-9 | 7.69e-9 |
| Estimated corrected precipitation accumulation | −0.6678 mm | −6.678 mm | [−13.089, 0.171] mm | 0.08691 | 0.13631 | 0.13631 |

Both temperature series show statistically significant increasing monotonic trends at familywise α = 0.05. No statistically significant monotonic precipitation trend was detected under the specified test and threshold. Precipitation ranks third in the completed Holm family, so its multiplier is one. Previously it ranked second because the unavailable test was internally assigned p = 1.

| Annual variable | Raw lag-one ACF | Detrended rank lag-one ACF | Hamed–Rao selected lags | Variance factor |
| --- | ---: | ---: | --- | ---: |
| Mean air temperature | 0.7143 | 0.1420 | None | 1.0000 |
| Mean daily minimum air temperature | 0.7180 | 0.1665 | None | 1.0000 |
| Estimated precipitation | 0.2234 | 0.0611 | 9 | 1.3206 |

The rank lag screen used ±0.2922. The four-year-block precipitation confidence interval includes zero. See the historical report for block-length sensitivity on this unchanged precipitation series. These results characterize the sampled MERRA-2 grid estimate. They cannot resolve individual reclaimed areas or establish causation.

See [Analysis method](ANALYSIS_METHOD.md) for reproduction commands.
