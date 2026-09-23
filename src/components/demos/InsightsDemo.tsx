import React, { useMemo, useRef, useState } from 'react';
import { Sparkles, Send, Upload, RotateCcw, ArrowRight, MessageSquareText, Bot } from 'lucide-react';
import { normalize, Table, Row } from '../../lib/emailInsights';
import { Bars, Card, InsightList, Label, LineChart, MiniTable, Note, readGrid, Severity, SmallButton } from './kit';

// ---------------- sample: 6 months × 4 regions × 4 product lines
const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const REGIONS = ['North', 'South', 'East', 'West'];
const PRODUCTS = ['Electronics', 'Home Care', 'Personal Care', 'Packaged Foods'];
function sample(): Table {
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const grid: (string | number | Date)[][] = [['Month', 'Region', 'Product Line', 'Revenue', 'Target', 'Cost', 'Discount', 'Returns', 'Orders']];
  MONTHS.forEach((m, mi) => REGIONS.forEach((r, ri) => PRODUCTS.forEach((p, pi) => {
    let rev = [900, 520, 610, 780][pi] * 1000 * [1.1, 0.9, 0.8, 1.2][ri] * (1 + 0.02 * mi) * (0.93 + rnd() * 0.14);
    if (r === 'West' && p === 'Electronics' && mi === 5) rev *= 0.58;          // story: West electronics collapse in Sep
    const target = Math.round([900, 520, 610, 780][pi] * 1000 * [1.1, 0.9, 0.8, 1.2][ri] * (1 + 0.025 * mi));
    const disc = rev * (r === 'South' ? 0.11 + rnd() * 0.03 : 0.04 + rnd() * 0.02);  // story: South discount leakage
    const ret = rev * (r === 'East' && mi === 4 ? 0.09 : 0.015 + rnd() * 0.01);       // story: East returns spike in Aug
    grid.push([new Date(2026, 3 + mi, 1), r, p, Math.round(rev), target, Math.round(rev * (0.62 + rnd() * 0.06)), Math.round(disc), Math.round(ret), Math.round(rev / (1800 + rnd() * 400))]);
  })));
  return normalize(grid, 'Sales_Apr-Sep_2026.xlsx', 'attachment')!;
}
const SAMPLE = sample();

// ---------------- tiny query engine over any table
const plural = (d: string) => { const w = d.toLowerCase(); return /s$/.test(w) ? w : w.endsWith('y') ? w.slice(0, -1) + 'ies' : w + 's'; };
const inr = (x: number) => { const a = Math.abs(x), g = x < 0 ? '-' : ''; return a >= 1e7 ? `${g}₹${(a / 1e7).toFixed(2)} Cr` : a >= 1e5 ? `${g}₹${(a / 1e5).toFixed(1)} L` : `${g}₹${Math.round(a).toLocaleString('en-IN')}`; };
const pct = (x: number) => `${x >= 0 ? '+' : ''}${x.toFixed(1)}%`;
interface Answer { q: string; text: string; bullets?: string[]; bars?: { label: string; value: number; flag?: boolean }[]; line?: { labels: string[]; values: number[]; target?: number[] }; table?: { head: string[]; rows: string[][] } }

function schema(t: Table) {
  const metrics = t.columns.filter(c => t.types[c] === 'number' && !/id|no\b|code|sku/i.test(c));
  const time = t.columns.find(c => t.types[c] === 'date');
  const dims = t.columns.filter(c => t.types[c] === 'text' && new Set(t.rows.map(r => r[c])).size <= 40);
  const main = metrics.find(m => /revenue|sales|amount|value/i.test(m)) ?? metrics[0];
  const target = metrics.find(m => /target|budget|plan/i.test(m));
  const cost = metrics.find(m => /cost|cogs|expense/i.test(m));
  const values = new Map<string, { dim: string; value: string }>();
  dims.forEach(d => t.rows.forEach(r => r[d] != null && values.set(String(r[d]).toLowerCase(), { dim: d, value: String(r[d]) })));
  return { metrics, time, dims, main, target, cost, values };
}
type S = ReturnType<typeof schema>;
const sum = (rows: Row[], c: string) => rows.reduce((s, r) => s + ((r[c] as number) || 0), 0);
const periodKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const periodLabel = (k: string) => new Date(+k.slice(0, 4), +k.slice(5) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
function groupBy(rows: Row[], dim: string, m: string) {
  const g = new Map<string, number>();
  rows.forEach(r => g.set(String(r[dim]), (g.get(String(r[dim])) || 0) + ((r[m] as number) || 0)));
  return [...g.entries()].map(([label, value]) => ({ label, value }));
}
function periods(t: Table, s: S, rows: Row[]) {
  if (!s.time) return [];
  return [...new Set(rows.map(r => r[s.time!] instanceof Date ? periodKey(r[s.time!] as Date) : ''))].filter(Boolean).sort();
}
const inPeriod = (s: S, k: string) => (r: Row) => r[s.time!] instanceof Date && periodKey(r[s.time!] as Date) === k;

function metricFor(q: string, s: S): string {
  const words = q.toLowerCase();
  if (/margin|profit/.test(words) && s.cost) return '__margin';
  const hit = s.metrics.find(m => m.toLowerCase().split(/[^a-z]+/).some(w => w.length > 2 && words.includes(w)));
  if (hit) return hit;
  if (/sales|revenue|turnover|business/.test(words)) return s.main;
  return s.main;
}
const val = (s: S, m: string) => (r: Row) => m === '__margin' ? ((r[s.main] as number) || 0) - ((r[s.cost!] as number) || 0) : ((r[m] as number) || 0);
const mName = (s: S, m: string) => (m === '__margin' ? 'Gross margin' : m);

export function ask(q: string, t: Table): Answer {
  const s = schema(t); const ql = q.toLowerCase();
  const m = metricFor(q, s); const v = val(s, m); const M = mName(s, m);
  const filters = [...s.values.entries()].filter(([k]) => k.length > 2 && new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(ql)).map(([, x]) => x);
  let rows = t.rows.filter(r => filters.every(f => String(r[f.dim]) === f.value));
  const fText = filters.length ? ` for ${filters.map(f => f.value).join(', ')}` : '';
  const dim = s.dims.find(d => ql.includes(d.toLowerCase()) || d.toLowerCase().split(/\s+/).some(w => w.length > 3 && ql.includes(w)))
    ?? s.dims.find(d => !filters.some(f => f.dim === d)) ?? s.dims[0];
  const total = rows.reduce((a, r) => a + v(r), 0);
  const ps = periods(t, s, rows);
  const n = +(ql.match(/\b(top|bottom|best|worst)\s+(\d+)/)?.[2] ?? 5);
  const G = (rs: Row[], d: string) => { const g = new Map<string, number>(); rs.forEach(r => g.set(String(r[d]), (g.get(String(r[d])) || 0) + v(r))); return [...g.entries()].map(([label, value]) => ({ label, value })); };

  // why / root cause of change
  if (/why|reason|root cause|driv|explain|drop|fell|fall|declin|down|increase|grew|jump/.test(ql) && ps.length >= 2) {
    const [p0, p1] = [ps[ps.length - 2], ps[ps.length - 1]];
    const a = rows.filter(inPeriod(s, p0)), b = rows.filter(inPeriod(s, p1));
    const A = a.reduce((x, r) => x + v(r), 0), B = b.reduce((x, r) => x + v(r), 0);
    const contrib: { label: string; value: number }[] = [];
    s.dims.filter(d => !filters.some(f => f.dim === d)).forEach(d => {
      const ga = new Map(G(a, d).map(x => [x.label, x.value])), gb = G(b, d);
      gb.forEach(x => contrib.push({ label: `${d}: ${x.label}`, value: x.value - (ga.get(x.label) || 0) }));
    });
    // also the combination of two dims (e.g. West × Electronics)
    if (s.dims.length >= 2) {
      const [d1, d2] = s.dims.filter(d => !filters.some(f => f.dim === d)).slice(0, 2);
      if (d1 && d2) {
        const key = (r: Row) => `${r[d1]} × ${r[d2]}`; const ga = new Map<string, number>(), gb = new Map<string, number>();
        a.forEach(r => ga.set(key(r), (ga.get(key(r)) || 0) + v(r))); b.forEach(r => gb.set(key(r), (gb.get(key(r)) || 0) + v(r)));
        gb.forEach((x, k) => contrib.push({ label: k, value: x - (ga.get(k) || 0) }));
      }
    }
    const chg = B - A; const dir = chg < 0 ? 1 : -1;
    const top = contrib.sort((x, y) => dir * (x.value - y.value)).slice(0, 5);
    return { q, text: `${M}${fText} went from ${inr(A)} in ${periodLabel(p0)} to ${inr(B)} in ${periodLabel(p1)} (${pct((100 * chg) / (Math.abs(A) || 1))}). The biggest ${chg < 0 ? 'drags' : 'contributors'} were:`,
      bars: top.map(x => ({ label: x.label, value: x.value, flag: x.value < 0 })),
      bullets: [`${top[0].label} alone explains ${Math.min(100, Math.abs((100 * top[0].value) / (chg || 1))).toFixed(0)}% of the change — start there.`] };
  }
  // trend
  if (/trend|over time|month|monthly|each month|history|by period/.test(ql) && ps.length >= 2) {
    const vals = ps.map(p => rows.filter(inPeriod(s, p)).reduce((a, r) => a + v(r), 0));
    const tv = s.target && m === s.main ? ps.map(p => sum(rows.filter(inPeriod(s, p)), s.target!)) : undefined;
    const g = (100 * (vals[vals.length - 1] - vals[0])) / (Math.abs(vals[0]) || 1);
    return { q, text: `${M}${fText} by month: ${pct(g)} from ${periodLabel(ps[0])} to ${periodLabel(ps[ps.length - 1])}. Latest month ${inr(vals[vals.length - 1])}${tv ? ` vs target ${inr(tv[tv.length - 1])}` : ''}.`,
      line: { labels: ps.map(periodLabel), values: vals, target: tv } };
  }
  // target misses
  if (/target|budget|plan|miss|behind|short/.test(ql) && s.target) {
    const latest = ps.length ? rows.filter(inPeriod(s, ps[ps.length - 1])) : rows;
    const g = new Map<string, { a: number; t: number }>();
    latest.forEach(r => { const k = String(r[dim]); const o = g.get(k) || { a: 0, t: 0 }; o.a += (r[s.main] as number) || 0; o.t += (r[s.target!] as number) || 0; g.set(k, o); });
    const list = [...g.entries()].map(([k, o]) => ({ k, gap: (100 * (o.a - o.t)) / (o.t || 1), a: o.a, t: o.t })).sort((x, y) => x.gap - y.gap);
    const miss = list.filter(x => x.gap < 0);
    return { q, text: miss.length ? `${miss.length} of ${list.length} ${plural(dim)} are below target${ps.length ? ` in ${periodLabel(ps[ps.length - 1])}` : ''}${fText}.` : `Every ${dim} is on or above target${fText}.`,
      table: { head: [dim, s.main, s.target, 'Gap'], rows: list.map(x => [x.k, inr(x.a), inr(x.t), pct(x.gap)]) } };
  }
  // anomalies
  if (/anomal|unusual|outlier|strange|spike|odd|exception/.test(ql)) {
    const others = s.metrics.filter(x => x !== s.target);
    const found: string[] = [];
    others.forEach(c => {
      const xs = rows.map(r => (r[c] as number) || 0); const mean = xs.reduce((a, x) => a + x, 0) / xs.length;
      const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length) || 1;
      rows.forEach(r => { const z = (((r[c] as number) || 0) - mean) / sd; if (Math.abs(z) > 2.8) found.push(`${c} ${z > 0 ? 'high' : 'low'}: ${s.dims.map(d => r[d]).join(' · ')}${s.time && r[s.time] instanceof Date ? ` · ${periodLabel(periodKey(r[s.time] as Date))}` : ''} = ${inr(r[c] as number)}`); });
    });
    // ratio outliers: returns / discount as % of revenue
    ['return', 'discount'].forEach(w => {
      const c = s.metrics.find(x => x.toLowerCase().includes(w)); if (!c || !s.main) return;
      const ratios = rows.map(r => ((r[c] as number) || 0) / ((r[s.main] as number) || 1)).sort((x, y) => x - y);
      const med = ratios[ratios.length >> 1] || 0;
      rows.forEach(r => { const ratio = ((r[c] as number) || 0) / ((r[s.main] as number) || 1); if (ratio > Math.max(0.05, 2.5 * med)) found.push(`${c} at ${(100 * ratio).toFixed(1)}% of revenue: ${s.dims.map(d => r[d]).join(' · ')}${s.time && r[s.time] instanceof Date ? ` · ${periodLabel(periodKey(r[s.time] as Date))}` : ''}`); });
    });
    const uniq = [...new Set(found)];
    return { q, text: uniq.length ? `Found ${uniq.length} unusual data points${fText}:` : `No unusual values found${fText}.`, bullets: uniq.slice(0, 8) };
  }
  // leakage / margin
  if (/leak|margin|profit|discount/.test(ql) && s.main) {
    const disc = s.metrics.find(x => /discount/i.test(x)), ret = s.metrics.find(x => /return/i.test(x));
    const g = new Map<string, { rev: number; loss: number; cost: number }>();
    rows.forEach(r => { const k = String(r[dim]); const o = g.get(k) || { rev: 0, loss: 0, cost: 0 }; o.rev += (r[s.main] as number) || 0; o.loss += ((disc ? r[disc] : 0) as number || 0) + ((ret ? r[ret] : 0) as number || 0); o.cost += s.cost ? (r[s.cost] as number) || 0 : 0; g.set(k, o); });
    const list = [...g.entries()].map(([k, o]) => ({ k, leak: (100 * o.loss) / (o.rev || 1), margin: s.cost ? (100 * (o.rev - o.cost - o.loss)) / (o.rev || 1) : NaN, loss: o.loss })).sort((x, y) => y.leak - x.leak);
    return { q, text: `Revenue leakage (discounts${ret ? ' + returns' : ''}) by ${dim}${fText}. ${list[0].k} leaks the most at ${list[0].leak.toFixed(1)}% of revenue (${inr(list[0].loss)}).`,
      table: { head: [dim, 'Leakage %', 'Leakage ₹', ...(s.cost ? ['Net margin %'] : [])], rows: list.map(x => [x.k, `${x.leak.toFixed(1)}%`, inr(x.loss), ...(s.cost ? [`${x.margin.toFixed(1)}%`] : [])]) } };
  }
  // compare
  const cmp = ql.match(/compare\s+(.+?)\s+(?:vs\.?|versus|and|with)\s+(.+?)(?:\?|$| on | in | by )/);
  if (cmp || / vs\.? | versus /.test(ql)) {
    const hits = filters.slice(0, 2);
    if (hits.length === 2 && hits[0].dim === hits[1].dim) {
      const r2 = t.rows.filter(r => filters.slice(2).every(f => String(r[f.dim]) === f.value));
      const x = r2.filter(r => String(r[hits[0].dim]) === hits[0].value).reduce((a, r) => a + v(r), 0);
      const y = r2.filter(r => String(r[hits[1].dim]) === hits[1].value).reduce((a, r) => a + v(r), 0);
      return { q, text: `${hits[0].value}: ${inr(x)} vs ${hits[1].value}: ${inr(y)} — ${hits[0].value} is ${pct((100 * (x - y)) / (Math.abs(y) || 1))} ${x >= y ? 'higher' : 'lower'} on ${M}.`,
        bars: [{ label: hits[0].value, value: x }, { label: hits[1].value, value: y }] };
    }
  }
  // ranking / breakdown (default)
  const g = G(rows, dim).sort((a, b) => (/bottom|worst|lowest|least|weakest/.test(ql) ? a.value - b.value : b.value - a.value));
  const shown = /top|bottom|best|worst|highest|lowest/.test(ql) ? g.slice(0, n) : g.slice(0, 10);
  return { q, text: `${M}${fText}: total ${inr(total)}. ${/bottom|worst|lowest|least/.test(ql) ? 'Lowest' : 'Highest'} ${dim}: ${shown[0]?.label} (${inr(shown[0]?.value ?? 0)}, ${((100 * (shown[0]?.value ?? 0)) / (total || 1)).toFixed(0)}% of total).`,
    bars: shown };
}

function brief(t: Table): { severity: Severity; title: string; detail: string }[] {
  const out: { severity: Severity; title: string; detail: string }[] = [];
  const why = ask('why did revenue change last month', t);
  if (why.bars?.length) out.push({ severity: why.text.includes('+') ? 'positive' : 'critical', title: why.text.split('. ')[0].replace(/:$/, ''), detail: `Main driver: ${why.bars[0].label} (${inr(why.bars[0].value)}).` });
  const tgt = ask('which region missed target', t);
  if (tgt.table && /below target/.test(tgt.text)) out.push({ severity: 'warning', title: tgt.text, detail: tgt.table.rows.filter(r => r[3].startsWith('-')).map(r => `${r[0]} ${r[3]}`).join(' · ') });
  const leak = ask('discount leakage by region', t);
  if (leak.table) out.push({ severity: 'warning', title: leak.text.split('. ')[1] ?? leak.text, detail: 'Discounts and returns compared with revenue — well above the other regions.' });
  const an = ask('any anomalies', t);
  if (an.bullets?.length) out.push({ severity: 'info', title: `${an.bullets.length} unusual data points detected`, detail: an.bullets.slice(0, 2).join(' · ') });
  return out;
}

const SUGGESTED = ['Why did revenue drop last month?', 'Which region missed target?', 'Show revenue trend by month', 'Top 3 product lines by revenue',
  'Where is discount leakage highest?', 'Any anomalies?', 'Compare North vs South', 'Why did West fall?'];

export const InsightsDemo: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const [table, setTable] = useState<Table>(SAMPLE);
  const [q, setQ] = useState('');
  const [thread, setThread] = useState<Answer[]>([]);
  const [thinking, setThinking] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const exec = useMemo(() => brief(table), [table]);
  const isSample = table === SAMPLE;
  const sch = useMemo(() => schema(table), [table]);

  const submit = async (text: string) => {
    if (!text.trim() || thinking) return;
    setQ(''); setThinking(true); await new Promise(r => setTimeout(r, 650));
    try { setThread(t => [...t, ask(text, table)]); } catch { setThread(t => [...t, { q: text, text: "I couldn't answer that from this data. Try naming a column, e.g. “total Revenue by Region”." }]); }
    setThinking(false); setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
  };
  const onFile = async (f?: File) => {
    if (!f) return; setErr('');
    try { const g = await readGrid(f); const t = normalize(g.grid, g.name, 'upload'); if (!t) throw new Error('No table found in that file.'); setTable(t); setThread([]); }
    catch (e) { setErr((e as Error).message); }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-4 min-w-0">
        <Card className="!p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Sparkles className="w-4 h-4 text-teal-600" /> Executive brief</div>
            <span className="text-[10px] font-mono text-slate-400 truncate">{table.name} · {table.rows.length} rows</span>
          </div>
          <InsightList items={exec.length ? exec : [{ severity: 'info', title: 'Ask a question to explore this data', detail: `Columns: ${table.columns.join(', ')}` }]} />
          <div className="flex gap-2">
            <SmallButton icon={Upload} onClick={() => fileRef.current?.click()} className="!text-xs !py-2">Analyse my file</SmallButton>
            {!isSample && <SmallButton icon={RotateCcw} onClick={() => { setTable(SAMPLE); setThread([]); }} className="!text-xs !py-2">Sample data</SmallButton>}
          </div>
          <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.csv,.tsv" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          {err && <p className="text-xs text-red-600">{err}</p>}
          <Note>Sample: monthly sales by region and product line (revenue, target, cost, discounts, returns). Your file stays in your browser.</Note>
        </Card>
      </div>

      <div className="lg:col-span-7 min-w-0">
        <Card className="!p-0 overflow-hidden flex flex-col h-[620px]">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-900 bg-slate-50">
            <MessageSquareText className="w-4 h-4 text-teal-600" /> Ask your data <span className="ml-auto text-[10px] font-mono font-normal text-slate-400">metric: {sch.main} · dims: {sch.dims.join(', ')}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!thread.length && (
              <div className="text-center py-6 space-y-3">
                <Bot className="w-8 h-8 mx-auto text-teal-600" />
                <p className="text-sm text-slate-600">Ask a business question in plain English. Try one of these:</p>
              </div>
            )}
            {thread.map((a, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-br-md bg-slate-900 text-white text-sm px-3.5 py-2">{a.q}</div></div>
                <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 space-y-3">
                  <p className="text-sm text-slate-800">{a.text}</p>
                  {a.bars && <Bars rows={a.bars} format={inr} />}
                  {a.line && <LineChart labels={a.line.labels} format={inr} series={[{ name: 'Actual', values: a.line.values }, ...(a.line.target ? [{ name: 'Target', values: a.line.target, dashed: true }] : [])]} />}
                  {a.table && <MiniTable head={a.table.head} rows={a.table.rows} align={a.table.head.map((_, j) => (j ? 'r' : 'l'))} max={10} />}
                  {a.bullets && <ul className="text-xs text-slate-700 list-disc pl-4 space-y-1">{a.bullets.map((b, j) => <li key={j}>{b}</li>)}</ul>}
                </div>
              </div>
            ))}
            {thinking && <div className="text-xs text-slate-500 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 animate-pulse text-teal-600" /> Analysing {table.rows.length} rows…</div>}
            <div ref={endRef} />
          </div>
          <div className="border-t border-slate-200 p-3 space-y-2 bg-white">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(isSample ? SUGGESTED : [`Total ${sch.main} by ${sch.dims[0] ?? ''}`, `Show ${sch.main} trend by month`, 'Any anomalies?', `Top 3 ${sch.dims[0] ?? ''}`, 'Why did it drop last month?']).map(s => (
                <button key={s} onClick={() => submit(s)} className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100">{s}</button>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); submit(q); }} className="flex gap-2">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="e.g. Why did West revenue fall in September?"
                className="flex-1 px-3.5 py-2.5 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-teal-500" />
              <button className="px-4 rounded-full bg-slate-900 text-white hover:bg-slate-800" aria-label="Ask"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        </Card>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Note>This demo answers with a built-in query engine running in your browser. The production version adds an LLM grounded on your own systems.</Note>
          <SmallButton tone="dark" onClick={onOpenConsultation} className="!text-xs">Get insights on my data <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
        </div>
      </div>
    </div>
  );
};
