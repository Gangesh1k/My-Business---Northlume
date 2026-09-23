import React, { useRef, useState } from 'react';
import {
  Mail, Paperclip, FileSpreadsheet, Table2, Sparkles, Send, Inbox, Wand2, CheckCircle2, Loader2,
  Download, AlertTriangle, TrendingUp, Info, ShieldCheck, Upload, ArrowRight, RotateCcw,
} from 'lucide-react';
import { sampleEmails, SampleEmail } from '../data/emailSamples';
import {
  analyze, Analysis, Cell, fmt, htmlTables, normalize, parseDelimited, Table, textTables, triage, Triage, Severity,
} from '../lib/emailInsights';

interface Props { onOpenConsultation: () => void; embedded?: boolean }

type StageState = 'idle' | 'running' | 'done';
interface Stage { key: string; title: string; icon: React.ElementType; detail: string; state: StageState }
interface Result { email: SampleEmail; tables: Table[]; analyses: Analysis[]; triage: Triage; sourceNote: string }

const STAGES: Omit<Stage, 'detail' | 'state'>[] = [
  { key: 'inbox', title: 'Inbox Monitor', icon: Inbox },
  { key: 'extract', title: 'Attachment / Body Extractor', icon: Paperclip },
  { key: 'normalize', title: 'Data Normalizer', icon: Table2 },
  { key: 'insight', title: 'Insight Engine', icon: Sparkles },
  { key: 'dispatch', title: 'Report Dispatcher', icon: Send },
];

const sevStyle: Record<Severity, { box: string; text: string; icon: React.ElementType }> = {
  critical: { box: 'bg-red-50 border-red-200', text: 'text-red-700', icon: AlertTriangle },
  warning: { box: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  positive: { box: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: TrendingUp },
  info: { box: 'bg-sky-50 border-sky-200', text: 'text-sky-700', icon: Info },
};
const prioStyle = { High: 'bg-red-100 text-red-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-emerald-100 text-emerald-700' };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const senderName = (from: string) => from.replace(/<.*>/, '').trim();
const senderAddr = (from: string) => (from.match(/<(.+)>/) || [, from])[1];

function extractTables(email: SampleEmail): { tables: Table[]; note: string } {
  if (email.attachment) {
    const t = normalize(email.attachment.grid, email.attachment.name, 'attachment');
    if (t) return { tables: [t], note: `Read attachment ${email.attachment.name}` };
  }
  if (email.html) {
    const tables = htmlTables(email.html).map((g, i) => normalize(g, `Email body table ${i + 1}`, 'body-html')).filter(Boolean) as Table[];
    if (tables.length) return { tables, note: `No attachment — found ${tables.length} HTML table in the email body` };
  }
  const tables = textTables(email.preview).map((g, i) => normalize(g, `Email body table ${i + 1}`, 'body-text')).filter(Boolean) as Table[];
  return { tables, note: tables.length ? `No attachment — found a text table pasted in the email body` : 'No attachment and no table in the email' };
}

export const EmailAutomationLab: React.FC<Props> = ({ onOpenConsultation, embedded = false }) => {
  const [tab, setTab] = useState<'samples' | 'own'>('samples');
  const [selected, setSelected] = useState<SampleEmail>(sampleEmails[0]);
  const [stages, setStages] = useState<Stage[]>(STAGES.map(s => ({ ...s, detail: 'Waiting', state: 'idle' })));
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [paste, setPaste] = useState('');
  const [ownSubject, setOwnSubject] = useState('My weekly report');
  const [ownFile, setOwnFile] = useState<{ name: string; grid: Cell[][] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const setStage = (i: number, state: StageState, detail: string) =>
    setStages(prev => prev.map((s, j) => (j === i ? { ...s, state, detail } : s)));

  const reset = () => { setResult(null); setError(''); setStages(STAGES.map(s => ({ ...s, detail: 'Waiting', state: 'idle' }))); };

  const onFile = async (f: File | undefined) => {
    setError(''); setOwnFile(null);
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { setError('Please use a file under 5 MB for the demo.'); return; }
    const ext = f.name.split('.').pop()?.toLowerCase();
    try {
      if (ext === 'xlsx' || ext === 'xlsm') {
        const { default: readXlsxFile } = await import('read-excel-file/browser');
        const sheets = await readXlsxFile(f);
        const first = sheets.find(s => s.data.length > 1) ?? sheets[0];
        setOwnFile({ name: `${f.name} › ${first.sheet}`, grid: first.data as Cell[][] });
      } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
        setOwnFile({ name: f.name, grid: parseDelimited(await f.text()) });
      } else setError('Supported in this demo: .xlsx, .csv, .tsv, .txt (the full tool also reads .xls, PDF, XML and JSON).');
    } catch {
      setError('Could not read that file. Try saving it as .xlsx or .csv.');
    }
  };

  const buildOwnEmail = (): SampleEmail | null => {
    if (ownFile) return { id: 'own', from: 'You <you@yourcompany.com>', subject: ownSubject || 'Uploaded report', received: 'now', preview: '(your uploaded file)',
      attachment: { name: ownFile.name, size: '', grid: ownFile.grid }, sourceLabel: 'Your file' };
    if (paste.trim()) return { id: 'own', from: 'You <you@yourcompany.com>', subject: ownSubject || 'Pasted table', received: 'now',
      preview: paste, attachment: { name: 'Pasted table', size: '', grid: parseDelimited(paste) }, sourceLabel: 'Your pasted table' };
    return null;
  };

  const run = async () => {
    const email = tab === 'samples' ? selected : buildOwnEmail();
    if (!email) { setError('Upload a file or paste a table first (you can copy cells straight from Excel).'); return; }
    reset(); setRunning(true);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      setStage(0, 'running', 'Checking inbox for new emails…'); await sleep(600);
      setStage(0, 'done', `New email from ${senderName(email.from)} · “${email.subject}”`);

      setStage(1, 'running', email.attachment ? `Opening ${email.attachment.name}…` : 'No attachment — scanning email body…'); await sleep(700);
      const { tables, note } = extractTables(email);
      setStage(1, 'done', note);
      if (!tables.length) throw new Error('No table could be found. Make sure the first row has column names.');

      setStage(2, 'running', 'Detecting header row, numbers, dates…'); await sleep(600);
      const t = tables[0];
      const n = Object.values(t.types).filter(x => x === 'number').length, d = Object.values(t.types).filter(x => x === 'date').length;
      setStage(2, 'done', `${t.rows.length} rows × ${t.columns.length} columns · ${n} numeric, ${d} date column(s) cleaned`);

      setStage(3, 'running', 'Calculating KPIs, trends, target gaps, exceptions…'); await sleep(800);
      const analyses = tables.map(analyze);
      const tri = triage(email.subject, email.preview, analyses);
      const nIns = analyses.reduce((s, a) => s + a.insights.length, 0), nExc = analyses.reduce((s, a) => s + a.exceptions.length, 0);
      setStage(3, 'done', `${nIns} insights · ${nExc} exceptions · ${tri.category} · ${tri.priority} priority`);

      setStage(4, 'running', 'Drafting reply and Excel report…'); await sleep(600);
      setStage(4, 'done', `Reply drafted to ${senderAddr(email.from)} with Excel report${tri.priority === 'High' ? ' · escalated to team lead' : ''}`);
      setResult({ email, tables, analyses, triage: tri, sourceNote: note });
    } catch (e) {
      setError((e as Error).message);
      setStages(prev => prev.map(s => (s.state === 'running' ? { ...s, state: 'idle', detail: 'Stopped' } : s)));
    } finally {
      setRunning(false);
    }
  };

  const downloadExcel = async () => {
    if (!result) return;
    const { default: writeXlsxFile } = await import('write-excel-file/browser');
    const head = (cols: string[]) => cols.map(c => ({ value: c, fontWeight: 'bold' as const, backgroundColor: '#11141A', color: '#FFFFFF' }));
    const a = result.analyses[0], t = result.tables[0];
    const cell = (v: Cell) => (v instanceof Date ? { value: v, format: 'dd-mmm-yyyy', type: Date } : v ?? '');
    const fileName = `NorthLumeAI_insights_${result.email.subject.replace(/[^A-Za-z0-9]+/g, '_').slice(0, 40)}.xlsx`;
    await writeXlsxFile([
      { sheet: 'Insights', data: [head(['Severity', 'Insight', 'Detail']), ...result.analyses.flatMap(x => x.insights.map(i => [i.severity.toUpperCase(), i.title, i.detail]))], columns: [{ width: 12 }, { width: 50 }, { width: 90 }] },
      { sheet: 'KPIs', data: [head(['Metric', 'Total', 'Average', 'Min', 'Max']), ...a.kpis.map(k => [k.metric, k.total, +k.average.toFixed(2), k.min, k.max])], columns: [{ width: 28 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }] },
      { sheet: 'Breakdown', data: [head([a.dimension ?? 'Group', a.metric ?? 'Value', 'Share %']), ...a.breakdown.map(b => [b.group, b.total, +b.share.toFixed(1)])], columns: [{ width: 22 }, { width: 16 }, { width: 10 }] },
      { sheet: 'Exceptions', data: [head(['Type', 'Item', 'Value', 'Expected / typical']), ...a.exceptions.map(e => [e.type, e.item, e.value ?? '', e.expected ?? ''])], columns: [{ width: 34 }, { width: 28 }, { width: 14 }, { width: 18 }] },
      { sheet: 'Cleaned data', data: [head(t.columns), ...t.rows.map(r => t.columns.map(c => cell(r[c])))], columns: t.columns.map(() => ({ width: 18 })) },
    ] as any).toFile(fileName);
  };

  const a = result?.analyses[0];
  const maxBar = a?.breakdown.length ? Math.max(...a.breakdown.map(b => b.total)) : 1;

  const body = (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ---------- Left: inbox / own data ---------- */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex p-1 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold">
              {(['samples', 'own'] as const).map(k => (
                <button key={k} onClick={() => { setTab(k); reset(); }}
                  className={`flex-1 py-2 rounded-full transition-all ${tab === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>
                  {k === 'samples' ? 'Sample inbox' : 'Try your own data'}
                </button>
              ))}
            </div>

            {tab === 'samples' ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1.5"><Inbox className="w-3.5 h-3.5" /> ops-reports inbox</span>
                  <span>{sampleEmails.length} unread</span>
                </div>
                {sampleEmails.map(e => (
                  <button key={e.id} onClick={() => { setSelected(e); reset(); }}
                    className={`w-full text-left px-4 py-3 border-b border-slate-200 last:border-0 transition-colors ${selected.id === e.id ? 'bg-white ring-2 ring-inset ring-teal-500/40' : 'hover:bg-white/70'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">{senderName(e.from)}</span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">{e.received}</span>
                    </div>
                    <div className="text-sm text-slate-800 truncate">{e.subject}</div>
                    <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100">
                      {e.attachment ? <Paperclip className="w-3 h-3" /> : <Table2 className="w-3 h-3" />}{e.sourceLabel}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <label className="text-xs font-semibold text-slate-700 block">Email subject
                  <input value={ownSubject} onChange={e => setOwnSubject(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-teal-500" />
                </label>
                <button onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-300 hover:border-teal-400 rounded-2xl p-4 text-center bg-white transition-colors">
                  <Upload className="w-5 h-5 mx-auto text-teal-600" />
                  <div className="text-sm font-semibold text-slate-800 mt-1">{ownFile ? ownFile.name : 'Attach an Excel or CSV file'}</div>
                  <div className="text-[11px] text-slate-500">.xlsx · .csv · .tsv — up to 5 MB</div>
                </button>
                <input ref={fileRef} type="file" accept=".xlsx,.xlsm,.csv,.tsv,.txt" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
                <div className="text-center text-[11px] font-mono text-slate-400">— or paste a table as the email body —</div>
                <textarea rows={6} value={paste} onChange={e => { setPaste(e.target.value); setOwnFile(null); }}
                  placeholder={'Copy cells from Excel and paste here, e.g.\nRegion\tSales\tTarget\nNorth\t120000\t150000\nSouth\t98000\t90000'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-teal-500 resize-none" />
                <p className="flex items-start gap-1.5 text-[11px] text-slate-500"><ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-px" />
                  Processed entirely in your browser — nothing is uploaded or stored.</p>
              </div>
            )}

            <button onClick={run} disabled={running}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-semibold text-sm rounded-full shadow-lg shadow-slate-200 transition-colors">
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-teal-400" />}
              <span>{running ? 'Running automation…' : 'Run email automation'}</span>
            </button>
            {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}
          </div>

          {/* ---------- Right: preview, pipeline, results ---------- */}
          <div className="lg:col-span-8 space-y-5 min-w-0 scroll-mt-24" ref={resultsRef}>
            {/* email preview */}
            {tab === 'samples' && !result && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xs p-5">
                <div className="text-xs text-slate-500">From <span className="font-semibold text-slate-800">{selected.from}</span></div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{selected.subject}</div>
                {selected.attachment && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /><span className="font-semibold">{selected.attachment.name}</span>
                    <span className="text-slate-400">{selected.attachment.size}</span>
                  </div>
                )}
                <div className="mt-3 text-sm text-slate-700 whitespace-pre-line max-h-56 overflow-auto">
                  {selected.html
                    ? <div className="[&_table]:text-xs [&_table]:border-collapse [&_td]:border [&_th]:border [&_td]:border-slate-200 [&_th]:border-slate-200 [&_td]:px-2 [&_th]:px-2 [&_th]:bg-slate-50 [&_p]:mb-2 whitespace-normal" dangerouslySetInnerHTML={{ __html: selected.html }} />
                    : <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{selected.preview}</pre>}
                </div>
              </div>
            )}

            {/* pipeline */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              {stages.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.key} className={`rounded-2xl border p-3 transition-all ${s.state === 'done' ? 'bg-teal-50/60 border-teal-200' : s.state === 'running' ? 'bg-white border-slate-900 shadow-md' : 'bg-slate-50 border-slate-200'}`}>
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

            {/* results */}
            {result && a && (
              <div className="rounded-3xl border border-slate-200 bg-white shadow-xl p-5 sm:p-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900 text-base mr-1">Insights · {result.email.subject}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold ${prioStyle[result.triage.priority]}`}>{result.triage.priority} priority</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">{result.triage.category}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-100 font-mono">{a.table.name}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {a.kpis.map(k => (
                    <div key={k.metric} className="rounded-2xl border border-slate-200 p-3">
                      <div className="text-[11px] text-slate-500 truncate">{k.metric} · {k.headline}</div>
                      <div className="text-xl font-extrabold text-slate-900">{fmt(k[k.headline])}</div>
                      <div className="text-[10px] font-mono text-slate-400">min {fmt(k.min)} · max {fmt(k.max)}</div>
                    </div>
                  ))}
                </div>

                <ul className="space-y-2">
                  {a.insights.map((ins, i) => {
                    const st = sevStyle[ins.severity]; const Icon = st.icon;
                    return (
                      <li key={i} className={`flex gap-3 rounded-2xl border px-3.5 py-2.5 ${st.box}`}>
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${st.text}`} />
                        <div className="min-w-0">
                          <div className={`text-sm font-bold ${st.text}`}>{ins.title}</div>
                          <div className="text-xs text-slate-700">{ins.detail}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {a.breakdown.length > 0 && (
                    <div>
                      <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">{a.metric} by {a.dimension}</div>
                      <div className="space-y-1.5">
                        {a.breakdown.slice(0, 7).map(b => (
                          <div key={b.group} className="grid grid-cols-[90px_1fr_64px] items-center gap-2 text-xs">
                            <span className="truncate text-slate-700">{b.group}</span>
                            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${Math.max(3, (100 * b.total) / maxBar)}%` }} /></div>
                            <span className="text-right font-mono text-slate-500">{fmt(b.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {a.exceptions.length > 0 && (
                    <div className="min-w-0">
                      <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 mb-2">Exceptions to act on</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead><tr className="text-left text-slate-500 border-b border-slate-200"><th className="py-1 pr-2 font-semibold">Item</th><th className="py-1 pr-2 font-semibold">Issue</th><th className="py-1 text-right font-semibold">Value</th></tr></thead>
                          <tbody>
                            {a.exceptions.slice(0, 6).map((e, i) => (
                              <tr key={i} className="border-b border-slate-100"><td className="py-1 pr-2 text-slate-800 truncate max-w-[140px]">{e.item}</td><td className="py-1 pr-2 text-slate-500">{e.type}</td>
                                <td className="py-1 text-right font-mono">{fmt(e.value)}{e.expected != null && <span className="text-slate-400"> / {fmt(e.expected)}</span>}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* reply preview */}
                <div className="rounded-2xl bg-slate-900 text-slate-200 p-4 text-xs font-mono space-y-1">
                  <div className="text-teal-300 font-bold flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Auto-reply ready</div>
                  <div><span className="text-slate-500">To:</span> {senderAddr(result.email.from)}{result.triage.priority === 'High' && <span className="text-red-300"> · Escalation → team lead ({result.triage.reasons.join('; ')})</span>}</div>
                  <div><span className="text-slate-500">Subject:</span> Re: {result.email.subject}</div>
                  <div><span className="text-slate-500">Attached:</span> Insights report (.xlsx) — Insights, KPIs, Breakdown, Exceptions, Cleaned data</div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={downloadExcel} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold transition-colors">
                    <Download className="w-4 h-4" /> Download Excel report
                  </button>
                  <button onClick={onOpenConsultation} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors">
                    Automate my inbox <ArrowRight className="w-4 h-4 text-teal-400" />
                  </button>
                  <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold">
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
  );
  if (embedded) return body;
  return (
    <section id="email-demo" className="py-20 md:py-28 bg-white border-y border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-3.5 h-3.5 text-teal-600" /><span>Live Demo · Email Automation</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">Watch an Email Turn Into Insights</h2>
          <p className="text-base sm:text-lg text-slate-600">
            The automation reads each email, pulls the data from the attachment — or from the table in the email body when there is no attachment — then analyses it and replies with the findings.
          </p>
        </div>

        {body}
      </div>
    </section>
  );
};
