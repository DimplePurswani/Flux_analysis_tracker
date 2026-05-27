# Flux Analysis Dashboard

A static **consolidation & variance dashboard** for financial flux analysis. Edit data in the browser, view black/grey impact charts, and export CSV or standalone HTML reports.

## Live demo

After enabling GitHub Pages, open:

`https://<your-username>.github.io/Flux_analysis_tracker/`

## Quick start

1. Clone the repo  
2. Run a local server: `python -m http.server 8080`  
3. Open `http://localhost:8080`  

## Data files

| File | Purpose |
|------|---------|
| `data/consolidation.csv` | Business units, budgets, actuals, root cause |
| `data/regions.csv` | FX rates per region |

## Actions in the app

- **Save** — Stores data in your browser + downloads CSV  
- **Reset from CSV** — Reloads repo defaults  
- **Download CSV** — Audit export  
- **Download HTML Report** — Offline snapshot with embedded data  

## Deploy to GitHub Pages (free)

See **[PROMPT.md](./PROMPT.md)** for full setup, CSV format, chart behaviour, and troubleshooting.

**Short version:** Settings → Pages → Deploy from branch `main` → root `/` → push repo with `.nojekyll` included.

## License

Use freely for internal reporting and analysis.
