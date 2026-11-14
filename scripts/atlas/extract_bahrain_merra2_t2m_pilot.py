"""Reproduce the Bahrain two-month pilot using an external netCDF4 environment."""
import argparse
import calendar
import hashlib
import json
from pathlib import Path

import netCDF4
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
HASHES = {
    "202502": "a5cb2ee3c01ccf016da92e2a029524f8e6bfb5855ec31c04cea07ebf50d2010a",
    "202503": "1bddb2659bb1431a17f2047b89e7bd9d5c975eb09905dab2d21184530a98452e",
}
EXPECTED_K = (291.07904052734375, 293.8893737792969)
POWER_FILE = "data/raw/nasa-power-bahrain-2026-11-14T12-43-27.267Z.json"
DOI = "10.5067/AP1B0BA5PD2K"
REFERENCE = (50.55, 26.07)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def axis_cell(axis, coord, spacing):
    require(np.allclose(np.diff(axis), spacing, atol=1e-10, rtol=0), "Unexpected grid spacing/order")
    midpoints = (axis[1:] + axis[:-1]) / 2
    hits = np.flatnonzero((midpoints[:-1] <= coord) & (coord < midpoints[1:])) + 1
    require(len(hits) == 1 and hits[0] == np.argmin(abs(axis - coord)), "Cell selection disagrees")
    i = int(hits[0])
    return i, float(axis[i]), float(midpoints[i - 1]), float(midpoints[i])


def extract(incoming):
    power_path = ROOT / POWER_FILE
    power = json.loads(power_path.read_text(encoding="utf-8"))
    power_metadata = json.loads(power_path.with_suffix(".metadata.json").read_text(encoding="utf-8-sig"))
    require(digest(power_path) == power_metadata["sha256"], "POWER checksum mismatch")
    require(power["header"]["time_standard"] == "LST" and
            power["geometry"]["coordinates"][:2] == list(REFERENCE) and
            power["parameters"]["T2M"]["units"] == "C", "Unexpected POWER metadata")
    observations, points = [], []
    axes = None
    for (key, expected_hash), expected_kelvin in zip(HASHES.items(), EXPECTED_K):
        path = incoming / f"MERRA2_400.tavgM_2d_slv_Nx.{key}.nc4"
        require(digest(path) == expected_hash, f"Unexpected SHA-256: {path.name}")
        year, month = int(key[:4]), int(key[4:])
        period = f"{year}-{month:02}"
        with netCDF4.Dataset(path, "r") as dataset:
            dataset.set_auto_maskandscale(False)
            require((dataset.ShortName, dataset.VersionID, dataset.identifier_product_doi,
                     dataset.GranuleID, dataset.data_model) ==
                    ("M2TMNXSLV", "5.12.4", DOI, path.name, "NETCDF4_CLASSIC"), "Product mismatch")
            lat, lon, time, variable = (dataset[name] for name in ("lat", "lon", "time", "T2M"))
            require((lat.units, lon.units) == ("degrees_north", "degrees_east") and
                    not any("bounds" in item.ncattrs() for item in (lat, lon, time)), "Unexpected axes metadata")
            require(variable.dimensions == ("time", "lat", "lon") and variable.shape == (1, 361, 576)
                    and variable.dtype == np.dtype("float32") and variable.units == "K"
                    and variable.long_name == "2-meter_air_temperature"
                    and not {"scale_factor", "add_offset"}.intersection(variable.ncattrs()), "Unexpected T2M encoding")
            latitudes, longitudes = lat[:], lon[:]
            if axes is None:
                axes = (latitudes, longitudes)
            require(np.array_equal(latitudes, axes[0]) and np.array_equal(longitudes, axes[1]), "Grid changed")
            require((latitudes[0], latitudes[-1], longitudes[0], longitudes[-1]) ==
                    (-90, 90, -180, 179.375), "Unexpected global grid endpoints")
            i, y, south, north = axis_cell(latitudes, REFERENCE[1], 0.5)
            j, x, west, east = axis_cell(longitudes, REFERENCE[0], 0.625)
            require((i, j, y, x, west, south, east, north) ==
                    (232, 369, 26.0, 50.625, 50.3125, 25.75, 50.9375, 26.25), "Unexpected native cell")
            require(west < REFERENCE[0] < east and south < REFERENCE[1] < north, "Reference outside cell")
            require(time[:].tolist() == [0] and time.units == f"minutes since {period}-01 00:30:00"
                    and "calendar" not in time.ncattrs(), "Unexpected time coordinate")
            start, end = dataset.RangeBeginningDate, dataset.RangeEndingDate
            require((start, end, dataset.RangeBeginningTime, dataset.RangeEndingTime) ==
                    (f"{period}-01", f"{period}-{calendar.monthrange(year, month)[1]}",
                     "00:00:00.000000", "23:59:59.000000"), "Unexpected granule period")
            kelvin = float(variable[0, i, j])
            require(np.isfinite(kelvin) and 180 < kelvin < 340 and
                    all(kelvin != float(variable.getncattr(name)) for name in
                        ("_FillValue", "missing_value", "fmissing_value"))
                    and kelvin == expected_kelvin, "Unexpected or missing T2M value")
            celsius = kelvin - 273.15
            observations.append(dict(month=period, kelvin=kelvin, celsius=celsius,
                                     granule=path.name, sha256=expected_hash, bytes=path.stat().st_size,
                                     time=dict(value=int(time[0]), units=time.units, start=start, end=end,
                                               temporalRange=dataset.TemporalRange)))
            point = power["properties"]["parameter"]["T2M"][key]
            require(np.isfinite(point) and point != power["header"]["fill_value"], "Missing POWER value")
            points.append(dict(month=period, celsius=point, nativeMinusPointCelsius=celsius-point))
        require(digest(path) == expected_hash, f"Source changed: {path.name}")
    return {
        "schemaVersion": 1,
        "source": dict(provider="NASA GMAO", product="MERRA-2", collection="M2TMNXSLV",
                       version="5.12.4", doi=DOI, cmrCollection="C1276812859-GES_DISC"),
        "variable": dict(id="T2M", name="Monthly mean 2-m air temperature", dtype="float32",
                         sourceUnit="K", displayUnit="°C", conversion="°C = K − 273.15"),
        "grid": dict(dimensions=[1, 361, 576], dimensionOrder=["time", "lat", "lon"],
                     spacingDegrees=[0.625, 0.5], longitudeConvention="−180° to 179.375° E, ascending"),
        "cell": dict(center=[x, y], indices=dict(latitude=i, longitude=j),
                     bounds=[west, south, east, north], reference=list(REFERENCE), containsReference=True,
                     footprintMethod="Midpoints to adjacent stored coordinate centres; no source bounds supplied."),
        "observations": observations,
        "power": dict(source="NASA POWER requested point", archive=POWER_FILE, timeStandard="LST",
                      sha256=power_metadata["sha256"], observations=points),
        "caveats": [
            "No explicit calendar or time bounds. Granule filenames and granule-level dates identify the monthly periods.",
            "The separate TemporalRange attribute ends in 2016 and conflicts with the 2025 granule dates.",
            "No Giovanni comparison has been performed.",
        ],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("incoming", type=Path)
    args = parser.parse_args()
    artifact = extract(args.incoming)
    (ROOT / "data/atlas/bahrain/merra2-t2m-pilot.json").write_bytes(
        (json.dumps(artifact, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
