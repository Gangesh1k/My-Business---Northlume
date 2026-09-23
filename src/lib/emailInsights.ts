// Browser version of the NorthLume email insight engine (mirrors the Python pipeline).
// Extract table → normalise → KPIs, breakdown, trend, target misses, ageing, status exceptions, outliers → triage.

export type Cell = string | number | Date | null;
export type Row = Record<string, Cell>;
export type Severity = 'critical' | 'warning' | 'positive' | 'info';

export interface Table {
  name: string;
  source: 'attachment' | 'body-html' | 'body-text' | 'upload' | 'paste';
  columns: string[];
  rows: Row[];
  types: Record<string, 'number' | 'date' | 'text'>;
}
export interface Insight { severity: Severity; title: string; detail: string }
export interface Kpi { metric: string; headline: 'total' | 'average'; total: number; average: number; min: number; max: number }
export interface Exception { type: string; item: string; value: number | null; expected: number | null }
export interface Analysis {
  table: Table;
  metric?: string; dimension?: string; dateColumn?: string;
  kpis: Kpi[];
  breakdown: { group: string; total: number; share: number }[];
  trend: { period: string; value: number }[];
  exceptions: Exception[];
  insights: Insight[];
}
export interface Triage { category: string; priority: 'High' | 'Medium' | 'Low'; reasons: string[] }

const METRIC_HINTS = /amount|value|revenue|sales|cost|spend|total|price|qty|quantity|volume|count|hours|tickets|units|invoice|balance|due|outstanding|aht|tat|score|margin|profit/i;
const DIM_HINTS = /region|branch|vendor|supplier|category|team|department|dept|product|customer|client|agent|site|location|city|state|zone|process|queue|owner|account|warehouse|shift/i;
const ID_HINTS = /(^|\b|_)(id|no|num|number|code|sku|phone|mobile|pin|zip|ref|sr|s\.no|sl)(\b|_|$)/i;
const ACTUAL_HINTS = /actual|achieved|achievement|done|completed|delivered|mtd|ytd/i;
const TARGET_HINTS = /target|plan|budget|goal|sla|forecast|quota|expected|reorder|threshold|safety stock|min level|benchmark/i;
const LOWER_BETTER = /aht|tat|handle time|time|cost|spend|expense|delay|error|defect|days|attrition|backlog/i;
const GOOD_UP = /revenue|sales|orders|profit|margin|collection|tickets closed|resolved|units sold|productivity|nps|csat/i;
const AVG_TYPE = /aht|tat|days|age|ageing|aging|rate|ratio|%|percent|pct|score|time|min\)|price|nps|csat|margin/i;
const BAD_STATUS = /overdue|breach|fail|error|rejected|escalat|critical|delayed|late|missed|open|pending|on hold|blocked/i;

// ------------------------------------------------------------------ formatting
export const fmt = (x: number | null | undefined): string => {
  if (x == null || !isFinite(x)) return '–';
  const a = Math.abs(x);
  if (a >= 1e6) return (x / 1e6).toFixed(2) + 'M';
  if (a >= 1e5) return (x / 1e3).toFixed(1) + 'K';
  return a >= 100 || Number.isInteger(x) ? Math.round(x).toLocaleString('en-IN') : x.toFixed(2);
};
export const pct = (x: number) => (isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(1)}%` : '–');
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const fmtDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()].replace(/^./, c => c.toUpperCase())}`;

// ------------------------------------------------------------------ value parsing
export function toNumber(v: Cell): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (v instanceof Date) return null;
  let s = String(v).trim();
  if (!s) return null;
  const neg = /^\(.*\)$/.test(s);
  s = s.replace(/[()\s$€£₹¥,%]|Rs\.?|INR|USD/g, '');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  const n = parseFloat(s);
  return neg ? -n : n;
}

function toDate(v: Cell, dayFirst: boolean): Date | null {
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (v == null) return null;
  const s = String(v).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    const [d, mo] = dayFirst ? [+m[1], +m[2]] : [+m[2], +m[1]];
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    return new Date(y, mo - 1, d);
  }
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[a-z]*[\s-,]*(\d{2,4})$/);
  if (m) {
    const mo = MONTHS.indexOf(m[2].toLowerCase());
    if (mo >= 0) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], mo, +m[1]);
  }
  return null;
}

// ------------------------------------------------------------------ normalise raw grid → typed table
export function normalize(grid: Cell[][], name: string, source: Table['source']): Table | null {
  let rows = grid.map(r => r.map(c => (typeof c === 'string' ? c.trim() : c) || (c === 0 ? 0 : null)))
    .filter(r => r.some(c => c != null && c !== ''));
  if (rows.length < 2) return null;
  const width = Math.max(...rows.map(r => r.length));
  rows = rows.map(r => [...r, ...Array(width - r.length).fill(null)]);
  // find header row (skips title blocks like "Daily Branch Sales MIS — Sep 2026")
  let h = 0;
  for (let i = 0; i < Math.min(10, rows.length - 1); i++) {
    const filled = rows[i].filter(c => c != null && c !== '').length;
    const texty = rows[i].filter(c => typeof c === 'string' && toNumber(c) == null).length;
    if (filled >= Math.max(2, Math.floor(width * 0.6)) && texty >= filled * 0.6) { h = i; break; }
  }
  const seen: Record<string, number> = {};
  const cols = rows[h].map((c, i) => {
    let n = String(c ?? '').replace(/\s+/g, ' ').trim() || `Column ${i + 1}`;
    if (seen[n] != null) n = `${n} (${++seen[n]})`; else seen[n] = 0;
    return n;
  });
  let body = rows.slice(h + 1).filter(r => !/^(grand\s+)?total\b|^sum$|^subtotal/i.test(String(r[0] ?? '').trim()));
  // drop fully empty columns
  const keep = cols.map((_, i) => body.some(r => r[i] != null && r[i] !== ''));
  const columns = cols.filter((_, i) => keep[i]);
  body = body.map(r => r.filter((_, i) => keep[i]));
  const types: Table['types'] = {};
  const dayFirstByCol: Record<string, boolean> = {};
  columns.forEach((c, i) => {
    const vals = body.map(r => r[i]).filter(v => v != null && v !== '');
    if (!vals.length) { types[c] = 'text'; return; }
    if (vals.filter(v => toNumber(v) != null).length >= 0.8 * vals.length) { types[c] = 'number'; return; }
    // dd/mm (India/UK) by default; switch to mm/dd only if some second component is > 12
    const dayFirst = !vals.some(v => { const m = String(v).match(/^\d{1,2}[/.-](\d{1,2})[/.-]\d{2,4}/); return !!m && +m[1] > 12; });
    dayFirstByCol[c] = dayFirst;
    if (vals.filter(v => toDate(v, dayFirst) != null).length >= 0.8 * vals.length) { types[c] = 'date'; return; }
    types[c] = 'text';
  });
  const out: Row[] = body.map(r => {
    const o: Row = {};
    columns.forEach((c, i) => {
      const v = r[i];
      o[c] = types[c] === 'number' ? toNumber(v) : types[c] === 'date' ? toDate(v, dayFirstByCol[c] ?? true) : v == null || v === '' ? null : String(v);
    });
    return o;
  });
  if (!out.length || columns.length < 2) return null;
  return { name, source, columns, rows: out, types };
}

// ------------------------------------------------------------------ extractors
export function parseDelimited(text: string): Cell[][] {
  const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
  if (!lines.length) return [];
  const tabs = (text.match(/\t/g) || []).length, commas = (text.match(/,/g) || []).length;
  if (lines.filter(l => (l.match(/\|/g) || []).length >= 2).length >= 2) {
    return lines.filter(l => !/^[\s|:+-]+$/.test(l)).map(l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()));
  }
  if (tabs >= lines.length) return lines.map(l => l.split('\t'));
  if (commas >= lines.length) {
    return lines.map(l => {
      const cells: string[] = []; let cur = '', q = false;
      for (let i = 0; i < l.length; i++) {
        const ch = l[i];
        if (ch === '"') { if (q && l[i + 1] === '"') { cur += '"'; i++; } else q = !q; }
        else if (ch === ',' && !q) { cells.push(cur); cur = ''; } else cur += ch;
      }
      cells.push(cur);
      return cells;
    });
  }
  return lines.map(l => l.trim().split(/\s{2,}/));
}

export function textTables(body: string): Cell[][][] {
  const blocks: string[][] = []; let cur: string[] = [];
  for (const line of body.split('\n')) {
    if (line.trim() && ((line.match(/\|/g) || []).length >= 2 || line.includes('\t') || /\S\s{2,}\S.*\s{2,}\S/.test(line))) cur.push(line);
    else { if (cur.length >= 3) blocks.push(cur); cur = []; }
  }
  if (cur.length >= 3) blocks.push(cur);
  return blocks.map(b => parseDelimited(b.join('\n')));
}

export function htmlTables(html: string): Cell[][][] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('table')).map(t =>
    Array.from(t.querySelectorAll('tr')).map(tr => Array.from(tr.querySelectorAll('th,td')).map(td => td.textContent?.trim() ?? '')));
}

// ------------------------------------------------------------------ analysis
const nums = (t: Table, c: string) => t.rows.map(r => r[c]).filter((v): v is number => typeof v === 'number');
const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);
const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const uniq = (t: Table, c: string) => new Set(t.rows.map(r => r[c]).filter(v => v != null).map(String)).size;

function labelColumn(t: Table, exclude: string[]): string | undefined {
  const text = t.columns.filter(c => !exclude.includes(c) && t.types[c] === 'text');
  const unique = text.filter(c => uniq(t, c) >= Math.max(2, 0.8 * t.rows.length));
  return unique.find(c => !ID_HINTS.test(c)) ?? unique[0] ?? text[0];
}

function dirSeverity(metric: string, change: number, up: number, down: number): Severity {
  if (LOWER_BETTER.test(metric)) return change > up ? 'warning' : change < down ? 'positive' : 'info';
  if (GOOD_UP.test(metric)) return change > up ? 'positive' : change < down ? 'warning' : 'info';
  return 'info';
}

function targetPairs(numeric: string[], metric?: string): [string, string][] {
  const tgts = numeric.filter(c => TARGET_HINTS.test(c));
  const acts = numeric.filter(c => !tgts.includes(c));
  const words = (c: string) => new Set((c.toLowerCase().replace(new RegExp(TARGET_HINTS.source + '|' + ACTUAL_HINTS.source, 'gi'), ' ').match(/[a-z]+/g) || [])
    .filter(w => !['min', 'inr', 'usd', 'rs', 'no', 'of'].includes(w)));
  const shared = (a: string, b: string) => { const B = words(b); return [...words(a)].filter(w => B.has(w)).length; };
  const pairs: [string, string][] = []; const used = new Set<string>();
  for (const t of tgts) {
    const best = [...acts].sort((a, b) => shared(b, t) - shared(a, t) || +ACTUAL_HINTS.test(b) - +ACTUAL_HINTS.test(a) || +(b === metric) - +(a === metric))[0];
    if (!best || used.has(best)) continue;
    if (!shared(best, t) && !(tgts.length === 1 && (best === metric || ACTUAL_HINTS.test(best)))) continue;
    pairs.push([best, t]); used.add(best);
  }
  return pairs;
}

export function analyze(t: Table): Analysis {
  const numeric = t.columns.filter(c => t.types[c] === 'number' && !ID_HINTS.test(c));
  const dates = t.columns.filter(c => t.types[c] === 'date');
  const dims = t.columns.filter(c => t.types[c] === 'text' && uniq(t, c) >= 2 && uniq(t, c) <= Math.max(2, Math.min(40, t.rows.length > 5 ? Math.floor(t.rows.length * 0.7) : t.rows.length)));
  const hinted = numeric.filter(c => METRIC_HINTS.test(c) && !TARGET_HINTS.test(c));
  const metric = (hinted.length ? hinted : numeric).sort((a, b) => sum(nums(t, b).map(Math.abs)) - sum(nums(t, a).map(Math.abs)))[0];
  const dim = [...dims].sort((a, b) => (+(DIM_HINTS.test(b) && !/status/i.test(b)) - +(DIM_HINTS.test(a) && !/status/i.test(a))) || Math.abs(uniq(t, a) - 6) - Math.abs(uniq(t, b) - 6))[0];
  const dateCol = dates[0];
  const A: Analysis = { table: t, metric, dimension: dim, dateColumn: dateCol, kpis: [], breakdown: [], trend: [], exceptions: [], insights: [] };
  const ins = A.insights;

  // data quality
  const key = (r: Row) => JSON.stringify(t.columns.map(c => (r[c] instanceof Date ? (r[c] as Date).getTime() : r[c])));
  const dups = t.rows.length - new Set(t.rows.map(key)).size;
  if (dups) ins.push({ severity: 'warning', title: `${dups} duplicate row(s)`, detail: 'Identical rows found — they may be double counted.' });

  // KPIs
  for (const c of [metric, ...numeric.filter(c => c !== metric)].filter(Boolean).slice(0, 4) as string[]) {
    const v = nums(t, c); if (!v.length) continue;
    A.kpis.push({ metric: c, headline: AVG_TYPE.test(c) ? 'average' : 'total', total: sum(v), average: sum(v) / v.length, min: Math.min(...v), max: Math.max(...v) });
  }
  if (metric) {
    const v = nums(t, metric);
    ins.push({ severity: 'info', title: `Total ${metric}: ${fmt(sum(v))}`, detail: `Across ${t.rows.length} records; average ${fmt(sum(v) / v.length)} per record.` });
  }

  // breakdown
  if (metric && dim) {
    const g = new Map<string, number>();
    t.rows.forEach(r => { if (r[dim] != null && typeof r[metric] === 'number') g.set(String(r[dim]), (g.get(String(r[dim])) || 0) + (r[metric] as number)); });
    const tot = sum([...g.values()]);
    A.breakdown = [...g.entries()].sort((a, b) => b[1] - a[1]).map(([group, total]) => ({ group, total, share: tot ? (100 * total) / tot : 0 }));
    if (A.breakdown.length >= 2 && tot) {
      const top = A.breakdown[0], low = A.breakdown[A.breakdown.length - 1];
      const conc = top.share >= 50 && A.breakdown.length >= 3;
      ins.push({ severity: conc ? 'warning' : 'info', title: `${top.group} leads ${dim} with ${top.share.toFixed(0)}% of ${metric}`,
        detail: `${top.group}: ${fmt(top.total)} · lowest is ${low.group}: ${fmt(low.total)}.${conc ? ' High concentration on one group.' : ''}` });
    }
  }

  // trend
  if (metric && dateCol) {
    const pts = t.rows.filter(r => r[dateCol] instanceof Date && typeof r[metric] === 'number') as Row[];
    if (pts.length >= 3) {
      const ds = pts.map(r => r[dateCol] as Date);
      const span = (Math.max(...ds.map(d => +d)) - Math.min(...ds.map(d => +d))) / 864e5;
      const monthly = ds.every(d => d.getDate() === 1);
      const unit = monthly || span > 200 ? 'month' : span > 45 ? 'week' : 'day';
      const bucket = (d: Date) => unit === 'month' ? new Date(d.getFullYear(), d.getMonth(), 1)
        : unit === 'week' ? new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)) : new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const m = new Map<number, number>();
      pts.forEach(r => { const k = +bucket(r[dateCol] as Date); m.set(k, (m.get(k) || 0) + (r[metric] as number)); });
      const series = [...m.entries()].sort((a, b) => a[0] - b[0]);
      A.trend = series.map(([k, v]) => ({ period: fmtDate(new Date(k)), value: v }));
      if (series.length >= 2 && series[series.length - 2][1]) {
        const [l, p] = [series[series.length - 1][1], series[series.length - 2][1]];
        const chg = (100 * (l - p)) / Math.abs(p);
        ins.push({ severity: dirSeverity(metric, chg, 5, -10), title: `${metric} ${pct(chg)} vs previous ${unit}`,
          detail: `Latest ${unit} (${fmtDate(new Date(series[series.length - 1][0]))}): ${fmt(l)} vs ${fmt(p)}.` });
      }
    }
  }

  // actual vs target
  for (const [a, tg] of targetPairs(numeric, metric)) {
    const lower = LOWER_BETTER.test(`${a} ${tg}`);
    const perRow = !(dim && dateCol);
    const lbl = labelColumn(t, [a, tg]) ?? dim;
    let view: { item: string; a: number; t: number }[];
    if (perRow) {
      view = t.rows.filter(r => typeof r[a] === 'number' && typeof r[tg] === 'number')
        .map((r, i) => ({ item: lbl ? String(r[lbl]) : `Row ${i + 2}`, a: r[a] as number, t: r[tg] as number }));
    } else {
      const g = new Map<string, { a: number; t: number }>();
      t.rows.forEach(r => { if (typeof r[a] !== 'number' || typeof r[tg] !== 'number') return; const k = String(r[dim!]); const o = g.get(k) || { a: 0, t: 0 }; o.a += r[a] as number; o.t += r[tg] as number; g.set(k, o); });
      view = [...g.entries()].map(([item, o]) => ({ item, ...o }));
    }
    const gap = (v: { a: number; t: number }) => (100 * (v.a - v.t)) / (Math.abs(v.t) || 1);
    const misses = view.filter(v => (lower ? v.a > v.t * 1.001 : v.a < v.t * 0.999)).sort((x, y) => (lower ? gap(y) - gap(x) : gap(x) - gap(y)));
    const overall = (100 * (sum(view.map(v => v.a)) - sum(view.map(v => v.t)))) / (Math.abs(sum(view.map(v => v.t))) || 1);
    const unit = perRow ? 'records' : `by ${dim}`;
    if (misses.length) {
      ins.push({ severity: misses.length / view.length >= 0.3 ? 'critical' : 'warning',
        title: `${misses.length} of ${view.length} ${unit} ${lower ? 'exceeded' : 'missed'} ${tg}`,
        detail: `${a} vs ${tg} — overall ${pct(overall)}. Worst: ${misses.slice(0, 4).map(v => `${v.item} (${pct(gap(v))})`).join(', ')}.` });
      misses.slice(0, 8).forEach(v => A.exceptions.push({ type: `${a} vs ${tg}`, item: v.item, value: v.a, expected: v.t }));
    } else ins.push({ severity: 'positive', title: `All ${view.length} ${unit} on target for ${tg}`, detail: `${a} vs ${tg}: overall ${pct(overall)}.` });
  }

  // ageing
  const age = numeric.find(c => /days? (outstanding|overdue|open|pending)|ageing|aging|dpd|overdue days/i.test(c));
  if (age) {
    const o60 = t.rows.filter(r => (r[age] as number) > 60), o90 = t.rows.filter(r => (r[age] as number) > 90);
    if (o60.length) {
      const money = metric && metric !== age ? metric : undefined;
      const amt = money ? ` worth ${fmt(sum(o60.map(r => (r[money] as number) || 0)))} (${((100 * sum(o60.map(r => (r[money] as number) || 0))) / (sum(nums(t, money)) || 1)).toFixed(0)}% of total)` : '';
      ins.push({ severity: o90.length ? 'critical' : 'warning', title: `${o60.length} item(s) older than 60 days${amt}`,
        detail: `${o90.length} are beyond 90 days. Average age is ${(sum(nums(t, age)) / nums(t, age).length).toFixed(0)} days.` });
    }
  }

  // status exceptions
  const sc = t.columns.find(c => /status|state|stage|flag|priority|remark/i.test(c) && t.types[c] === 'text');
  if (sc) {
    const bad = t.rows.filter(r => BAD_STATUS.test(String(r[sc] ?? '')));
    if (bad.length) {
      const counts = new Map<string, number>(); bad.forEach(r => counts.set(String(r[sc]), (counts.get(String(r[sc])) || 0) + 1));
      const lbl = labelColumn(t, [sc]) ?? dim;
      ins.push({ severity: bad.length / t.rows.length >= 0.25 ? 'critical' : 'warning', title: `${bad.length} of ${t.rows.length} records need action ('${sc}')`,
        detail: [...counts.entries()].map(([k, v]) => `${k}: ${v}`).join(', ') + (metric ? ` · value ${fmt(sum(bad.map(r => (r[metric] as number) || 0)))}` : '') + '.' });
      bad.slice(0, 8).forEach((r, i) => A.exceptions.push({ type: `${sc}: ${r[sc]}`, item: lbl ? String(r[lbl]) : `Row ${i + 2}`, value: metric ? (r[metric] as number) : null, expected: null }));
    }
  }

  // outliers (robust z-score, within group when there is enough data per group)
  if (metric && nums(t, metric).length >= 6) {
    const groups = new Map<string, number[]>();
    const byGroup = dim && [...new Set(t.rows.map(r => String(r[dim])))].every(g => t.rows.filter(r => String(r[dim]) === g).length >= 8);
    t.rows.forEach(r => { if (typeof r[metric] === 'number') { const k = byGroup ? String(r[dim!]) : '_'; groups.set(k, [...(groups.get(k) || []), r[metric] as number]); } });
    const stats = new Map([...groups.entries()].map(([k, v]) => { const m = median(v); return [k, { m, mad: median(v.map(x => Math.abs(x - m))) }]; }));
    const lbl = labelColumn(t, [metric]) ?? dim;
    const out = t.rows.filter(r => typeof r[metric] === 'number').map(r => {
      const s = stats.get(byGroup ? String(r[dim!]) : '_')!; const z = s.mad ? (0.6745 * ((r[metric] as number) - s.m)) / s.mad : 0;
      return { r, z, typical: s.m };
    }).filter(x => Math.abs(x.z) > 3.5).sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
    if (out.length) {
      const name = (r: Row) => [dim && lbl !== dim ? r[dim] : null, lbl ? r[lbl] : null].filter(Boolean).join(' · ') + (dateCol && r[dateCol] instanceof Date ? ` on ${fmtDate(r[dateCol] as Date)}` : '');
      out.slice(0, 5).forEach(o => A.exceptions.push({ type: `Outlier (${o.z > 0 ? 'high' : 'low'})`, item: name(o.r), value: o.r[metric] as number, expected: o.typical }));
      ins.push({ severity: 'warning', title: `${out.length} unusual ${metric} value(s)`,
        detail: `${name(out[0].r)}: ${fmt(out[0].r[metric] as number)} vs a typical ${fmt(out[0].typical)} — possible data-entry error or one-off event.` });
    }
  }
  const order: Record<Severity, number> = { critical: 0, warning: 1, positive: 2, info: 3 };
  A.insights.sort((x, y) => order[x.severity] - order[y.severity]);
  return A;
}

const CATEGORY_RULES: [string, RegExp][] = [
  ['Escalation', /escalat|complain|urgent|critical|breach|issue|problem/i],
  ['Invoice / Finance', /invoice|payment|remittance|statement|billing|receivable|payable|credit note|\bpo\b|aging|ageing/i],
  ['Operations Report', /report|mis|dashboard|summary|daily|weekly|monthly|eod|shift|productivity|kpi|sla|stock/i],
  ['Order / Request', /order|request|quote|rfq|enquiry|inquiry/i],
];

export function triage(subject: string, body: string, analyses: Analysis[]): Triage {
  const text = `${subject}\n${body.slice(0, 3000)}`;
  const category = CATEGORY_RULES.find(([, rx]) => rx.test(text))?.[0] ?? 'General';
  let score = 0; const reasons: string[] = [];
  if (/\burgent\b|asap|immediately|escalat|critical|breach/i.test(text)) { score += 2; reasons.push('urgent wording in email'); }
  const crit = analyses.flatMap(a => a.insights).filter(i => i.severity === 'critical').length;
  const warn = analyses.flatMap(a => a.insights).filter(i => i.severity === 'warning').length;
  if (crit) { score += crit >= 2 ? 2 : 1; reasons.push(`${crit} critical finding(s) in data`); }
  if (warn >= 2) { score += 1; reasons.push(`${warn} warnings in data`); }
  return { category, priority: score >= 2 ? 'High' : score === 1 ? 'Medium' : 'Low', reasons };
}
