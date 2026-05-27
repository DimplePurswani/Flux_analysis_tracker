# Flux Analysis Dashboard — Creation & Deployment Guide

This document describes how the web app was built, how it works, and how to host it for **free on GitHub Pages**.

---

## What the app does

| Feature | Description |
|--------|-------------|
| **Data source** | `data/consolidation.csv` (rows) and `data/regions.csv` (FX rates) |
| **Edit in browser** | Table rows are editable; charts and KPIs update live |
| **Save** | Writes to **browser localStorage** and downloads `consolidation_saved.csv` |
| **Reset** | Reloads defaults from `data/consolidation.csv` in the repo |
| **Export CSV** | Audit-ready CSV download |
| **Export HTML** | Standalone report with data embedded (works offline) |
| **Charts** | Black/grey bar charts: variance (+/−) and budget vs actuals |

---

## Project structure

```
Flux_analysis_tracker/
├── index.html              # Main app (Chart.js + Tailwind CDN)
├── data/
│   ├── consolidation.csv   # Editable business-unit data
│   └── regions.csv         # Region FX rates and currencies
├── .nojekyll               # Required for GitHub Pages (allows data/ paths)
├── PROMPT.md               # This file
└── README.md               # Short repo overview
```

---

## CSV formats

### `data/consolidation.csv`

```csv
Business Unit,Region,Budget (Local CCY),Actuals (Local CCY),Root Cause
EMEA Sales,EMEA,4000000,4700000,Volume
```

| Column | Description |
|--------|-------------|
| Business Unit | Name shown on charts |
| Region | Must match a region in `regions.csv` |
| Budget (Local CCY) | Budget in local currency |
| Actuals (Local CCY) | Actuals in local currency |
| Root Cause | One of: FX, Volume, Price, Timing |

### `data/regions.csv`

```csv
Region,FX Rate,Currency
Americas,1.00,USD
EMEA,1.12,EUR
```

---

## Charts (black & grey)

1. **Variance impact** — One bar per business unit.  
   - **Black** (`#1a1f2e`) = favourable (positive) variance  
   - **Grey** (`#9ca3af`) = unfavourable (negative) variance  

2. **Budget vs actuals (USD)** — Grouped bars.  
   - **Grey** = budget (USD)  
   - **Black** = actuals (USD)  

Variance is computed as: `(Actuals × FX) − (Budget × FX)`.

---

## Save behaviour (important)

GitHub Pages serves **static files only**. The browser cannot write back to your GitHub repo without authentication.

| Action | What happens |
|--------|----------------|
| **Save** | Data stored in **localStorage** (this device/browser) + CSV file downloaded |
| **Reset from CSV** | Clears localStorage and reloads `data/consolidation.csv` from the site |
| **Update live site for everyone** | Commit an updated `data/consolidation.csv` to the repo and push |

To share edits with a team: download CSV after Save → commit to `data/consolidation.csv` → push to GitHub.

---

## Host on GitHub Pages (free)

### 1. Create / use a GitHub repository

Push this folder to a repo, e.g. `your-username/Flux_analysis_tracker`.

### 2. Enable GitHub Pages

1. Open the repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**: choose **Deploy from a branch**
3. **Branch**: `main` (or `master`) → folder **`/ (root)`**
4. Save. After 1–2 minutes your site is live at:

   `https://<username>.github.io/<repo-name>/`

   Example: `https://dimple.github.io/Flux_analysis_tracker/`

### 3. Verify data loads

Open the URL. You should see: *“Loaded data from data/consolidation.csv”*.

If CSV fails (e.g. opening `index.html` as `file://`), use GitHub Pages or a local server:

```bash
# Python
python -m http.server 8080
# Then open http://localhost:8080
```

### 4. Optional: custom domain

In **Pages** settings, add your domain and a `CNAME` file in the repo root.

---

## Local development

```bash
cd Flux_analysis_tracker
python -m http.server 8080
```

Open `http://localhost:8080` — `fetch()` needs HTTP, not `file://`.

---

## Export standalone HTML

1. Edit data in the dashboard  
2. Click **Download HTML Report**  
3. Open the downloaded file in any browser — data is embedded in `window.__FLUX_EMBEDDED__`  
4. Share the HTML file by email or Drive (no server required)

---

## Tech stack

- **HTML / CSS / JavaScript** (no build step)
- **Tailwind CSS** (CDN)
- **Chart.js** (CDN)
- **GitHub Pages** (hosting)

---

## Prompt used to build this app

Use this prompt in an AI assistant to recreate or extend the project:

```
Build a static Flux Analysis / consolidation dashboard web app for free GitHub Pages hosting:

1. Store data in data/consolidation.csv and data/regions.csv.
2. Load CSV on startup; allow inline table editing with live chart updates.
3. Save: localStorage + download CSV (document that static hosting cannot write to GitHub without commit).
4. Reset button to reload repo CSV.
5. Export audit CSV and standalone HTML with embedded JSON data.
6. Professional UI: dark header, white cards, slate background.
7. Two Chart.js bar charts in black and grey only:
   - Variance bars: black for positive impact, grey for negative.
   - Grouped bars: grey for budget USD, black for actuals USD.
8. KPIs: total variance, total budget USD, total actuals USD.
9. Include PROMPT.md with deployment steps and .nojekyll for GitHub Pages.
```

---

## Updating production data

1. Edit in the app → **Save** → get `consolidation_saved.csv`  
2. Replace `data/consolidation.csv` with that file (or merge manually)  
3. `git add data/consolidation.csv && git commit -m "Update consolidation data" && git push`  
4. GitHub Pages redeploys automatically; new visitors get updated CSV (unless they have old localStorage — they can click **Reset from CSV**)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CSV not loading | Use GitHub Pages URL, not `file://` |
| Old data after deploy | Click **Reset from CSV** or clear site data in browser |
| Charts empty | Ensure at least one row with numeric budget/actuals |
| 404 on `data/*.csv` | Ensure `.nojekyll` exists in repo root |

---

*Last updated: May 2026*
