# Flux Analysis Tracker (Dynamic)

React frontend + Python (Flask) backend for an editable consolidation dashboard with black/grey bar charts.

## Architecture

- `frontend/` -> React + Vite UI
- `backend/` -> Flask API
- `data/` -> CSV data files persisted by backend

## Features

- Load data from backend CSV files
- Edit/add/delete rows in UI
- Save changes to server (`POST /api/consolidation`)
- Positive/negative variance bar chart
- Budget vs Actuals black/grey grouped bar chart
- Download CSV and HTML report from frontend

## Free hosting target

- Frontend: GitHub Pages
- Backend: PythonAnywhere (free tier)

## Quick local run

Backend:

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Set `frontend/.env`:

```env
VITE_API_BASE=http://127.0.0.1:8000/api
VITE_BASE_PATH=/
```

## Deployment guide

Full step-by-step setup is in `PROMPT.md`.
