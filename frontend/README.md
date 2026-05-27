# Flux Frontend (React + Vite)

This is the React frontend for the Flux dynamic dashboard.

## Setup

1. Install dependencies:
   - `npm install`
2. Create `.env` from `.env.example`
3. Update `VITE_API_BASE` to your PythonAnywhere API URL
4. Run:
   - `npm run dev`

## Build

- `npm run build`

The production output is created in `frontend/dist`.

## Environment variables

- `VITE_API_BASE` (required): backend base API URL ending in `/api`
- `VITE_BASE_PATH` (optional): base path for GitHub Pages, e.g. `/Flux_analysis_tracker/`
