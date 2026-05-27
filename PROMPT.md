# Flux Dynamic App - Build + Deploy Guide

This repo has been converted from static HTML to a dynamic architecture:

- **Frontend**: React (Vite) in `frontend/`
- **Backend**: Flask API in `backend/`
- **Data**: CSV files in `data/` (read/write by backend)
- **Free hosting target**:
  - Frontend on **GitHub Pages**
  - Backend on **PythonAnywhere**

---

## 1) Backend API (Flask)

### Files

- `backend/app.py`
- `backend/wsgi.py`
- `backend/requirements.txt`

### Endpoints

- `GET /api/health`
- `GET /api/regions`
- `GET /api/consolidation`
- `POST /api/consolidation` (save edited rows to CSV)
- `GET /api/consolidation.csv`

### Data persistence

The backend writes directly to:

- `data/consolidation.csv`
- `data/regions.csv`

Environment variables supported:

- `DATA_DIR` (default: `../data`)
- `CONSOLIDATION_FILE` (default: `consolidation.csv`)
- `REGIONS_FILE` (default: `regions.csv`)
- `ALLOWED_ORIGINS` (for CORS)

---

## 2) Frontend (React)

### Files

- `frontend/src/App.jsx`
- `frontend/src/App.css`
- `frontend/src/index.css`
- `frontend/.env.example`
- `frontend/vite.config.js`

### Core behavior

- Loads regions + consolidation rows from backend
- Editable table with add/remove
- KPIs auto-recomputed
- Chart.js bar charts:
  - **Variance impact** (black for positive, grey for negative)
  - **Budget vs Actuals** (grey budget, black actuals)
- Save to server via `POST /api/consolidation`
- Download CSV and downloadable HTML report

---

## 3) Local development

### Backend

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on `http://127.0.0.1:8000`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Set:

```env
VITE_API_BASE=http://127.0.0.1:8000/api
VITE_BASE_PATH=/
```

Run:

```bash
npm run dev
```

---

## 4) Deploy backend to PythonAnywhere (free)

1. Create PythonAnywhere account
2. Open a **Bash console**
3. Clone repo:

   ```bash
   git clone https://github.com/<your-username>/Flux_analysis_tracker.git
   cd Flux_analysis_tracker/backend
   ```

4. Create virtualenv and install:

   ```bash
   mkvirtualenv fluxenv --python=python3.10
   pip install -r requirements.txt
   ```

5. Create a new **Web app** (Manual configuration -> Flask)
6. In **WSGI configuration file**, replace with:

   ```python
   import os
   import sys

   project_home = '/home/<your-username>/Flux_analysis_tracker/backend'
   if project_home not in sys.path:
       sys.path.insert(0, project_home)

   os.environ['DATA_DIR'] = '/home/<your-username>/Flux_analysis_tracker/data'
   os.environ['ALLOWED_ORIGINS'] = 'https://<your-github-username>.github.io'

   from app import app as application
   ```

7. Reload web app in PythonAnywhere dashboard
8. Verify:
   - `https://<your-username>.pythonanywhere.com/api/health`

---

## 5) Deploy frontend to GitHub Pages

Use GitHub Actions or manual deploy. Fast manual method:

1. In local repo:

   ```bash
   cd frontend
   npm install
   ```

2. Create `.env.production`:

   ```env
   VITE_API_BASE=https://<pythonanywhere-username>.pythonanywhere.com/api
   VITE_BASE_PATH=/Flux_analysis_tracker/
   ```

3. Build:

   ```bash
   npm run build
   ```

4. Publish `frontend/dist` to GitHub Pages (branch `gh-pages` or `/docs` strategy)
5. In GitHub repo settings, set Pages source to deployed output
6. Open:
   - `https://<github-username>.github.io/Flux_analysis_tracker/`

---

## 6) Important notes

- GitHub Pages is static; persistence is provided by PythonAnywhere backend.
- CORS must allow your GitHub Pages origin in `ALLOWED_ORIGINS`.
- PythonAnywhere free tier may sleep when idle.

---

## Prompt used to generate this architecture

```text
Build a dynamic Flux Analysis application with:
1) React frontend (Vite) hosted on GitHub Pages,
2) Python Flask backend hosted on PythonAnywhere free tier,
3) CSV data persistence in data/consolidation.csv and data/regions.csv.
Include editable table, add/remove, save to backend, auto-updating KPIs,
black/grey bar charts for positive/negative variance and budget vs actuals,
CSV + HTML report download, and full deployment documentation.
```
