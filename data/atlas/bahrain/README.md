# Bahrain native MERRA-2 T2M pilot

With the existing external Python environment containing netCDF4, run from the repository root:

```powershell
& "$env:TEMP/gulfscope-netcdf-reader/Scripts/python.exe" scripts/atlas/extract_bahrain_merra2_t2m_pilot.py data/atlas/bahrain/incoming
```

The extractor reads the two original NetCDF-4 files in read-only mode, checks their pinned hashes before and after extraction, and writes the deterministic JSON used by the app. The original granules stay local. The app does not need Python or NetCDF at runtime.

Open /investigate?mode=native-cell. The map uses the existing OpenStreetMap raster source for geographic context. Its polygon shows one derived native grid footprint. The month selector changes the temperature and selected source evidence, not the footprint. Archived POWER values are contextual comparisons. The two months do not establish a trend, national average or island-level temperature.
