// Reporting Automation on the visitor's own file: period-over-period MIS pack.
import React, { useEffect, useMemo, useState } from 'react';
import { FileBarChart2, Download, Copy, Check } from 'lucide-react';
import { Table } from '../../lib/emailInsights';
import { Bars, Card, InsightList, Kpis, Label, LineChart, MiniTable, Note, num, PrimaryButton, Severity, downloadXlsx } from '../demos/kit';
import { useAccess } from '../../auth/AccessProvider';
import { TrialBadge } from '../../auth/TrialBadge';
import { ColSelect, FilePick, dateCols, distinct, numCols, pick, str, textCols, useTableFile, ymd } from './common';

type Period = 'day' | 'week' | 'month';
export const lowerIsBetter = (c: string) => /error|defect|backlog|cost|complaint|return|overdue|aht|handle time|delay|reject|dispute|expense|write.?off|churn|escalat/i.test(c);
const isAvg = (c: string) => /%|rate|pct|percent|sla|score|aht|avg|average|ratio|margin|price/i.test(c);
const bucket = (d: Date, p: Period) => {
  if (p === 'day') return ymd(d);
  if (p === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return 'wk ' + ymd(m);
};
const TEMPLATE = 'Date,Team,Region,Received,Processed,Errors,SLA %\n2026-09-01,Order Processing,North,420,410,4,95.2\n2026-09-01,Collections,North,180,171,2,93.1\n2026-09-02,Order Processing,North,398,402,3,96.0\n2026-09-02,Collections,North,176,160,5,88.4\n';

export interface ReportResult {
  period: Period; cur: string; prev: string | null; measures: { m: string; now: number; before: number | null; ch: number | null; avg: boolean }[];
  byDim: { k: string; now: number; before: number; ch: number | null; share: number }[]; trend: { b: string; v: number }[];
  callouts: { severity: Severity; title: string; detail: string }[]; partial: string;
}

export function buildReport(t: Table, dateCol: string, dim: string, primary: string, period: Period): ReportResult {
  const rows = t.rows.filter(r => r[dateCol] instanceof Date);
  const b = (r: typeof rows[number]) => bucket(r[dateCol] as Date, period);
  let buckets = [...new Set(rows.map(b))].sort();
  const inB = (k: string | null) => rows.filter(r => k != null && b(r) === k);
  const days = (rs: typeof rows) => new Set(rs.map(r => (r[dateCol] as Date).toDateString())).size;
  // an incomplete latest week/month would look like a collapse — report the last complete one instead
  let partial = '';
  if (period !== 'day' && buckets.length > 2 && days(inB(buckets[buckets.length - 1])) < 0.8 * days(inB(buckets[buckets.length - 2]))) {
    partial = buckets[buckets.length - 1]; buckets = buckets.slice(0, -1);
  }
  const cur = buckets[buckets.length - 1], prev = buckets.length > 1 ? buckets[buckets.length - 2] : null;
  const curRows = inB(cur), prevRows = inB(prev);
  const agg = (rs: typeof rows, m: string) => {
    const v = rs.map(r => r[m]).filter((x): x is number => typeof x === 'number');
    if (!v.length) return 0;
    const s = v.reduce((a, x) => a + x, 0); return isAvg(m) ? s / v.length : s;
  };
  const ch = (a: number, z: number | null) => (z == null || z === 0 ? null : (100 * (a - z)) / Math.abs(z));
  const measures = numCols(t).map(m => ({ m, now: agg(curRows, m), before: prev ? agg(prevRows, m) : null, ch: prev ? ch(agg(curRows, m), agg(prevRows, m)) : null, avg: isAvg(m) }));
  const keys = dim ? [...new Set(rows.map(r => str(r[dim])).filter(Boolean))] : [];
  const totalNow = agg(curRows, primary) || 1;
  const byDim = keys.map(k => {
    const n = agg(curRows.filter(r => str(r[dim]) === k), primary), p = agg(prevRows.filter(r => str(r[dim]) === k), primary);
    return { k, now: n, before: p, ch: prev ? ch(n, p) : null, share: isAvg(primary) ? 0 : (100 * n) / totalNow };
  }).sort((x, y) => y.now - x.now);
  const trend = buckets.slice(-14).map(k => ({ b: k, v: agg(inB(k), primary) }));
  const callouts: ReportResult['callouts'] = [];
  measures.filter(x => x.ch != null && Math.abs(x.ch) >= 10).forEach(x => callouts.push({
    severity: (x.ch! > 0) === lowerIsBetter(x.m) ? (Math.abs(x.ch!) >= 25 ? 'critical' : 'warning') : 'positive',
    title: `${x.m} ${x.ch! > 0 ? 'up' : 'down'} ${Math.abs(x.ch!).toFixed(1)}% vs previous ${period}`,
    detail: `${num(x.now, x.avg ? 1 : 0)} this ${period} vs ${num(x.before, x.avg ? 1 : 0)} last ${period}.`,
  }));
  if (prev && byDim.length > 1) {
    const moved = byDim.filter(x => x.ch != null && x.before > 0);
    const worst = [...moved].sort((a, z) => (a.ch ?? 0) - (z.ch ?? 0))[0], best = [...moved].sort((a, z) => (z.ch ?? 0) - (a.ch ?? 0))[0];
    const lb = lowerIsBetter(primary);
    if (worst && (worst.ch ?? 0) < -5) callouts.push({ severity: lb ? 'positive' : 'warning', title: `${worst.k}: ${primary} down ${Math.abs(worst.ch!).toFixed(1)}%`, detail: `Largest fall by ${dim} (${num(worst.before)} → ${num(worst.now)}).` });
    if (best && (best.ch ?? 0) > 5) callouts.push({ severity: lb ? 'warning' : 'positive', title: `${best.k}: ${primary} up ${best.ch!.toFixed(1)}%`, detail: `Largest rise by ${dim} (${num(best.before)} → ${num(best.now)}).` });
    const gone = byDim.filter(x => x.before > 0 && x.now === 0).map(x => x.k);
    if (gone.length) callouts.push({ severity: 'info', title: `No ${primary} this ${period} for ${gone.slice(0, 4).join(', ')}`, detail: 'They had activity in the previous period — check if data is missing.' });
    if (!isAvg(primary) && byDim[0].share > 50) callouts.push({ severity: 'info', title: `${byDim[0].k} is ${byDim[0].share.toFixed(0)}% of ${primary}`, detail: 'High concentration in one segment.' });
  }
  if (!callouts.length) callouts.push({ severity: 'positive', title: 'Stable period', detail: `No measure moved more than 10% vs the previous ${period}.` });
  return { period, cur, prev, measures, byDim, trend, callouts, partial };
}

export const ReportingTool: React.FC = () => {
  const { requestRun } = useAccess();
  const { table, err, load } = useTableFile();
  const [cfg, setCfg] = useState({ date: '', dim: '', primary: '', period: 'week' as Period });
  const [res, setRes] = useState<ReportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!table) return;
    const dims = textCols(table).filter(c => { const n = distinct(table, c); return n >= 2 && n <= 40; });
    const nums = numCols(table);
    const date = dateCols(table)[0] ?? '';
    const span = date ? (() => { const ds = table.rows.map(r => r[date]).filter((d): d is Date => d instanceof Date).map(d => +d); return (Math.max(...ds) - Math.min(...ds)) / 864e5; })() : 0;
    setCfg({ date, dim: dims[0] ?? '', primary: pick(nums, /amount|revenue|sales|value|received|volume|qty|count/i), period: span > 120 ? 'month' : span > 20 ? 'week' : 'day' });
    setRes(null); setMsg(date ? '' : 'No date column found — reporting needs a date column to compare periods.');
  }, [table]);

  const run = async () => {
    if (!table || !cfg.date) return;
    if (!(await requestRun('reporting-automation', { rows: table.rows.length }))) return;
    setBusy(true); await new Promise(r => setTimeout(r, 400));
    setRes(buildReport(table, cfg.date, cfg.dim, cfg.primary, cfg.period)); setBusy(false);
  };

  const summary = useMemo(() => {
    if (!res) return '';
    const lines = [`${table?.name} — ${cfg.period === 'day' ? 'Daily' : cfg.period === 'week' ? 'Weekly' : 'Monthly'} report · ${res.cur}${res.prev ? ` vs ${res.prev}` : ''}`, ''];
    res.measures.forEach(m => lines.push(`• ${m.m}: ${num(m.now, m.avg ? 1 : 0)}${m.ch != null ? ` (${m.ch >= 0 ? '+' : ''}${m.ch.toFixed(1)}%)` : ''}`));
    lines.push('', 'Key points:'); res.callouts.forEach(c => lines.push(`• ${c.title} — ${c.detail}`));
    lines.push('', '— Generated by NorthLume AI Reporting Automation');
    return lines.join('\n');
  }, [res]);

  const download = () => res && table && downloadXlsx(`Report_${res.cur.replace(/\s/g, '_')}.xlsx`, [
    { name: 'Summary', header: ['Measure', `This ${res.period} (${res.cur})`, `Previous (${res.prev ?? '–'})`, 'Change %', 'Aggregation'], rows: res.measures.map(m => [m.m, +m.now.toFixed(2), m.before == null ? null : +m.before.toFixed(2), m.ch == null ? null : +m.ch.toFixed(1), m.avg ? 'average' : 'sum']) },
    ...(cfg.dim ? [{ name: `By ${cfg.dim}`, header: [cfg.dim, `${cfg.primary} now`, `${cfg.primary} previous`, 'Change %', 'Share %'], rows: res.byDim.map(d => [d.k, +d.now.toFixed(2), +d.before.toFixed(2), d.ch == null ? null : +d.ch.toFixed(1), +d.share.toFixed(1)]) }] : []),
    { name: 'Trend', header: ['Period', cfg.primary], rows: res.trend.map(x => [x.b, +x.v.toFixed(2)]) },
    { name: 'Commentary', header: ['Severity', 'Point', 'Detail'], rows: res.callouts.map(c => [c.severity, c.title, c.detail]) },
    { name: 'Data', header: table.columns, rows: table.rows.map(r => table.columns.map(c => r[c])) },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4 min-w-0">
        <Card className="!p-4 space-y-3">
          <Label>Your data</Label>
          <FilePick label="Upload a transaction / MIS export" hint="Excel or CSV with a date column and numbers" table={table} onFile={load} err={err || msg}
            template={{ name: 'reporting_template.csv', csv: TEMPLATE }} />
          {table && cfg.date && (
            <div className="grid grid-cols-2 gap-2">
              <ColSelect label="Date column" value={cfg.date} options={dateCols(table)} onChange={v => setCfg({ ...cfg, date: v })} />
              <ColSelect label="Report period" value={cfg.period} options={['day', 'week', 'month']} onChange={v => setCfg({ ...cfg, period: v as Period })} />
              <ColSelect label="Main measure" value={cfg.primary} options={numCols(table)} onChange={v => setCfg({ ...cfg, primary: v })} />
              <ColSelect label="Break down by" value={cfg.dim} options={textCols(table)} onChange={v => setCfg({ ...cfg, dim: v })} allowNone />
            </div>
          )}
          <PrimaryButton icon={FileBarChart2} busy={busy} disabled={!table || !cfg.date || !cfg.primary} onClick={run}>Build my report</PrimaryButton>
          <TrialBadge tool="reporting-automation" />
          <Note>Compares the latest {cfg.period} with the one before, for every numeric column (rates and % columns are averaged, the rest summed). Your file stays in your browser.</Note>
        </Card>
      </div>
      <div className="lg:col-span-8 space-y-4 min-w-0">
        {!res ? (
          <Card className="text-sm text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">What you'll get</div>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Headline KPIs for this period vs the previous one</li><li>Breakdown by team / region / product with the biggest movers</li>
              <li>Trend chart and written commentary</li><li>A ready-to-send email summary and a multi-sheet Excel report pack</li>
            </ul>
          </Card>
        ) : (<>
          {res.partial && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">The latest {res.period} ({res.partial}) is still in progress, so this report covers the last complete {res.period} ({res.cur}) vs the one before.</p>}
          <Kpis items={res.measures.slice(0, 4).map(m => ({ label: m.m, value: num(m.now, m.avg ? 1 : 0), sub: m.ch == null ? `this ${res.period}` : `${m.ch >= 0 ? '+' : ''}${m.ch.toFixed(1)}% vs ${res.prev}`, tone: m.ch == null || Math.abs(m.ch) < 0.05 ? 'neutral' : (m.ch > 0) !== lowerIsBetter(m.m) ? 'good' : 'bad' }))} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><Label>{cfg.primary} by {res.period}</Label>{res.trend.length > 1 ? <LineChart labels={res.trend.map(x => x.b)} series={[{ name: cfg.primary, values: res.trend.map(x => x.v) }]} /> : <Note>Only one period in the file.</Note>}</Card>
            <Card>{cfg.dim ? <Bars title={`${cfg.primary} by ${cfg.dim} (${res.cur})`} rows={res.byDim.slice(0, 10).map(d => ({ label: d.k, value: d.now, flag: (d.ch ?? 0) < -10 }))} /> : <Note>Pick a "Break down by" column to see segments.</Note>}</Card>
          </div>
          <Card><Label>Commentary</Label><InsightList items={res.callouts} /></Card>
          <Card>
            <Label>All measures</Label>
            <MiniTable max={12} align={['l', 'r', 'r', 'r']} head={['Measure', `This ${res.period}`, 'Previous', 'Change']}
              rows={res.measures.map(m => [m.m, num(m.now, m.avg ? 1 : 0), num(m.before, m.avg ? 1 : 0), m.ch == null ? '–' : `${m.ch >= 0 ? '+' : ''}${m.ch.toFixed(1)}%`])} />
          </Card>
          <div className="flex flex-wrap gap-2">
            <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold"><Download className="w-4 h-4" /> Download report pack (Excel)</button>
            <button onClick={() => { navigator.clipboard?.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-800">
              {copied ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4" />} Copy email summary</button>
          </div>
        </>)}
      </div>
    </div>
  );
};
