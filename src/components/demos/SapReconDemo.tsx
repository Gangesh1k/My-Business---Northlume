import React, { useMemo, useRef, useState } from 'react';
import { Database, FileText, GitCompareArrows, ShieldAlert, Scale, Landmark, Download, Upload, ArrowRight, RotateCcw, CheckCircle2, Sparkles, FileSpreadsheet } from 'lucide-react';
import { useAccess } from '../../auth/AccessProvider';
import { TrialBadge } from '../../auth/TrialBadge';
import { track } from '../../lib/track';
import { BankLine, GlItem, money, parseBankGrid, parseGl, parseMt940, r2, ReconData, ReconException, ReconResult, reconcile, RULES, sampleData, toMt940 } from '../../lib/sapRecon';
import { Bars, Card, downloadXlsx, Kpis, Label, MiniTable, Note, PrimaryButton, readGrid, SmallButton, Stepper, useStages } from './kit';

const SAMPLE = sampleData();
const SEV: Record<ReconException['sev'], { bar: string; pill: string; label: string }> = {
  high: { bar: 'border-l-red-500', pill: 'bg-red-50 text-red-700 border-red-200', label: 'High' },
  med: { bar: 'border-l-amber-500', pill: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Review' },
  low: { bar: 'border-l-sky-500', pill: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Timing' },
};
const amtCls = (n: number) => (n < 0 ? 'text-red-600' : 'text-emerald-700');

async function readText(f: File) { return f.text(); }
/** CSV/TXT with ';' (common in European SAP exports) is split here; other layouts go through readGrid. */
async function gridOf(f: File) {
  const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
  if (['csv', 'txt', 'tsv'].includes(ext)) {
    const t = (await f.text()).replace(/\r/g, '');
    const first = t.split('\n').find(l => l.trim()) ?? '';
    if ((first.match(/;/g) || []).length > (first.match(/,/g) || []).length)
      return { name: f.name, grid: t.split('\n').filter(l => l.trim()).map(l => l.split(';').map(c => c.trim().replace(/^"|"$/g, ''))) };
  }
  return readGrid(f);
}
/** The published sample files reproduce the built-in sample: running them never uses a free run. */
const sum2 = (xs: { amt: number }[]) => Math.round(xs.reduce((a, x) => a + x.amt, 0) * 100);
const isPublishedSample = (gl: GlItem[], bank: BankLine[]) =>
  gl.length === SAMPLE.gl.length && bank.length === SAMPLE.bank.length && sum2(gl) === sum2(SAMPLE.gl) && sum2(bank) === sum2(SAMPLE.bank);

export const SapReconDemo: React.FC<{ onOpenConsultation: () => void; uploadOpen?: boolean }> = ({ onOpenConsultation, uploadOpen = false }) => {
  const { requestRun } = useAccess();
  const [data, setData] = useState<ReconData>(SAMPLE);
  const [files, setFiles] = useState<{ gl?: string; bank?: string }>({});
  const [pending, setPending] = useState<{ gl?: GlItem[]; bank?: BankLine[]; opening?: number; closing?: number; statement?: string; account?: string }>({});
  const [tolDays, setTolDays] = useState(3);
  const [tolFee, setTolFee] = useState(30);
  const [res, setRes] = useState<ReconResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'exc' | 'mat' | 'brs'>('exc');
  const [approved, setApproved] = useState<Set<string>>(new Set());
  const glRef = useRef<HTMLInputElement>(null), bkRef = useRef<HTMLInputElement>(null);
  const { stages, step, reset } = useStages([
    { title: 'Extract SAP G/L', icon: Database }, { title: 'Parse bank statement', icon: FileText }, { title: 'Rule-based matching', icon: GitCompareArrows },
    { title: 'Classify exceptions', icon: ShieldAlert }, { title: 'Reconciliation statement', icon: Scale },
  ]);
  const isSample = data === SAMPLE;
  const cur = data.scope.currency;

  const onGl = async (f?: File) => {
    if (!f) return; setErr('');
    try { const g = await gridOf(f); const gl = parseGl(g.grid); setPending(p => ({ ...p, gl })); setFiles(x => ({ ...x, gl: `${f.name} · ${gl.length} items` })); }
    catch (e) { setErr((e as Error).message); }
  };
  const onBank = async (f?: File) => {
    if (!f) return; setErr('');
    try {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
      const txt = ['sta', 'mt940', 'txt', '940', 'fin'].includes(ext) ? await readText(f) : '';
      if (txt && txt.includes(':61:')) {
        const m = parseMt940(txt);
        setPending(p => ({ ...p, bank: m.bank, opening: m.opening, closing: m.closing, statement: m.statement, account: m.account }));
        setFiles(x => ({ ...x, bank: `${f.name} · MT940 · ${m.bank.length} lines` }));
      } else {
        const g = await gridOf(f); const bank = parseBankGrid(g.grid);
        setPending(p => ({ ...p, bank, opening: undefined, closing: undefined })); setFiles(x => ({ ...x, bank: `${f.name} · ${bank.length} lines` }));
      }
    } catch (e) { setErr((e as Error).message); }
  };
  const ownReady = !!(pending.gl && pending.bank);
  const useOwn = () => {
    if (!pending.gl || !pending.bank) return;
    const dates = [...pending.gl.map(g => g.date), ...pending.bank.map(b => b.date)].sort();
    setData({
      gl: pending.gl, bank: pending.bank, opening: pending.opening ?? 0, bankClosing: pending.closing,
      scope: { company: 'Your company code', houseBank: pending.account ?? 'Your house bank', glAccount: 'G/L bank account', statement: pending.statement ? `MT940 · ${pending.statement}` : 'Bank statement', period: `${dates[0]} – ${dates[dates.length - 1]}`, currency: '' },
    });
    setRes(null); reset(); setApproved(new Set());
  };
  const backToSample = () => { setData(SAMPLE); setPending({}); setFiles({}); setRes(null); reset(); setApproved(new Set()); };

  const run = async () => {
    if (isSample || isPublishedSample(data.gl, data.bank)) track('demo_run', 'sap-bank-recon');
    else if (!(await requestRun('ai-agents', { kind: 'sap-bank-recon', gl: data.gl.length, bank: data.bank.length }))) return;
    setBusy(true); setRes(null); reset(); setErr(''); setApproved(new Set()); setTab('exc');
    try {
      let out!: ReconResult;
      await step(0, 'Reading G/L bank account line items…', () => `${data.gl.length} items · ${new Set(data.gl.map(g => g.type).filter(Boolean)).size || 1} document types`);
      await step(1, 'Parsing :61: / :86: statement lines…', () => `${data.bank.length} lines · ${data.bank.filter(b => b.amt > 0).length} credits, ${data.bank.filter(b => b.amt < 0).length} debits`);
      await step(2, 'Running 5 matching passes…', () => { out = reconcile(data, tolDays, tolFee); return `${out.groups.length} groups matched · ${out.unmatchedBank.length + out.unmatchedGl.length} items left`; }, 900);
      await step(3, 'Classifying what is left…', () => `${out.exceptions.filter(e => e.sev === 'high').length} high · ${out.exceptions.filter(e => e.sev === 'med').length} review · ${out.exceptions.filter(e => e.sev === 'low').length} timing`);
      await step(4, 'Building bank reconciliation statement…', () => Math.abs(out.adjBank - out.adjBook) < 0.005 ? 'Adjusted balances agree' : `Unexplained ${money(r2(out.adjBank - out.adjBook))}`);
      setRes(out);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };
  // live re-run when a tolerance moves after the first run
  const rerun = (d: number, f: number) => { if (res) { setRes(reconcile(data, d, f)); setApproved(new Set()); } };

  const stats = useMemo(() => {
    if (!res) return null;
    const matchedItems = res.groups.reduce((s, g) => s + 1 + g.gl.length, 0), total = data.gl.length + data.bank.length;
    const counts = Object.fromEntries(RULES.map(r => [r.k, res.groups.filter(g => g.rule === r.k).length]));
    return { matchedItems, total, counts, ok: Math.abs(res.adjBank - res.adjBook) < 0.005, open: res.exceptions.filter(e => e.sev !== 'low' && !approved.has(e.key)).length };
  }, [res, approved, data]);

  const download = () => res && downloadXlsx('NorthLumeAI_SAP_Bank_Reconciliation.xlsx', [
    { name: 'Matches', header: ['Rule', 'Bank line', 'Value date', 'Bank narrative', 'SAP documents', 'Bank amount', 'Book amount', 'Difference', 'Confidence %'],
      rows: res.groups.map(g => [g.rule, g.bank.line, g.bank.date, g.bank.narr, g.gl.map(x => x.doc).join(' '), g.bank.amt, r2(g.gl.reduce((s, x) => s + x.amt, 0)), g.diff, g.conf]) },
    { name: 'Exceptions', header: ['Severity', 'Exception', 'Source', 'Date', 'Reference', 'Amount', 'Reason', 'Action', 'Status'],
      rows: res.exceptions.map(e => [SEV[e.sev].label, e.title, e.side === 'bank' ? 'Bank ' + (e.item as BankLine).line : e.side === 'gl' ? 'SAP ' + (e.item as GlItem).doc : 'Matched items',
        e.item?.date ?? '', e.item?.ref ?? '', e.amt, e.why, e.act, approved.has(e.key) ? 'Approved' : 'Open']) },
    { name: 'Proposed postings', header: ['Exception', 'Dr/Cr', 'Account', 'Amount', 'Status'],
      rows: res.exceptions.flatMap(e => (e.je ?? []).map(j => [e.title, j[0], j[1], Math.abs(j[2]), approved.has(e.key) ? 'Approved' : 'Proposed'])) },
    { name: 'Reconciliation', header: ['Line', 'Amount'], rows: [
      ['Closing balance per bank', res.bankClose], ['+/- SAP items not yet on the bank statement', r2(res.adjBank - res.bankClose)], ['Adjusted bank balance', res.adjBank], [null, null],
      ['Closing balance per SAP book', res.bookClose], ['+/- bank items, charges and corrections not yet in SAP', r2(res.adjBook - res.bookClose)], ['Adjusted book balance', res.adjBook], [null, null],
      ['Unexplained difference', r2(res.adjBank - res.adjBook)]] },
  ]);

  const exRow = (e: ReconException) => {
    const s = SEV[e.sev], done = approved.has(e.key);
    const src = e.side === 'bank' ? `Bank line ${(e.item as BankLine).line} · ${e.item!.date} · ${(e.item as BankLine).code}` : e.side === 'gl' ? `SAP doc ${(e.item as GlItem).doc} · ${e.item!.date} · ${(e.item as GlItem).type}` : 'Matched items';
    const detail = e.side === 'bank' ? (e.item as BankLine).narr : e.side === 'gl' ? `${(e.item as GlItem).ref} · ${(e.item as GlItem).text}` : '';
    return (
      <div key={e.key} className={`rounded-2xl border border-slate-200 border-l-4 ${s.bar} bg-white p-4 space-y-2.5 ${done ? 'opacity-60' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900">{e.title}</div>
            <div className="text-[11px] text-slate-500">{src}</div>
            {detail && <div className="text-[11px] font-mono text-slate-500 truncate">{detail}</div>}
          </div>
          <span className={`font-mono text-sm font-semibold whitespace-nowrap ${amtCls(e.amt)}`}>{money(e.amt)}</span>
        </div>
        <p className="text-xs text-slate-600">{e.why}</p>
        {e.ai && <div className="flex gap-2 rounded-xl border border-dashed border-teal-300 bg-teal-50/60 px-3 py-2 text-xs text-slate-700"><Sparkles className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" /><span>{e.ai}</span></div>}
        {e.je && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 font-mono text-[11px] text-slate-700 grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5">
            <span className="text-slate-400 col-span-3">Proposed entry</span>
            {e.je.map((j, i) => <React.Fragment key={i}><span>{j[0]}</span><span className="truncate">{j[1]}</span><span className="text-right">{money(Math.abs(j[2]))}</span></React.Fragment>)}
          </div>
        )}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${done ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : s.pill}`}>{done ? 'Approved' : s.label}</span>
          <span className="text-[11px] text-slate-500">{e.act}</span>
          {e.sev !== 'low' && (
            <button type="button" onClick={() => setApproved(p => { const n = new Set(p); n.has(e.key) ? n.delete(e.key) : n.add(e.key); return n; })}
              className="text-xs font-semibold px-3 py-1 rounded-full border border-slate-200 hover:border-teal-500 hover:text-teal-700 text-slate-700">{done ? 'Undo' : 'Approve'}</button>
          )}
        </div>
      </div>
    );
  };

  const brsRow = (l: string, v: number, kind?: 'ind' | 'tot') => (
    <div key={l + v} className={`flex justify-between gap-3 px-4 py-2 text-xs border-b border-dashed border-slate-200 ${kind === 'ind' ? 'pl-8 text-slate-500' : kind === 'tot' ? 'bg-slate-50 font-bold text-slate-900 border-b-0' : 'text-slate-700'}`}>
      <span className="min-w-0 truncate">{l}</span><span className="font-mono whitespace-nowrap">{money(v)}</span>
    </div>
  );
  const sumOf = (xs: ReconException[]) => r2(xs.reduce((s, e) => s + e.amt, 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-slate-50 !p-4 space-y-3">
          <Label>Inputs · {isSample ? 'sample SAP month-end' : 'your SAP files'}</Label>
          <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-1.5">
            {([['Company code', data.scope.company], ['House bank', data.scope.houseBank], ['G/L account', data.scope.glAccount], ['Period', `${data.scope.period}${cur ? ' · ' + cur : ''}`]] as const).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-xs"><span className="text-slate-500">{k}</span><span className="font-mono text-slate-800 text-right truncate">{v}</span></div>
            ))}
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" /><span className="truncate">{isSample ? 'FBL3N_113100_Oct26.xlsx' : 'SAP G/L line items'}</span></div>
            <div className="text-[11px] text-slate-500 mt-1">{data.gl.length} G/L line items · DZ / KZ / ZP documents</div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800"><Landmark className="w-4 h-4 text-blue-600 shrink-0" /><span className="truncate">{isSample ? 'CITI_MT940_00045.sta' : 'Bank statement'}</span></div>
            <div className="text-[11px] text-slate-500 mt-1">{data.bank.length} statement lines · {data.scope.statement}</div>
            {isSample && <details className="mt-1.5"><summary className="text-[11px] text-teal-700 font-semibold cursor-pointer">View raw MT940</summary><pre className="mt-2 text-[10px] leading-snug font-mono bg-slate-900 text-slate-100 rounded-xl p-2.5 overflow-auto max-h-48">{toMt940(SAMPLE)}</pre></details>}
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-3">
            <div>
              <label htmlFor="sap-tol-days" className="flex justify-between text-xs text-slate-700"><span>Value-date window</span><b className="font-mono">{tolDays === 0 ? 'same day' : `±${tolDays} day${tolDays > 1 ? 's' : ''}`}</b></label>
              <input id="sap-tol-days" type="range" min={0} max={5} value={tolDays} onChange={e => { const v = +e.target.value; setTolDays(v); rerun(v, tolFee); }} className="w-full accent-teal-600" />
            </div>
            <div>
              <label htmlFor="sap-tol-fee" className="flex justify-between text-xs text-slate-700"><span>Bank-charge tolerance</span><b className="font-mono">{tolFee.toFixed(2)}</b></label>
              <input id="sap-tol-fee" type="range" min={0} max={50} step={5} value={tolFee} onChange={e => { const v = +e.target.value; setTolFee(v); rerun(tolDays, v); }} className="w-full accent-teal-600" />
            </div>
          </div>

          <details className="rounded-2xl bg-white border border-dashed border-slate-300 p-3" open={uploadOpen || !isSample}>
            <summary className="text-xs font-semibold text-slate-700 cursor-pointer">Try it with my SAP files</summary>
            <div className="mt-3 space-y-2">
              <SmallButton icon={Upload} onClick={() => glRef.current?.click()} className="!text-xs !py-2 w-full justify-center">{files.gl ?? 'FBL3N export (.xlsx / .csv)'}</SmallButton>
              <SmallButton icon={Upload} onClick={() => bkRef.current?.click()} className="!text-xs !py-2 w-full justify-center">{files.bank ?? 'Bank statement (MT940 / .csv / .xlsx)'}</SmallButton>
              <div className="flex gap-2">
                <SmallButton tone="teal" disabled={!ownReady} onClick={useOwn} className="!text-xs !py-2 flex-1 justify-center disabled:opacity-50">Load my files</SmallButton>
                {!isSample && <SmallButton icon={RotateCcw} onClick={backToSample} className="!text-xs !py-2">Sample</SmallButton>}
              </div>
              <input ref={glRef} type="file" accept=".xlsx,.xlsm,.csv,.tsv,.txt" className="hidden" onChange={e => onGl(e.target.files?.[0])} />
              <input ref={bkRef} type="file" accept=".sta,.mt940,.940,.txt,.fin,.csv,.tsv,.xlsx" className="hidden" onChange={e => onBank(e.target.files?.[0])} />
              <TrialBadge tool="ai-agents" />
              <Note>Use an FBL3N layout with Document Number, Posting Date, Amount in local currency and Reference (Assignment helps with payment runs). Files are read only in your browser.</Note>
            </div>
          </details>
        </Card>
        <PrimaryButton busy={busy} icon={GitCompareArrows} onClick={run}>{busy ? 'Reconciling…' : 'Run SAP bank reconciliation'}</PrimaryButton>
        {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}
      </div>

      <div className="lg:col-span-8 space-y-5 min-w-0">
        <Stepper stages={stages} />
        {!res && !busy && (
          <Card className="!p-6 text-sm text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">What this demo does</div>
            <p>It reconciles one month of an SAP bank G/L account against the bank's MT940 statement, the way a finance team does at month-end: it matches what it can, explains every difference, proposes the postings, and produces a signed-off bank reconciliation statement.</p>
            <p className="text-xs text-slate-500">All companies, documents and amounts in the sample are synthetic.</p>
          </Card>
        )}
        {res && stats && (
          <Card className="shadow-xl space-y-5">
            <div className={`flex items-center justify-between gap-3 flex-wrap rounded-2xl border px-4 py-3 ${stats.ok ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><CheckCircle2 className={`w-4 h-4 ${stats.ok ? 'text-emerald-600' : 'text-red-600'}`} />{stats.ok ? 'Reconciled — every difference is explained' : 'Not reconciled — difference remains'}</div>
              <span className="font-mono text-xs text-slate-600">Bank {money(res.bankClose)} · SAP {money(res.bookClose)}</span>
            </div>
            <Kpis items={[
              { label: 'Auto-match rate', value: `${((100 * stats.matchedItems) / stats.total).toFixed(1)}%`, sub: `${stats.matchedItems} of ${stats.total} items`, tone: 'good' },
              { label: 'Matched groups', value: String(res.groups.length), sub: `${data.bank.length} bank · ${data.gl.length} SAP` },
              { label: 'Open exceptions', value: String(stats.open), sub: `${res.exceptions.filter(e => e.sev === 'low').length} timing items carried forward`, tone: stats.open ? 'bad' : 'good' },
              { label: 'Unexplained difference', value: money(r2(res.adjBank - res.adjBook)), sub: stats.ok ? 'balances agree' : 'investigate', tone: stats.ok ? 'good' : 'bad' },
            ]} />
            <Bars title="Matches by rule" rows={RULES.map(r => ({ label: `${r.k} · ${r.name}`, value: stats.counts[r.k] }))} />

            <div>
              <div className="flex gap-1 border-b border-slate-200 mb-4 overflow-x-auto" role="tablist">
                {([['exc', `Exceptions (${res.exceptions.length})`], ['mat', `Matched (${res.groups.length})`], ['brs', 'Reconciliation statement']] as const).map(([k, l]) => (
                  <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                    className={`px-3 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px ${tab === k ? 'border-teal-600 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>{l}</button>
                ))}
              </div>
              {tab === 'exc' && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{res.exceptions.map(exRow)}</div>}
              {tab === 'mat' && (
                <MiniTable max={40} head={['Rule', 'Bank line', 'SAP document(s)', 'Bank', 'Diff', 'Conf.']} align={['l', 'l', 'l', 'r', 'r', 'r']}
                  rows={res.groups.map(g => [
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded border border-teal-300 text-teal-700">{g.rule}</span>,
                    <div className="min-w-0"><div className="font-mono">{g.bank.line} · {g.bank.date.slice(5)}</div><div className="text-[11px] text-slate-500 truncate max-w-[220px]">{g.bank.narr}</div></div>,
                    <div className="font-mono">{g.gl.length > 1 ? `${g.gl[0].doc} +${g.gl.length - 1}` : g.gl[0].doc}<div className="text-[11px] text-slate-500 font-sans">{g.gl.length > 1 ? `${g.gl[0].assign} · ${g.gl.length} items` : g.gl[0].ref}</div></div>,
                    <span className={amtCls(g.bank.amt)}>{money(g.bank.amt)}</span>, g.diff ? <span className="text-red-600">{money(g.diff)}</span> : '0.00', `${g.conf}%`])} />
              )}
              {tab === 'brs' && (() => {
                const timing = res.exceptions.filter(e => e.adj === 'bank'), dit = timing.filter(e => e.amt > 0), oc = timing.filter(e => e.amt < 0);
                const bk = res.exceptions.filter(e => e.adj === 'book'), cr = bk.filter(e => e.amt > 0), dr = bk.filter(e => e.amt < 0);
                const fee = res.exceptions.filter(e => e.adj === 'book-fee'), errs = res.exceptions.filter(e => e.adj === 'book-err');
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 text-xs font-bold text-slate-900 border-b border-slate-200">Balance per bank statement</div>
                      {brsRow('Closing balance per bank (:62F:)', res.bankClose)}
                      {brsRow('Add: deposits in transit', sumOf(dit))}{dit.map(e => brsRow(`${(e.item as GlItem).doc} · ${e.item!.ref}`, e.amt, 'ind'))}
                      {brsRow('Less: outstanding payments / cheques', sumOf(oc))}{oc.map(e => brsRow(`${(e.item as GlItem).doc} · ${e.item!.ref}`, e.amt, 'ind'))}
                      {brsRow('Adjusted bank balance', res.adjBank, 'tot')}
                    </div>
                    <div className="rounded-2xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-2.5 text-xs font-bold text-slate-900 border-b border-slate-200">Balance per SAP book</div>
                      {brsRow('Closing balance per SAP G/L', res.bookClose)}
                      {brsRow('Add: bank credits not yet booked', sumOf(cr))}{cr.map(e => brsRow(`Line ${(e.item as BankLine).line} · ${(e.item as BankLine).narr}`, e.amt, 'ind'))}
                      {brsRow('Less: bank debits not yet booked', sumOf(dr))}{dr.map(e => brsRow(`Line ${(e.item as BankLine).line} · ${(e.item as BankLine).narr}`, e.amt, 'ind'))}
                      {fee.length > 0 && brsRow('Less: charges on matched items', sumOf(fee))}
                      {errs.length > 0 && <>{brsRow('Correct: duplicate postings', -sumOf(errs))}{errs.map(e => brsRow(`Reverse ${(e.item as GlItem).doc}`, -e.amt, 'ind'))}</>}
                      {brsRow('Adjusted book balance', res.adjBook, 'tot')}
                    </div>
                    {!isSample && data.opening === 0 && <div className="md:col-span-2"><Note>No opening balance was found in your files, so closing balances show the period movement only. An MT940 file with :60F: / :62F: fills these in.</Note></div>}
                  </div>
                );
              })()}
            </div>

            <div className="flex flex-wrap gap-3">
              <SmallButton tone="teal" icon={Download} onClick={download}>Download reconciliation (Excel)</SmallButton>
              <SmallButton tone="dark" onClick={onOpenConsultation}>Automate my SAP reconciliation <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
