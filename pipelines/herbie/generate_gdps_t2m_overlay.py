#!/usr/bin/env python3
"""
Deterministic Herbie pipeline for GDPS 2-metre temperature overlays.

This script generates:
  - frontend/public/herbie/gdps_t2m_latest.png
  - frontend/public/herbie/gdps_t2m_latest.json

It intentionally fails on missing/ambiguous inputs instead of guessing.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import xarray as xr
from herbie import Herbie
from matplotlib.colors import BoundaryNorm, ListedColormap


LOGGER = logging.getLogger("herbie-gdps-t2m")


@dataclass(frozen=True)
class PipelineConfig:
    model: str = "gdps"
    product: str = "15km/grib2/lat_lon"
    variable: str = "TMP"
    level: str = "TGL_2"
    fxx: int = 0
    bounds_west: float = -175.0
    bounds_south: float = 10.0
    bounds_east: float = -15.0
    bounds_north: float = 85.0
    figure_width_px: int = 1400
    figure_height_px: int = 900
    figure_dpi: int = 100
    cycle_interval_hours: int = 12
    max_cycle_attempts: int = 8


CONFIG = PipelineConfig()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate GDPS T2M overlay using Herbie.")
    parser.add_argument(
        "--run-utc",
        type=str,
        default=None,
        help="Explicit model cycle time in UTC (ISO-8601), e.g. 2026-03-31T00:00:00Z",
    )
    parser.add_argument(
        "--output-png",
        type=Path,
        default=Path("frontend/public/herbie/gdps_t2m_latest.png"),
        help="Output PNG path.",
    )
    parser.add_argument(
        "--output-json",
        type=Path,
        default=Path("frontend/public/herbie/gdps_t2m_latest.json"),
        help="Output metadata JSON path.",
    )
    parser.add_argument(
        "--save-dir",
        type=Path,
        default=Path(".cache/herbie"),
        help="Herbie cache/download directory.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging.",
    )
    return parser.parse_args()


def parse_explicit_cycle(run_utc: str) -> datetime:
    normalized = run_utc.strip().replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        raise ValueError("run-utc must include timezone information (UTC expected).")
    return dt.astimezone(timezone.utc).replace(minute=0, second=0, microsecond=0)


def candidate_cycles(now_utc: datetime, interval_hours: int, attempts: int) -> Iterable[datetime]:
    base = pd.Timestamp(now_utc).floor(f"{interval_hours}h").to_pydatetime()
    for index in range(attempts):
        yield (base - timedelta(hours=interval_hours * index)).replace(tzinfo=timezone.utc)


def find_available_dataset(explicit_cycle: datetime | None, save_dir: Path) -> tuple[xr.Dataset, datetime]:
    if explicit_cycle is not None:
        cycles = [explicit_cycle]
    else:
        cycles = list(candidate_cycles(datetime.now(timezone.utc), CONFIG.cycle_interval_hours, CONFIG.max_cycle_attempts))

    last_error: Exception | None = None
    for cycle in cycles:
        try:
            LOGGER.info("Trying GDPS cycle %s", cycle.isoformat())
            herbie = Herbie(
                cycle,
                model=CONFIG.model,
                product=CONFIG.product,
                fxx=CONFIG.fxx,
                variable=CONFIG.variable,
                level=CONFIG.level,
                save_dir=save_dir,
                overwrite=False,
            )
            if not herbie.grib:
                raise RuntimeError("Herbie did not resolve a GDPS file URL for this cycle.")
            dataset = herbie.xarray()
            if not isinstance(dataset, xr.Dataset):
                raise RuntimeError("Herbie returned a non-dataset response.")
            return dataset, cycle
        except Exception as exc:  # noqa: BLE001
            LOGGER.warning("Cycle %s unavailable: %s", cycle.isoformat(), exc)
            last_error = exc

    raise RuntimeError(f"No GDPS cycle could be retrieved from Herbie. Last error: {last_error}")


def extract_temperature_field(dataset: xr.Dataset) -> xr.DataArray:
    if "t2m" in dataset.data_vars:
        field = dataset["t2m"]
    else:
        candidates = [
            name
            for name, var in dataset.data_vars.items()
            if set(var.dims) >= {"latitude", "longitude"} and np.issubdtype(var.dtype, np.number)
        ]
        if len(candidates) != 1:
            raise RuntimeError(
                f"Expected one 2D temperature field, found {len(candidates)} candidates: {candidates}"
            )
        field = dataset[candidates[0]]

    units = str(field.attrs.get("GRIB_units") or field.attrs.get("units") or "").strip().upper()
    if units not in {"K", "KELVIN"}:
        raise RuntimeError(f"Unexpected temperature units '{units}'. Expected Kelvin.")

    return field - 273.15


def normalize_and_crop(field_c: xr.DataArray) -> xr.DataArray:
    if "longitude" not in field_c.coords or "latitude" not in field_c.coords:
        raise RuntimeError("Dataset is missing latitude/longitude coordinates.")

    lon = field_c["longitude"]
    if float(lon.max()) > 180:
        field_c = field_c.assign_coords(longitude=((lon + 180) % 360) - 180)
        field_c = field_c.sortby("longitude")

    lat_values = field_c["latitude"].values
    if lat_values[0] > lat_values[-1]:
        lat_slice = slice(CONFIG.bounds_north, CONFIG.bounds_south)
    else:
        lat_slice = slice(CONFIG.bounds_south, CONFIG.bounds_north)

    cropped = field_c.sel(
        longitude=slice(CONFIG.bounds_west, CONFIG.bounds_east),
        latitude=lat_slice,
    )

    if cropped.size == 0:
        raise RuntimeError("Cropped temperature field is empty.")
    if np.isnan(cropped.values).all():
        raise RuntimeError("Cropped temperature field contains only NaN values.")

    return cropped


def render_overlay_png(field_c: xr.DataArray, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    bounds = np.array([-50, -40, -30, -20, -10, -5, 0, 5, 10, 15, 20, 25, 30, 35, 40, 50], dtype=float)
    colors = [
        "#2d004b",
        "#542788",
        "#8073ac",
        "#b2abd2",
        "#d8daeb",
        "#f7f7f7",
        "#fee0b6",
        "#fdb863",
        "#f08a4b",
        "#e66101",
        "#ca4f0e",
        "#b35806",
        "#7f3b08",
        "#5c2d04",
        "#3d2002",
    ]
    cmap = ListedColormap(colors)
    norm = BoundaryNorm(bounds, cmap.N, clip=True)

    fig = plt.figure(
        figsize=(CONFIG.figure_width_px / CONFIG.figure_dpi, CONFIG.figure_height_px / CONFIG.figure_dpi),
        dpi=CONFIG.figure_dpi,
    )
    ax = fig.add_axes([0, 0, 1, 1])
    fig.patch.set_alpha(0.0)
    ax.set_facecolor((0, 0, 0, 0))
    ax.set_axis_off()
    ax.set_xlim(CONFIG.bounds_west, CONFIG.bounds_east)
    ax.set_ylim(CONFIG.bounds_south, CONFIG.bounds_north)
    ax.pcolormesh(
        field_c["longitude"].values,
        field_c["latitude"].values,
        field_c.values,
        shading="auto",
        cmap=cmap,
        norm=norm,
        alpha=0.78,
    )
    fig.savefig(output_path, dpi=CONFIG.figure_dpi, transparent=True)
    plt.close(fig)


def infer_valid_time_iso(dataset: xr.Dataset) -> str | None:
    for key in ("valid_time", "time"):
        if key in dataset.coords:
            value = dataset.coords[key].values
            try:
                return pd.to_datetime(value).tz_localize("UTC").isoformat().replace("+00:00", "Z")
            except TypeError:
                return pd.to_datetime(value).tz_convert("UTC").isoformat().replace("+00:00", "Z")
    return None


def write_metadata(dataset: xr.Dataset, cycle: datetime, field_c: xr.DataArray, output_json: Path, output_png: Path) -> None:
    output_json.parent.mkdir(parents=True, exist_ok=True)
    png_bytes = output_png.read_bytes()
    png_sha256 = hashlib.sha256(png_bytes).hexdigest()

    metadata = {
        "pipeline": "herbie-gdps-t2m",
        "status": "ready",
        "generated_at_utc": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "model": CONFIG.model,
        "product": CONFIG.product,
        "variable": CONFIG.variable,
        "level": CONFIG.level,
        "run_utc": cycle.isoformat().replace("+00:00", "Z"),
        "fxx": CONFIG.fxx,
        "valid_time_utc": infer_valid_time_iso(dataset),
        "bbox": [CONFIG.bounds_west, CONFIG.bounds_south, CONFIG.bounds_east, CONFIG.bounds_north],
        "grid_shape": [int(field_c.sizes["latitude"]), int(field_c.sizes["longitude"])],
        "stats_celsius": {
            "min": float(np.nanmin(field_c.values)),
            "max": float(np.nanmax(field_c.values)),
            "mean": float(np.nanmean(field_c.values)),
            "p95": float(np.nanpercentile(field_c.values, 95)),
        },
        "artifact": {
            "png_path": str(output_png),
            "png_sha256": png_sha256,
        },
    }
    output_json.write_text(json.dumps(metadata, indent=2), encoding="utf-8")


def main() -> int:
    args = parse_args()
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )

    explicit_cycle = parse_explicit_cycle(args.run_utc) if args.run_utc else None
    args.save_dir.mkdir(parents=True, exist_ok=True)

    LOGGER.info("Starting Herbie GDPS pipeline.")
    dataset, resolved_cycle = find_available_dataset(explicit_cycle, args.save_dir)
    field_c = extract_temperature_field(dataset)
    cropped = normalize_and_crop(field_c)
    render_overlay_png(cropped, args.output_png)
    write_metadata(dataset, resolved_cycle, cropped, args.output_json, args.output_png)
    LOGGER.info("Herbie pipeline completed: %s", args.output_png)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
