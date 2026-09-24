// Shared pieces for the "use my own data" tools (Reporting, Workflow, Reconciliation agent).
import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, FileDown } from 'lucide-react';
import { normalize, Table, Cell } from '../../lib/emailInsights';
import { readGrid } from '../demos/kit';

export const numCols = (t: Table) => t.columns.filter(c => t.types[c] === 'number');
export const dateCols = (t: Table) => t.columns.filter(c => t.types[c] === 'date');
export const textCols = (t: Table) => t.columns.filter(c => t.types[c] === 'text');
/** First column whose name matches one of the patterns, else the fallback. */
export const pick = (cols: string[], rx: RegExp, fallback?: string) => cols.find(c => rx.test(c)) ?? fallback ?? cols[0] ?? '';
export const distinct = (t: Table, c: string) => new Set(t.rows.map(r => r[c]).filter(v => v != null && v !== '')).size;
export const avgLen = (t: Table, c: string) => t.rows.reduce((s, r) => s + String(r[c] ?? '').length, 0) / (t.rows.length || 1);
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const str = (v: Cell) => (v == null ? '' : v instanceof Date ? ymd(v) : String(v));

/** Load one table from an uploaded file. */
export function useTableFile() {
  const [table, setTable] = useState<Table | null>(null);
  const [err, setErr] = useState('');
  const load = async (f?: File) => {
    if (!f) return; setErr('');
    try {
      if (f.size > 8e6) throw new Error('Please use a file under 8 MB.');
      const g = await readGrid(f);
      const t = normalize(g.grid, f.name, 'upload');
      if (!t) throw new Error('No table found — the file needs a header row and at least one data row.');
      setTable(t);
    } catch (e) { setErr((e as Error).message); }
  };
  return { table, setTable, err, load };
}

export const FilePick: React.FC<{ label: string; hint: string; table: Table | null; onFile: (f?: File) => void; err?: string; template?: { name: string; csv: string } }> =
  ({ label, hint, table, onFile, err, template }) => {
    const ref = useRef<HTMLInputElement>(null);
    return (
      <div className="space-y-1.5">
        <button type="button" onClick={() => ref.current?.click()}
          className="w-full border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-2xl p-3.5 text-center bg-white transition-colors">
          {table ? <FileSpreadsheet className="w-5 h-5 mx-auto text-emerald-600" /> : <Upload className="w-5 h-5 mx-auto text-teal-600" />}
          <div className="text-sm font-semibold text-slate-800 mt-1 truncate">{table ? table.name : label}</div>
          <div className="text-[11px] text-slate-500">{table ? `${table.rows.length} rows · ${table.columns.length} columns` : hint}</div>
        </button>
        <input ref={ref} type="file" accept=".xlsx,.xlsm,.csv,.tsv" className="hidden" onChange={e => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
        {template && (
          <button type="button" onClick={() => downloadText(template.name, template.csv)} className="inline-flex items-center gap-1 text-[11px] text-teal-700 hover:underline">
            <FileDown className="w-3.5 h-3.5" /> Download a template ({template.name})
          </button>
        )}
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    );
  };

export const ColSelect: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void; allowNone?: boolean }> = ({ label, value, options, onChange, allowNone }) => (
  <label className="block text-[11px] font-semibold text-slate-600">{label}
    <select value={value} onChange={e => onChange(e.target.value)}
      className="mt-0.5 w-full px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:border-teal-500">
      {allowNone && <option value="">— none —</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </label>
);

export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
