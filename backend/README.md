# Backend (Flask) — PythonAnywhere

This backend provides a small JSON + CSV API for the Flux dashboard.

## Endpoints

- `GET /api/health`
- `GET /api/regions`
- `GET /api/consolidation`
- `POST /api/consolidation` `{ rows: [...] }`  (saves to CSV on server)
- `GET /api/consolidation.csv` (download CSV export)

## Files / persistence

By default it reads/writes:

- `../data/consolidation.csv`
- `../data/regions.csv`

You can override with environment variables:

- `DATA_DIR` (default `../data`)
- `CONSOLIDATION_FILE` (default `consolidation.csv`)
- `REGIONS_FILE` (default `regions.csv`)

## CORS

Set `ALLOWED_ORIGINS` to your GitHub Pages origin(s), comma-separated.
Example:

`ALLOWED_ORIGINS=https://dimplepurswani.github.io`

