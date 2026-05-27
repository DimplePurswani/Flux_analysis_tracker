import { useEffect, useMemo, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import './App.css';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api').replace(/\/$/, '');
const ROOT_CAUSES = ['FX', 'Volume', 'Price', 'Timing'];

const sampleRows = [
  { bu: 'EMEA Sales', region: 'EMEA', budget: 4000000, actuals: 4700000, root: 'Volume' },
  { bu: 'APAC Services', region: 'APAC', budget: 3500000, actuals: 2700000, root: 'Price' },
  { bu: 'Americas Ops', region: 'Americas', budget: 2500000, actuals: 3500000, root: 'FX' },
];

function App() {
  const [rows, setRows] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const varianceCanvasRef = useRef(null);
  const compareCanvasRef = useRef(null);
  const varianceChartRef = useRef(null);
  const compareChartRef = useRef(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    if (!rows.length) return;
    renderCharts();
    return () => {
      varianceChartRef.current?.destroy();
      compareChartRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, regions]);

  const computed = useMemo(() => {
    const byRow = rows.map((r) => {
      const fx = getFX(regions, r.region);
      const actualsUSD = num(r.actuals) * fx;
      const budgetUSD = num(r.budget) * fx;
      const variance = actualsUSD - budgetUSD;
      const fxImpact = actualsUSD - num(r.actuals);
      return { ...r, fx, actualsUSD, budgetUSD, variance, fxImpact };
    });
    const totals = byRow.reduce(
      (acc, r) => {
        acc.budget += r.budgetUSD;
        acc.actuals += r.actualsUSD;
        acc.variance += r.variance;
        return acc;
      },
      { budget: 0, actuals: 0, variance: 0 }
    );
    return { byRow, totals };
  }, [rows, regions]);

  async function loadAllData() {
    setLoading(true);
    setError('');
    setStatus('');
    try {
      const [regionsRes, rowsRes] = await Promise.all([
        fetch(`${API_BASE}/regions`),
        fetch(`${API_BASE}/consolidation`),
      ]);
      if (!regionsRes.ok || !rowsRes.ok) {
        throw new Error('API request failed');
      }
      const regionsJson = await regionsRes.json();
      const rowsJson = await rowsRes.json();
      const mappedRegions = (regionsJson.regions || []).map((r) => ({
        label: r.Region || r.label,
        fx: num(r['FX Rate'] ?? r.fx, 1),
        ccy: r.Currency || r.ccy || 'USD',
      }));
      const mappedRows = (rowsJson.rows || []).map((r) => ({
        bu: r['Business Unit'] || r.bu || '',
        region: r.Region || r.region || mappedRegions[0]?.label || 'Americas',
        budget: num(r['Budget (Local CCY)'] ?? r.budget),
        actuals: num(r['Actuals (Local CCY)'] ?? r.actuals),
        root: r['Root Cause'] || r.root || ROOT_CAUSES[0],
      }));
      setRegions(mappedRegions.length ? mappedRegions : defaultRegions());
      setRows(mappedRows.length ? mappedRows : sampleRows);
      setStatus('Loaded data from backend.');
    } catch (e) {
      setRegions(defaultRegions());
      setRows(sampleRows);
      setError(`Could not reach backend (${API_BASE}). Showing sample data.`);
    } finally {
      setLoading(false);
    }
  }

  function renderCharts() {
    const labels = computed.byRow.map((r, i) => r.bu || `Unit ${i + 1}`);
    const varianceData = computed.byRow.map((r) => r.variance);
    const budgetData = computed.byRow.map((r) => r.budgetUSD);
    const actualData = computed.byRow.map((r) => r.actualsUSD);

    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#111827',
          callbacks: {
            label(ctx) {
              return ` ${ctx.dataset.label}: ${formatUSD(ctx.parsed.y)}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: {
          grid: { color: '#e2e8f0' },
          ticks: {
            color: '#64748b',
            callback(v) {
              const abs = Math.abs(v);
              if (abs >= 1_000_000) return `${v < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
              if (abs >= 1000) return `${v < 0 ? '-' : ''}$${(abs / 1000).toFixed(0)}K`;
              return `${v < 0 ? '-' : ''}$${abs}`;
            },
          },
        },
      },
    };

    varianceChartRef.current?.destroy();
    compareChartRef.current?.destroy();

    varianceChartRef.current = new Chart(varianceCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Variance (USD)',
            data: varianceData,
            backgroundColor: varianceData.map((v) => (v >= 0 ? '#111827' : '#9ca3af')),
            borderRadius: 4,
            maxBarThickness: 40,
          },
        ],
      },
      options: commonOptions,
    });

    compareChartRef.current = new Chart(compareCanvasRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Budget (USD)', data: budgetData, backgroundColor: '#9ca3af', borderRadius: 4, maxBarThickness: 32 },
          { label: 'Actuals (USD)', data: actualData, backgroundColor: '#111827', borderRadius: 4, maxBarThickness: 32 },
        ],
      },
      options: { ...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, beginAtZero: true } } },
    });
  }

  function updateRow(idx, field, value) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { bu: '', region: regions[0]?.label || 'Americas', budget: 0, actuals: 0, root: ROOT_CAUSES[0] }]);
  }

  function removeRow(idx) {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  }

  async function saveRows() {
    setSaving(true);
    setError('');
    setStatus('');
    try {
      const res = await fetch(`${API_BASE}/consolidation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      });
      if (!res.ok) throw new Error('Save failed');
      setStatus('Saved to backend successfully.');
    } catch (e) {
      setError(`Failed to save. Check backend URL and CORS (${API_BASE}).`);
    } finally {
      setSaving(false);
    }
  }

  function downloadCsv() {
    const headers = ['Business Unit', 'Region', 'Budget (Local CCY)', 'Actuals (Local CCY)', 'Root Cause'];
    const lines = rows.map((r) => [r.bu, r.region, r.budget, r.actuals, r.root].map(csvEscape).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    downloadBlob(csv, 'consolidation_export.csv', 'text/csv;charset=utf-8');
  }

  function downloadReportHtml() {
    const payload = {
      generatedAt: new Date().toISOString(),
      totals: computed.totals,
      rows: computed.byRow,
    };
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Flux Report</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111827}table{border-collapse:collapse;width:100%;margin-top:12px}th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>Flux Analysis Report</h1><p>Generated: ${new Date().toLocaleString()}</p><h2>Totals</h2><ul><li>Budget (USD): ${formatUSD(payload.totals.budget)}</li><li>Actuals (USD): ${formatUSD(payload.totals.actuals)}</li><li>Variance (USD): ${formatUSD(payload.totals.variance)}</li></ul><h2>Rows</h2><table><thead><tr><th>Business Unit</th><th>Region</th><th>Budget (Local)</th><th>Actuals (Local)</th><th>Actuals (USD)</th><th>Variance (USD)</th><th>Root Cause</th></tr></thead><tbody>${payload.rows
      .map((r) => `<tr><td>${escapeHtml(r.bu)}</td><td>${escapeHtml(r.region)}</td><td>${r.budget}</td><td>${r.actuals}</td><td>${formatUSD(r.actualsUSD)}</td><td>${formatUSD(r.variance)}</td><td>${escapeHtml(r.root)}</td></tr>`)
      .join('')}</tbody></table></body></html>`;
    downloadBlob(html, 'flux_dashboard_report.html', 'text/html;charset=utf-8');
  }

  if (loading) return <div className="center">Loading dashboard...</div>;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>Flux Analysis Dashboard</h1>
          <p>Dynamic app · React frontend + Python backend</p>
        </div>
        <div className="toolbar">
          <button onClick={saveRows} disabled={saving}>{saving ? 'Saving...' : 'Save to Server'}</button>
          <button onClick={loadAllData}>Reload</button>
          <button onClick={downloadCsv}>Download CSV</button>
          <button onClick={downloadReportHtml}>Download HTML Report</button>
        </div>
      </header>

      {(status || error) && (
        <div className={`notice ${error ? 'error' : 'success'}`}>
          {error || status}
        </div>
      )}

      <section className="kpis">
        <article>
          <h3>Total Variance (USD)</h3>
          <p className={computed.totals.variance >= 0 ? 'good' : 'bad'}>{formatUSD(computed.totals.variance)}</p>
        </article>
        <article>
          <h3>Total Budget (USD)</h3>
          <p>{formatUSD(computed.totals.budget)}</p>
        </article>
        <article>
          <h3>Total Actuals (USD)</h3>
          <p>{formatUSD(computed.totals.actuals)}</p>
        </article>
      </section>

      <section className="charts">
        <article className="card">
          <h3>Variance impact (positive & negative)</h3>
          <div className="chart-wrap"><canvas ref={varianceCanvasRef} /></div>
        </article>
        <article className="card">
          <h3>Budget vs Actuals (black/grey)</h3>
          <div className="chart-wrap"><canvas ref={compareCanvasRef} /></div>
        </article>
      </section>

      <section className="card table-card">
        <div className="table-head">
          <h3>Business unit data</h3>
          <button onClick={addRow}>+ Add row</button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Business Unit</th>
                <th>Region</th>
                <th>Budget (Local)</th>
                <th>Actuals (Local)</th>
                <th>FX Impact (USD)</th>
                <th>Actuals (USD)</th>
                <th>Variance (USD)</th>
                <th>Root Cause</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {computed.byRow.map((row, idx) => (
                <tr key={`${idx}-${row.bu}`}>
                  <td><input value={row.bu} onChange={(e) => updateRow(idx, 'bu', e.target.value)} /></td>
                  <td>
                    <select value={row.region} onChange={(e) => updateRow(idx, 'region', e.target.value)}>
                      {regions.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                    </select>
                  </td>
                  <td><input type="number" value={row.budget} onChange={(e) => updateRow(idx, 'budget', num(e.target.value))} /></td>
                  <td><input type="number" value={row.actuals} onChange={(e) => updateRow(idx, 'actuals', num(e.target.value))} /></td>
                  <td className={row.fxImpact >= 0 ? 'good' : 'bad'}>{formatUSD(row.fxImpact)}</td>
                  <td>{formatUSD(row.actualsUSD)}</td>
                  <td className={row.variance >= 0 ? 'good' : 'bad'}>{formatUSD(row.variance)}</td>
                  <td>
                    <select value={row.root} onChange={(e) => updateRow(idx, 'root', e.target.value)}>
                      {ROOT_CAUSES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><button className="danger" onClick={() => removeRow(idx)}>&times;</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function defaultRegions() {
  return [
    { label: 'Americas', fx: 1, ccy: 'USD' },
    { label: 'EMEA', fx: 1.12, ccy: 'EUR' },
    { label: 'APAC', fx: 0.74, ccy: 'AUD' },
    { label: 'LATAM', fx: 0.19, ccy: 'BRL' },
    { label: 'UK&I', fx: 1.3, ccy: 'GBP' },
  ];
}

function getFX(regions, label) {
  return regions.find((r) => r.label === label)?.fx || 1;
}

function num(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatUSD(v) {
  const n = num(v);
  const sign = n < 0 ? '-' : '';
  return `${sign}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export default App;
