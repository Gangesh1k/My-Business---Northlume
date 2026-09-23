import React, { useRef, useState } from 'react';
import { Files, Columns3, Eraser, GitCompareArrows, FileCheck2, FileSpreadsheet, Download, Upload, ArrowRight, RotateCcw } from 'lucide-react';
import { normalize, Cell } from '../../lib/emailInsights';
import { Card, downloadXlsx, inr, InsightList, Kpis, Label, MiniTable, Note, PrimaryButton, readGrid, SmallButton, Stepper, useStages } from './kit';

type Grid = Cell[][];
interface SrcFile { name: string; branch: string; grid: Grid }
const FIELDS = ['Invoice No', 'Customer', 'Invoice Date', 'Amount', 'Status'] as const;
type Field = typeof FIELDS[number];
const SYNONYMS: [Field, RegExp][] = [
  ['Invoice No', /inv(oice)?\.?\s*(no|#|number|num|id)|bill\s*no|doc(ument)?\s*no|^invoice$/i],
  ['Customer', /customer|client|party|buyer|account\s*name|debtor/i],
  ['Invoice Date', /date/i],
  ['Amount', /amount|amt|value|net|total|gross/i],
  ['Status', /status|state/i],
];

// ---------------- sample data (deterministic)
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const customers = ['Shree Traders', 'Apex Retail', 'Metro Mart', 'Kiran Stores', 'Sunrise Foods', 'Om Distributors', 'BlueLeaf Pharma', 'Nova Electronics'];
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
function makeSamples(): { files: SrcFile[]; ledger: Map<string, number> } {
  const ledger = new Map<string, number>();
  const jaipur: Grid = [['Jaipur Branch — Invoice Register Sep-26'], [], ['Inv No', 'Customer', 'Inv Date', 'Amt (INR)', 'Status']];
  const delhi: Grid = [['Invoice #', 'Client Name', 'Date', 'Amount', 'Payment Status']];
  const mumbai: Grid = [['Invoice Number', 'Customer Name', 'Invoice Date', 'Invoice Value', 'Status']];
  const st = ['Open', 'Paid', 'Paid', 'Part Paid'];
  for (let i = 0; i < 14; i++) {
    const no = `JPR-${2401 + i}`, amt = Math.round(8000 + rnd() * 90000);
    jaipur.push([no, pick(customers), `${String(1 + i * 2).padStart(2, '0')}/09/2026`, amt, pick(st)]);
    ledger.set(no, i === 4 ? amt + 1500 : amt);             // one amount mismatch
  }
  for (let i = 0; i < 12; i++) {
    const no = `DEL-${7710 + i}`, amt = Math.round(12000 + rnd() * 120000);
    delhi.push([no, pick(customers), `${String(2 + i * 2).padStart(2, '0')}-09-2026`, `₹${amt.toLocaleString('en-IN')}.00`, pick(st)]);
    if (i !== 9) ledger.set(no, amt);                        // one missing in ERP
    if (i === 3 || i === 7) delhi.push(delhi[delhi.length - 1]);  // duplicates pasted twice
  }
  delhi.push(['DEL-7799', 'Apex Retail', '28-09-2026', '', 'Open']); // blank amount
  for (let i = 0; i < 13; i++) {
    const no = `MUM-${5301 + i}`, amt = Math.round(15000 + rnd() * 150000);
    mumbai.push([no, pick(customers).toUpperCase() + ' ', `2026-09-${String(1 + i * 2).padStart(2, '0')}`, amt, pick(st)]);
    ledger.set(no, i === 10 ? Math.round(amt * 0.9) : amt);  // another mismatch
  }
  ledger.set('MUM-5390', 44000);                             // in ERP but not in any branch file
  return {
    files: [
      { name: 'Jaipur_Invoice_Register.xlsx', branch: 'Jaipur', grid: jaipur },
      { name: 'Delhi_billing_export.csv', branch: 'Delhi', grid: delhi },
      { name: 'Mumbai Sales Sep.xlsx', branch: 'Mumbai', grid: mumbai },
    ], ledger,
  };
}
const SAMPLE = makeSamples();

// ---------------- processing
interface MasterRow { 'Invoice No': string; Customer: string; 'Invoice Date': Date | null; Amount: number | null; Status: string; Branch: string; Source: string; Check: string }
const title = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase());

function mapHeaders(cols: string[]) {
  const used = new Set<Field>();
  return cols.map(c => {
    const f = SYNONYMS.find(([field, rx]) => !used.has(field) && rx.test(c))?.[0];
    if (f) used.add(f);
    return { source: c, field: f ?? null };
  });
}

export const ExcelDemo: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const [files, setFiles] = useState<SrcFile[]>(SAMPLE.files);
  const [useLedger, setUseLedger] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<null | {
    mapping: { file: string; source: string; field: string | null }[]; master: MasterRow[]; dupes: number; fixed: number; invalid: MasterRow[];
    recon?: { matched: number; mismatch: { no: string; branch: number; erp: number }[]; missingErp: string[]; missingBranch: string[] };
  }>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { stages, step, reset } = useStages([
    { title: 'Multi-file Ingest', icon: Files }, { title: 'Header Mapping', icon: Columns3 }, { title: 'Clean & De-duplicate', icon: Eraser },
    { title: 'Cross-Reconcile', icon: GitCompareArrows }, { title: 'Validated Master', icon: FileCheck2 },
  ]);
  const isSample = files === SAMPLE.files;

  const onUpload = async (list: FileList | null) => {
    if (!list?.length) return;
    setErr(''); setRes(null); reset();
    try {
      const out: SrcFile[] = [];
      for (const f of Array.from(list).slice(0, 6)) {
        if (f.size > 5e6) throw new Error(`${f.name} is over 5 MB.`);
        const g = await readGrid(f);
        out.push({ name: f.name, branch: f.name.replace(/\.[^.]+$/, ''), grid: g.grid });
      }
      setFiles(out); setUseLedger(false);
    } catch (e) { setErr((e as Error).message); }
  };

  const run = async () => {
    setBusy(true); setRes(null); reset(); setErr('');
    try {
      const tables = files.map(f => ({ f, t: normalize(f.grid, f.name, 'attachment') }));
      await step(0, 'Opening files…', () => `${files.length} files · ${tables.reduce((s, x) => s + (x.t?.rows.length ?? 0), 0)} rows read (title rows skipped)`);

      const mapping: { file: string; source: string; field: string | null }[] = [];
      await step(1, 'Matching column names to a standard layout…', () => {
        tables.forEach(({ f, t }) => t && mapHeaders(t.columns).forEach(m => mapping.push({ file: f.name, ...m })));
        const mapped = mapping.filter(m => m.field).length;
        return `${mapped} of ${mapping.length} columns mapped to ${FIELDS.length} standard fields`;
      });

      let master: MasterRow[] = []; let dupes = 0, fixed = 0;
      await step(2, 'Trimming text, fixing amounts & dates, removing duplicates…', () => {
        const seen = new Set<string>();
        tables.forEach(({ f, t }) => {
          if (!t) return;
          const map = mapHeaders(t.columns);
          const col = (fld: Field) => map.find(m => m.field === fld)?.source;
          t.rows.forEach(r => {
            const get = (fld: Field) => { const c = col(fld); return c ? r[c] : null; };
            const rawCust = get('Customer');
            const row: MasterRow = {
              'Invoice No': String(get('Invoice No') ?? '').trim(), Customer: rawCust ? title(String(rawCust)) : '',
              'Invoice Date': get('Invoice Date') instanceof Date ? (get('Invoice Date') as Date) : null,
              Amount: typeof get('Amount') === 'number' ? (get('Amount') as number) : null, Status: String(get('Status') ?? '').trim(),
              Branch: f.branch, Source: f.name, Check: 'OK',
            };
            if (rawCust && String(rawCust) !== row.Customer) fixed++;
            const key = row['Invoice No'] || JSON.stringify(row);
            if (seen.has(key)) { dupes++; return; }
            seen.add(key);
            master.push(row);
          });
        });
        master.forEach(r => { if (r.Amount == null) r.Check = 'Missing amount'; else if (!r['Invoice No']) r.Check = 'Missing invoice no'; });
        return `${master.length} unique rows · ${dupes} duplicates removed · ${fixed} names standardised`;
      });

      let recon: NonNullable<typeof res>['recon'];
      await step(3, useLedger ? 'Comparing every invoice against the ERP ledger…' : 'Checking totals and required fields…', () => {
        if (!useLedger) return 'No ERP ledger for uploaded files — validation checks only';
        const L = SAMPLE.ledger; const r: NonNullable<typeof recon> = { matched: 0, mismatch: [], missingErp: [], missingBranch: [] };
        const inFiles = new Set(master.map(m => m['Invoice No']));
        master.forEach(m => {
          if (m.Amount == null) return;
          const erp = L.get(m['Invoice No']);
          if (erp == null) { r.missingErp.push(m['Invoice No']); m.Check = 'Not in ERP'; }
          else if (Math.abs(erp - m.Amount) > 1) { r.mismatch.push({ no: m['Invoice No'], branch: m.Amount, erp }); m.Check = `Amount differs (ERP ${inr(erp)})`; }
          else r.matched++;
        });
        L.forEach((_, k) => { if (!inFiles.has(k)) r.missingBranch.push(k); });
        recon = r;
        return `${r.matched} matched · ${r.mismatch.length} amount mismatches · ${r.missingErp.length + r.missingBranch.length} missing`;
      }, 800);

      await step(4, 'Building master workbook…', () => `Master file ready: ${master.length} rows · ${master.filter(m => m.Check !== 'OK').length} flagged for review`);
      setRes({ mapping, master, dupes, fixed, invalid: master.filter(m => m.Check !== 'OK'), recon });
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const download = () => res && downloadXlsx('NorthLumeAI_Consolidated_Master.xlsx', [
    { name: 'Master', header: [...FIELDS, 'Branch', 'Source file', 'Check'], rows: res.master.map(m => [m['Invoice No'], m.Customer, m['Invoice Date'], m.Amount, m.Status, m.Branch, m.Source, m.Check]) },
    { name: 'Exceptions', header: ['Invoice No', 'Branch', 'Issue'], rows: [...res.invalid.map(m => [m['Invoice No'], m.Branch, m.Check]), ...(res.recon?.missingBranch.map(k => [k, 'ERP only', 'In ERP but missing from branch files']) ?? [])] },
    { name: 'Header mapping', header: ['File', 'Original column', 'Mapped to'], rows: res.mapping.map(m => [m.file, m.source, m.field ?? '(kept, not mapped)']) },
  ]);

  const total = res ? res.master.reduce((s, m) => s + (m.Amount ?? 0), 0) : 0;
  const insights = res ? [
    ...(res.recon?.mismatch.length ? [{ severity: 'critical' as const, title: `${res.recon.mismatch.length} invoices don't match the ERP amount`, detail: res.recon.mismatch.map(m => `${m.no}: file ${inr(m.branch)} vs ERP ${inr(m.erp)}`).join(' · ') }] : []),
    ...(res.recon && (res.recon.missingErp.length || res.recon.missingBranch.length) ? [{ severity: 'warning' as const, title: `${res.recon.missingErp.length + res.recon.missingBranch.length} invoices missing on one side`, detail: [res.recon.missingErp.length ? `Not posted in ERP: ${res.recon.missingErp.join(', ')}` : '', res.recon.missingBranch.length ? `In ERP but not in branch files: ${res.recon.missingBranch.join(', ')}` : ''].filter(Boolean).join(' · ') }] : []),
    ...(res.invalid.some(m => m.Check.startsWith('Missing')) ? [{ severity: 'warning' as const, title: `${res.invalid.filter(m => m.Check.startsWith('Missing')).length} rows have missing values`, detail: res.invalid.filter(m => m.Check.startsWith('Missing')).map(m => `${m['Invoice No'] || '(no number)'} – ${m.Check}`).join(' · ') }] : []),
    ...(res.dupes ? [{ severity: 'info' as const, title: `${res.dupes} duplicate rows removed`, detail: 'Same invoice number appeared more than once — kept the first occurrence.' }] : []),
    { severity: 'positive' as const, title: `Master file: ${res.master.length} invoices worth ${inr(total)}`, detail: `Consolidated from ${files.length} files with different layouts into one standard format.` },
  ] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-slate-50 !p-4 space-y-3">
          <Label>Input files · {isSample ? 'sample branch reports' : 'your files'}</Label>
          {files.map(f => {
            const head = normalize(f.grid, f.name, 'attachment')?.columns ?? [];
            return (
              <div key={f.name} className="rounded-2xl bg-white border border-slate-200 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" /><span className="truncate">{f.name}</span></div>
                <div className="mt-1.5 flex flex-wrap gap-1">{head.map(h => <span key={h} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">{h}</span>)}</div>
              </div>
            );
          })}
          {isSample && <div className="rounded-2xl bg-white border border-dashed border-slate-300 p-3 text-xs text-slate-600"><b>+ ERP ledger export</b> (39 invoices) used for reconciliation</div>}
          <div className="flex gap-2">
            <SmallButton icon={Upload} onClick={() => inputRef.current?.click()} className="!text-xs !py-2 flex-1 justify-center">Use my files</SmallButton>
            {!isSample && <SmallButton icon={RotateCcw} onClick={() => { setFiles(SAMPLE.files); setUseLedger(true); setRes(null); reset(); }} className="!text-xs !py-2">Samples</SmallButton>}
          </div>
          <input ref={inputRef} type="file" multiple accept=".xlsx,.xlsm,.csv,.tsv" className="hidden" onChange={e => onUpload(e.target.files)} />
          <Note>Upload 2–6 Excel/CSV files with similar data but different column names. They are processed only in your browser.</Note>
        </Card>
        <PrimaryButton busy={busy} icon={Files} onClick={run}>{busy ? 'Consolidating…' : 'Consolidate & reconcile'}</PrimaryButton>
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
      </div>

      <div className="lg:col-span-8 space-y-5 min-w-0">
        <Stepper stages={stages} />
        {res && (
          <Card className="shadow-xl space-y-5">
            <Kpis items={[
              { label: 'Rows in master', value: String(res.master.length), sub: `from ${files.length} files` },
              { label: 'Duplicates removed', value: String(res.dupes) },
              ...(res.recon ? [{ label: 'Matched to ERP', value: `${res.recon.matched}`, sub: `${Math.round((100 * res.recon.matched) / res.master.length)}% auto-matched`, tone: 'good' as const },
                { label: 'Needs review', value: String(res.invalid.length + res.recon.missingBranch.length), tone: 'bad' as const, sub: 'exceptions' }] :
                [{ label: 'Flagged rows', value: String(res.invalid.length), tone: 'bad' as const }]),
            ]} />
            <InsightList items={insights} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><Label>Header mapping</Label>
                <MiniTable head={['Original column', '→ Standard field']} max={9}
                  rows={res.mapping.filter((m, i, a) => a.findIndex(x => x.source === m.source) === i).map(m => [<span className="font-mono">{m.source}</span>, m.field ?? <span className="text-slate-400">kept as-is</span>])} /></div>
              <div><Label>Validated master (preview)</Label>
                <MiniTable head={['Invoice', 'Customer', 'Amount', 'Check']} align={['l', 'l', 'r', 'l']} max={7}
                  rows={[...res.invalid, ...res.master.filter(m => m.Check === 'OK')].map(m => [m['Invoice No'], m.Customer, inr(m.Amount),
                    <span className={m.Check === 'OK' ? 'text-emerald-600' : 'text-red-600 font-semibold'}>{m.Check}</span>])} /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <SmallButton tone="teal" icon={Download} onClick={download}>Download master Excel</SmallButton>
              <SmallButton tone="dark" onClick={onOpenConsultation}>Automate my spreadsheets <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
