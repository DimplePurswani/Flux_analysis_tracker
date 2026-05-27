import csv
import os
import time
from io import StringIO

from flask import Flask, jsonify, request, Response
from flask_cors import CORS


def _env(name: str, default: str) -> str:
    v = os.getenv(name)
    return v if v is not None and v != "" else default


APP_ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(APP_ROOT, _env("DATA_DIR", "../data")))
CONSOLIDATION_CSV = os.path.join(DATA_DIR, _env("CONSOLIDATION_FILE", "consolidation.csv"))
REGIONS_CSV = os.path.join(DATA_DIR, _env("REGIONS_FILE", "regions.csv"))

ALLOWED_ORIGINS = _env("ALLOWED_ORIGINS", "*")


app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": ALLOWED_ORIGINS.split(",") if ALLOWED_ORIGINS != "*" else "*"}},
)


CONSOLIDATION_HEADERS = [
    "Business Unit",
    "Region",
    "Budget (Local CCY)",
    "Actuals (Local CCY)",
    "Root Cause",
]


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def _read_csv(path: str):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def _atomic_write_text(path: str, content: str):
    _ensure_data_dir()
    tmp = f"{path}.tmp.{int(time.time() * 1000)}"
    with open(tmp, "w", encoding="utf-8", newline="") as f:
        f.write(content)
    os.replace(tmp, path)


def _rows_to_consolidation_csv(rows):
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=CONSOLIDATION_HEADERS, extrasaction="ignore")
    writer.writeheader()
    for r in rows:
        writer.writerow(
            {
                "Business Unit": (r.get("bu") or r.get("Business Unit") or "").strip(),
                "Region": (r.get("region") or r.get("Region") or "").strip(),
                "Budget (Local CCY)": r.get("budget", r.get("Budget (Local CCY)", 0)) or 0,
                "Actuals (Local CCY)": r.get("actuals", r.get("Actuals (Local CCY)", 0)) or 0,
                "Root Cause": (r.get("root") or r.get("Root Cause") or "").strip(),
            }
        )
    return output.getvalue()


@app.get("/api/health")
def health():
    return jsonify(
        {
            "ok": True,
            "dataDir": DATA_DIR,
            "files": {
                "consolidation": os.path.exists(CONSOLIDATION_CSV),
                "regions": os.path.exists(REGIONS_CSV),
            },
        }
    )


@app.get("/api/regions")
def get_regions():
    return jsonify({"regions": _read_csv(REGIONS_CSV)})


@app.get("/api/consolidation")
def get_consolidation():
    return jsonify({"rows": _read_csv(CONSOLIDATION_CSV)})


@app.post("/api/consolidation")
def save_consolidation():
    payload = request.get_json(silent=True) or {}
    rows = payload.get("rows")
    if not isinstance(rows, list):
        return jsonify({"error": "rows must be an array"}), 400

    csv_text = _rows_to_consolidation_csv(rows)
    _atomic_write_text(CONSOLIDATION_CSV, csv_text)
    return jsonify({"ok": True, "saved": len(rows)})


@app.get("/api/consolidation.csv")
def download_consolidation_csv():
    rows = _read_csv(CONSOLIDATION_CSV)
    csv_text = _rows_to_consolidation_csv(rows)
    return Response(
        csv_text,
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=consolidation_export.csv"},
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(_env("PORT", "8000")), debug=True)

