# Herbie Integration Pipeline (GDPS 2m Temperature)

This repository now includes a deterministic Python pipeline that integrates [Herbie](https://github.com/blaylockbk/Herbie) to generate a georeferenced GDPS temperature overlay used by the web app.

## Why this pipeline exists
- It provides a fully documented and reproducible data path for model guidance.
- It avoids runtime guessing by locking model/product/variable/level explicitly:
  - `model=gdps`
  - `product=15km/grib2/lat_lon`
  - `variable=TMP`
  - `level=TGL_2`
  - `fxx=0`

## Outputs
The script writes:
- `frontend/public/herbie/gdps_t2m_latest.png`
- `frontend/public/herbie/gdps_t2m_latest.json`

These files are consumed by:
- `GET /api/herbie/gdps-t2m`
- `GET /api/herbie/status`

## Install
```bash
python -m venv .venv-herbie
. .venv-herbie/Scripts/activate
pip install -r pipelines/herbie/requirements.txt
```

## Run
```bash
python pipelines/herbie/generate_gdps_t2m_overlay.py --verbose
```

Optional explicit cycle:
```bash
python pipelines/herbie/generate_gdps_t2m_overlay.py --run-utc 2026-03-31T00:00:00Z
```

## Deterministic guarantees
- The script fails if it cannot resolve a GDPS cycle from Herbie.
- The script fails if temperature units are not Kelvin.
- The script fails if latitude/longitude coordinates are missing.
- The script fails if crop bounds produce empty or all-NaN output.
- Metadata includes SHA-256 of the generated PNG for traceability.

## Output metadata contract
`gdps_t2m_latest.json` includes:
- pipeline identity/version fields
- generation timestamp (`generated_at_utc`)
- resolved model cycle (`run_utc`)
- forecast lead (`fxx`)
- variable metadata (`model/product/variable/level`)
- map domain bbox
- numeric stats (`min/max/mean/p95` in Celsius)
- artifact integrity hash (`png_sha256`)

## Integration expectations
1. Run the script from the repository root.
2. Commit updated artifacts when they change.
3. Deploy so the web app serves the latest generated layer.
4. Validate:
   - `/api/herbie/status` returns `status=ready`
   - `/api/herbie/gdps-t2m` returns a PNG image

## Troubleshooting
- **`No GDPS cycle could be retrieved`**
  - confirm network access to ECCC and Herbie sources
  - retry with `--run-utc` for a known historical cycle
- **`Unexpected temperature units`**
  - check upstream product/variable selection, do not override defaults blindly
- **`ModuleNotFoundError` for `eccodes`/`cfgrib`**
  - ensure `pipelines/herbie/requirements.txt` installed in the active environment
- **Overlay visible but stale**
  - inspect `generated_at_utc` in JSON and compare with deployment timestamp

## References
- Herbie GDPS gallery (model/product/variable guidance):  
  https://herbie.readthedocs.io/en/2025.12.0/gallery/eccc_models/gdps.html
- ECCC GDPS product description:  
  https://eccc-msc.github.io/open-data/msc-data/nwp_gdps/readme_gdps_en/
- Herbie repository:  
  https://github.com/blaylockbk/Herbie
