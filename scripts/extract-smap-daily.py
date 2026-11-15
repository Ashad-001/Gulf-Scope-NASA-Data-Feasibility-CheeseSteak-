"""Extract NASA POWER SMAP point series. Requires NumPy and numcodecs, only for raw extraction."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
from hashlib import sha256
import json
from pathlib import Path
from urllib.request import urlopen

import numpy as np
from numcodecs import get_codec

ROOT = Path(__file__).resolve().parents[1] / "data" / "raw" / "power-smap-zarr"
BASE = "https://nasa-power-smap.s3.amazonaws.com/smap/temporal/power_smap_daily_temporal_utc.zarr/"
SITES = {
    "bahrain": (26.07, 50.55), "riyadh": (24.71, 46.68), "muscat": (23.59, 58.41),
    "kuwait-city": (29.37, 47.97), "doha": (25.29, 51.53), "abu-dhabi": (24.45, 54.40),
}
CODES = ("SFMC", "RZMC")
START, END = date(2015, 3, 31), date(2025, 12, 31)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true", help="Fetch absent NASA objects; existing bytes are never overwritten")
    args = parser.parse_args()
    objects = {}

    def load(key):
        path = ROOT / key.replace("/", "--")
        if not path.exists() and args.download:
            with urlopen(BASE + key, timeout=45) as response:
                raw = response.read()
            with path.open("xb") as stream:
                stream.write(raw)
        data = path.read_bytes()
        objects[key] = {"file": path.name, "sha256": sha256(data).hexdigest(), "bytes": len(data)}
        return data

    def decode(key, data):
        spec = metadata[key.split("/")[0] + "/.zarray"]
        values = np.frombuffer(get_codec(spec["compressor"]).decode(data), dtype=spec["dtype"])
        return values.reshape(spec["chunks"])

    ROOT.mkdir(parents=True, exist_ok=True)
    metadata = json.loads(load(".zmetadata"))["metadata"]
    attrs = metadata[".zattrs"]
    assert attrs["id"] == "power_smap_daily_temporal_utc.zarr" and attrs["processing_level"] == "4"
    assert attrs["time_standard"].endswith("(UTC)")
    assert metadata["time/.zattrs"]["units"] == "days since 2015-03-31 00:00:00"
    assert metadata["time/.zattrs"]["calendar"] == "proleptic_gregorian"
    lat, lon, time = [decode(axis + "/0", load(axis + "/0")) for axis in ("lat", "lon", "time")]
    assert np.all(np.diff(lat) > 0) or np.all(np.diff(lat) < 0)
    assert np.all(np.diff(lon) > 0)
    count = (END - START).days + 1
    assert np.array_equal(time[:count], np.arange(count))
    sites = {}
    dates = [(START + timedelta(days=i)).strftime("%Y%m%d") for i in range(count)]
    requests = {}

    for site, (y, x) in SITES.items():
        yi, xi = int(np.argmin(np.abs(lat - y))), int(np.argmin(np.abs(lon - x)))
        sites[site] = {"requested": [y, x], "centre": [float(lat[yi]), float(lon[xi])],
                       "indices": [yi, xi], "sources": {}, "values": {}}
        for code in CODES:
            spec = metadata[code + "/.zarray"]
            field = metadata[code + "/.zattrs"]
            assert field["_ARRAY_DIMENSIONS"] == ["time", "lat", "lon"] and field["units"] == "m3 m-3"
            assert spec["fill_value"] == "NaN"
            t, h, w = spec["chunks"]
            keys = [f"{code}/{i}.{yi // h}.{xi // w}" for i in range((count + t - 1) // t)]
            sites[site]["sources"][code] = keys
            for key in keys:
                requests.setdefault(key, []).append((site, code, yi % h, xi % w))

    # Each compressed object is decoded once, even if two sites share a tile.
    def extract(key):
        packed = decode(key, load(key))
        spec = metadata[key.split("/")[0] + "/.zarray"]
        (scale,) = spec["filters"]
        assert scale["id"] == "fixedscaleoffset" and scale["scale"] == 100 and scale["offset"] == 1000
        result = []
        for site, code, y, x in requests[key]:
            values = packed[:, y, x].astype("float64")
            good = ~np.isnan(values)
            decoded = np.full(values.shape, np.nan)
            decoded[good] = values[good] / scale["scale"] + scale["offset"]
            # Round only to undo binary cancellation in the archive's exact hundredths packing.
            decoded[good] = np.round(decoded[good], 2)
            assert np.all((decoded[good] >= 0) & (decoded[good] <= 0.9)), (site, key, decoded[good].min(), decoded[good].max())
            result.append((site, code, key, decoded.tolist()))
        return result

    chunks = {}
    with ThreadPoolExecutor(max_workers=6) as workers:
        for group in workers.map(extract, requests):
            for site, code, key, data in group:
                chunks[site, code, key] = data
    for site, record in sites.items():
        for code in CODES:
            values = [value for key in record["sources"][code] for value in chunks[site, code, key]][:count]
            record["values"][code] = {day: float(value) if np.isfinite(value) else None for day, value in zip(dates, values)}
            print(site, code, "valid", int(np.isfinite(values).sum()), "/", count, "centre", record["centre"])
    output = {"schemaVersion": 1, "archive": BASE, "product": attrs["id"], "version": attrs["version"],
              "start": dates[0], "end": dates[-1], "units": "m3 m-3", "objects": dict(sorted(objects.items())),
              "sites": sites}
    path = ROOT / "point-extraction.json"
    encoded = (json.dumps(output, separators=(",", ":"), allow_nan=False) + "\n").encode()
    if path.exists():
        assert path.read_bytes() == encoded, "Existing extraction differs; review and version it explicitly"
    else:
        with path.open("xb") as stream:
            stream.write(encoded)


if __name__ == "__main__":
    main()
