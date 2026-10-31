// Shared building blocks for the capability demos.
import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, TrendingUp } from 'lucide-react';

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export type Severity = 'critical' | 'warning' | 'positive' | 'info';
export type StageState = 'idle' | 'running' | 'done';
export interface StageDef { title: string; icon: React.ElementType }
export interface Stage extends StageDef { detail: string; state: StageState }

export const inr = (x: number | null | undefined) => {
  if (x == null || !isFinite(x)) return '–';
  const a = Math.abs(x), sign = x < 0 ? '-' : '';
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toFixed(2)} Cr`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(2)} L`;
  return `${sign}₹${Math.round(a).toLocaleString('en-IN')}`;
};
export const num = (x: number | null | undefined, d = 0) =>
  x == null || !isFinite(x) ? '–' : x.toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });

/** Pipeline stages with running/done state. */
export function useStages(defs: StageDef[]) {
  const init = () => defs.map(d => ({ ...d, detail: 'Waiting', state: 'idle' as StageState }));
  const [stages, setStages] = useState<Stage[]>(init);
  const set = (i: number, state: StageState, detail: string) =>
    setStages(p => p.map((s, j) => (j === i ? { ...s, state, detail } : s)));
  /** run(i, runningText, work) → marks running, waits, runs work, marks done with its returned text */
  const step = async (i: number, running: string, work: () => string | Promise<string>, ms = 650) => {
    set(i, 'running', running);
    await sleep(ms);
    set(i, 'done', await work());
  };
  return { stages, set, step, reset: () => setStages(init()) };
}

export const Stepper: React.FC<{ stages: Stage[] }> = ({ stages }) => (
  <div className={`grid grid-cols-1 gap-2 ${stages.length === 6 ? 'sm:grid-cols-3 xl:grid-cols-6' : stages.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-5'}`}>
    {stages.map((s, i) => {
      const Icon = s.icon;
      return (
        <div key={i} className={`rounded-2xl border p-3 transition-all ${s.state === 'done' ? 'bg-teal-50/60 border-teal-200' : s.state === 'running' ? 'bg-white border-slate-900 shadow-md' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${s.state === 'done' ? 'bg-teal-600 text-white' : s.state === 'running' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
              {s.state === 'running' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : s.state === 'done' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
            </div>
            <span className="text-[10px] font-mono text-slate-400">0{i + 1}</span>
          </div>
          <div className="text-xs font-bold text-slate-900 mt-2 leading-tight">{s.title}</div>
          <div className="text-[11px] text-slate-600 mt-1 leading-snug">{s.detail}</div>
        </div>
      );
    })}
  </div>
);

const sev: Record<Severity, { box: string; text: string; icon: React.ElementType }> = {
  critical: { box: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertTriangle },
  warning: { box: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  positive: { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: TrendingUp },
  info: { box: 'bg-sky-50 border-sky-200', text: 'text-sky-700', icon: Info },
};

export const InsightList: React.FC<{ items: { severity: Severity; title: string; detail: string }[] }> = ({ items }) => (
  <ul className="space-y-2">
    {items.map((ins, i) => {
      const st = sev[ins.severity]; const Icon = st.icon;
      return (
        <li key={i} className={`flex gap-3 rounded-2xl border px-3.5 py-2.5 ${st.box}`}>
          <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.text}`} />
          <div className="min-w-0"><div className={`text-sm font-bold ${st.text}`}>{ins.title}</div><div className="text-xs text-slate-700">{ins.detail}</div></div>
        </li>
      );
    })}
  </ul>
);

export const Kpis: React.FC<{ items: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' | 'neutral' }[] }> = ({ items }) => (
  <div className={`grid grid-cols-2 gap-3 ${items.length >= 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
    {items.map(k => (
      <div key={k.label} className="rounded-2xl border border-slate-200 p-3 bg-white">
        <div className="text-[11px] text-slate-500 truncate">{k.label}</div>
        <div className="text-xl font-extrabold text-slate-900">{k.value}</div>
        {k.sub && <div className={`text-[11px] font-mono ${k.tone === 'good' ? 'text-emerald-600' : k.tone === 'bad' ? 'text-red-600' : 'text-slate-400'}`}>{k.sub}</div>}
      </div>
    ))}
  </div>
);

export const Bars: React.FC<{ rows: { label: string; value: number; flag?: boolean }[]; format?: (v: number) => string; title?: string }> = ({ rows, format = v => num(v), title }) => {
  const max = Math.max(1, ...rows.map(r => Math.abs(r.value)));
  return (
    <div>
      {title && <Label>{title}</Label>}
      <div className="space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="grid grid-cols-[minmax(90px,170px)_1fr_72px] items-center gap-2 text-xs">
            <span className="truncate text-slate-700">{r.label}</span>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${r.flag ? 'bg-red-400' : 'bg-gradient-to-r from-blue-600 to-emerald-500'}`} style={{ width: `${Math.max(3, (100 * Math.abs(r.value)) / max)}%` }} />
            </div>
            <span className="text-right font-mono text-slate-500">{format(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Minimal SVG line chart with optional second series (dashed). */
export const LineChart: React.FC<{ labels: string[]; series: { name: string; values: number[]; dashed?: boolean; color?: string }[]; height?: number; format?: (v: number) => string }> =
  ({ labels, series, height = 160, format = v => num(v) }) => {
    const w = 560, h = height, p = 28;
    const all = series.flatMap(s => s.values);
    const mx = Math.max(...all), mn = Math.min(0, ...all);
    const X = (i: number) => p + (i * (w - 2 * p)) / Math.max(1, labels.length - 1);
    const Y = (v: number) => h - p - ((v - mn) / (mx - mn || 1)) * (h - 2 * p);
    return (
      <div>
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img">
          {[0, 0.5, 1].map(f => <line key={f} x1={p} x2={w - p} y1={Y(mn + f * (mx - mn))} y2={Y(mn + f * (mx - mn))} stroke="#e2e8f0" strokeWidth="1" />)}
          {series.map((s, si) => (
            <g key={s.name}>
              <path d={s.values.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')} fill="none"
                stroke={s.color ?? (si ? '#94a3b8' : '#0d9488')} strokeWidth={si ? 1.8 : 2.5} strokeDasharray={s.dashed ? '5 4' : undefined} />
              {!s.dashed && s.values.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.6" fill={s.color ?? '#0d9488'}><title>{`${labels[i]}: ${format(v)}`}</title></circle>)}
            </g>
          ))}
          <text x={p} y={h - 6} fontSize="10" fill="#94a3b8">{labels[0]}</text>
          <text x={w - p} y={h - 6} fontSize="10" fill="#94a3b8" textAnchor="end">{labels[labels.length - 1]}</text>
          <text x={p} y={12} fontSize="10" fill="#94a3b8">{format(mx)}</text>
        </svg>
        <div className="flex gap-4 text-[11px] text-slate-500 mt-1">
          {series.map((s, si) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2" style={{ borderColor: s.color ?? (si ? '#94a3b8' : '#0d9488'), borderStyle: s.dashed ? 'dashed' : 'solid' }} />{s.name}
            </span>
          ))}
        </div>
      </div>
    );
  };

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">{children}</div>
);

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`rounded-3xl border border-slate-200 bg-white shadow-xs p-5 ${className}`}>{children}</div>
);

export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; icon?: React.ElementType }> = ({ busy, icon: Icon, children, className = '', ...rest }) => (
  <button {...rest} disabled={busy || rest.disabled}
    className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm rounded-full shadow-lg shadow-slate-200 transition-colors ${className}`}>
    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : Icon ? <Icon className="w-4 h-4 text-teal-400" /> : null}
    <span>{children}</span>
  </button>
);

export const SmallButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: 'teal' | 'dark' | 'ghost'; icon?: React.ElementType }> = ({ tone = 'ghost', icon: Icon, children, className = '', ...rest }) => (
  <button {...rest} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
    tone === 'teal' ? 'bg-teal-600 hover:bg-teal-500 text-white' : tone === 'dark' ? 'bg-slate-900 hover:bg-slate-800 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-700'} ${className}`}>
    {Icon && <Icon className="w-4 h-4" />}{children}
  </button>
);

export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] text-slate-500 leading-relaxed">{children}</p>
);

/** Table with a max row count. */
export const MiniTable: React.FC<{ head: string[]; rows: (React.ReactNode)[][]; max?: number; align?: ('l' | 'r')[] }> = ({ head, rows, max = 8, align }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs">
      <thead><tr className="text-left text-slate-500 border-b border-slate-200">{head.map((h, i) => <th key={i} className={`py-1.5 pr-3 font-semibold whitespace-nowrap ${align?.[i] === 'r' ? 'text-right' : ''}`}>{h}</th>)}</tr></thead>
      <tbody>{rows.slice(0, max).map((r, i) => <tr key={i} className="border-b border-slate-100">{r.map((c, j) => <td key={j} className={`py-1.5 pr-3 text-slate-700 ${align?.[j] === 'r' ? 'text-right font-mono' : ''}`}>{c}</td>)}</tr>)}</tbody>
    </table>
    {rows.length > max && <div className="text-[11px] text-slate-400 mt-1">+ {rows.length - max} more in the download</div>}
  </div>
);

export type XCell = string | number | Date | null | undefined;
/** Download a multi-sheet Excel file (library is loaded only when needed). */
export async function downloadXlsx(fileName: string, sheets: { name: string; header: string[]; rows: XCell[][] }[]) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const head = (cols: string[]) => cols.map(c => ({ value: c, fontWeight: 'bold' as const, backgroundColor: '#11141A', color: '#FFFFFF' }));
  const cell = (v: XCell) => (v instanceof Date ? { value: v, type: Date, format: 'dd-mmm-yyyy' } : v == null ? null : v);
  await writeXlsxFile(sheets.map(s => ({
    sheet: s.name.slice(0, 31), data: [head(s.header), ...s.rows.map(r => r.map(cell))],
    columns: s.header.map((h, i) => ({ width: Math.min(45, Math.max(10, h.length + 2, ...s.rows.slice(0, 50).map(r => String(r[i] ?? '').length + 2))) })),
  })) as any).toFile(fileName);
}

/** Read an uploaded .xlsx/.csv/.tsv into a grid. */
export async function readGrid(f: File): Promise<{ name: string; grid: (string | number | Date | null)[][] }> {
  const ext = f.name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xlsm') {
    const { default: readXlsxFile } = await import('read-excel-file/browser');
    const sheets = await readXlsxFile(f);
    const first = sheets.find(s => s.data.length > 1) ?? sheets[0];
    return { name: f.name, grid: first.data as any };
  }
  if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
    const { parseDelimited } = await import('../../lib/emailInsights');
    return { name: f.name, grid: parseDelimited(await f.text()) };
  }
  throw new Error('Please use .xlsx or .csv files.');
}
