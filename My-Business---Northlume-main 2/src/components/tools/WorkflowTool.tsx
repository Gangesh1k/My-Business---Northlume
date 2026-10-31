// Workflow Automation on the visitor's own list of requests / tickets / disputes:
// classify each one, route it to a team with an SLA and priority, and produce the work queues.
import React, { useEffect, useState } from 'react';
import { GitBranch, Download, RotateCcw } from 'lucide-react';
import { Table } from '../../lib/emailInsights';
import { Bars, Card, inr, Kpis, Label, MiniTable, Note, PrimaryButton, downloadXlsx } from '../demos/kit';
import { useAccess } from '../../auth/AccessProvider';
import { TrialBadge } from '../../auth/TrialBadge';
import { avgLen, ColSelect, FilePick, dateCols, numCols, pick, str, textCols, useTableFile } from './common';

export interface Rule { category: string; keywords: string; team: string; slaH: number; action: string }
export const DEFAULT_RULES: Rule[] = [
  { category: 'Payment already made', keywords: 'already paid, already made, utr, neft, rtgs, paid on, remittance, payment advice, cheque', team: 'Cash Applications', slaH: 8, action: 'Match UTR/remittance in bank feed, apply cash, clear overdue' },
  { category: 'Duplicate billing', keywords: 'duplicate, billed twice, double charged, charged twice', team: 'Billing Ops', slaH: 8, action: 'Verify duplicate in ERP and cancel' },
  { category: 'Pricing / rate mismatch', keywords: 'price, rate, contract, po price, overcharged, higher than', team: 'Pricing Desk', slaH: 24, action: 'Compare with contract/PO; credit note for difference' },
  { category: 'Discount not applied', keywords: 'discount, rebate, scheme, offer', team: 'Pricing Desk', slaH: 24, action: 'Check eligibility; credit note' },
  { category: 'Tax / GST error', keywords: 'gst, tax, hsn, igst, cgst, sgst, tds, vat', team: 'Tax & Compliance', slaH: 48, action: 'Validate tax rate; revised tax invoice' },
  { category: 'Short / wrong delivery', keywords: 'short, missing, wrong sku, wrong item, not received, not delivered, quantity', team: 'Logistics', slaH: 48, action: 'Match POD vs invoice; replacement or credit' },
  { category: 'Damaged goods', keywords: 'damage, damaged, broken, leak, defective, expired', team: 'Logistics', slaH: 72, action: 'Raise claim; schedule pickup' },
  { category: 'Invoice / statement copy', keywords: 'copy of invoice, invoice copy, statement, soa, ledger, resend invoice, send invoice', team: 'AR Helpdesk', slaH: 24, action: 'Send invoice copy / statement of account' },
  { category: 'Refund request', keywords: 'refund, return the amount, reimburse, excess payment', team: 'Cash Applications', slaH: 48, action: 'Validate excess and process refund' },
  { category: 'Master data change', keywords: 'address change, bank details, change of bank, gstin, update email, new address, vendor registration', team: 'Master Data', slaH: 24, action: 'Verify documents; update master record' },
  { category: 'Payment status query', keywords: 'when will, payment status, not received payment, pending payment, due date, overdue', team: 'AP / AR Helpdesk', slaH: 24, action: 'Check status in ERP and reply with date' },
  { category: 'Complaint / escalation', keywords: 'complaint, escalate, unacceptable, legal, disappointed, worst', team: 'Team Lead', slaH: 4, action: 'Call customer; own resolution' },
];
const URGENT = /urgent|asap|immediately|today|critical|legal notice|escalat|final reminder/i;
const TEMPLATE = 'Ticket ID,Received,Customer,Amount,Description\nT-101,2026-09-20,Apex Retail,186000,We were charged a higher rate than the contract price\nT-102,2026-09-20,Metro Mart,94000,40 cartons short delivered - please issue credit\nT-103,2026-09-21,Shree Traders,128000,Payment already made via NEFT on 12 Sep UTR attached\nT-104,2026-09-21,Kiran Stores,5800,Please send a copy of invoice 88302 urgently\n';

export interface Routed { id: string; customer: string; amount: number | null; text: string; category: string; team: string; action: string; priority: 'P1' | 'P2' | 'P3'; slaH: number; due: Date | null; matched: string; why: string }

export function routeAll(t: Table, c: { id: string; text: string; customer: string; amount: string; date: string }, rules: Rule[], threshold: number): Routed[] {
  const compiled = rules.map(r => ({ r, kws: r.keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean) }));
  return t.rows.map((row, i) => {
    const text = str(row[c.text]); const low = text.toLowerCase();
    let best: { r: Rule; hits: string[] } | null = null;
    compiled.forEach(({ r, kws }) => { const hits = kws.filter(k => low.includes(k)); if (hits.length && (!best || hits.length > best.hits.length)) best = { r, hits }; });
    const b = best as { r: Rule; hits: string[] } | null;
    const amount = c.amount ? (typeof row[c.amount] === 'number' ? (row[c.amount] as number) : null) : null;
    const urgent = URGENT.test(text), big = amount != null && amount >= threshold;
    const cat = b?.r ?? { category: 'Unclassified', team: 'Triage (manual)', slaH: 24, action: 'Read and assign manually', keywords: '' };
    const priority: Routed['priority'] = urgent || big || cat.slaH <= 8 ? 'P1' : cat.slaH <= 24 ? 'P2' : 'P3';
    const slaH = priority === 'P1' ? Math.min(cat.slaH, 8) : cat.slaH;
    const start = c.date && row[c.date] instanceof Date ? (row[c.date] as Date) : null;
    const why = [b ? `keywords: ${b.hits.join(', ')}` : 'no rule matched', urgent ? 'urgent wording' : '', big ? `amount ≥ ${inr(threshold)}` : ''].filter(Boolean).join(' · ');
    return { id: c.id ? str(row[c.id]) : `#${i + 1}`, customer: c.customer ? str(row[c.customer]) : '', amount, text, category: cat.category, team: cat.team, action: cat.action,
      priority, slaH, due: start ? new Date(+start + slaH * 36e5) : null, matched: b?.hits.join(', ') ?? '', why };
  }).sort((a, z) => a.priority.localeCompare(z.priority) || (z.amount ?? 0) - (a.amount ?? 0));
}

export const WorkflowTool: React.FC = () => {
  const { requestRun } = useAccess();
  const { table, err, load } = useTableFile();
  const [c, setC] = useState({ id: '', text: '', customer: '', amount: '', date: '' });
  const [rules, setRules] = useState<Rule[]>(DEFAULT_RULES);
  const [threshold, setThreshold] = useState(100000);
  const [out, setOut] = useState<Routed[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    if (!table) return;
    const texts = textCols(table);
    const text = [...texts].sort((a, z) => avgLen(table, z) - avgLen(table, a))[0] ?? '';
    setC({ text, id: pick(texts.filter(x => x !== text), /id|ticket|ref|no\b|number|case/i, ''), customer: pick(texts.filter(x => x !== text), /customer|client|vendor|party|name|account/i, ''),
      amount: pick(numCols(table), /amount|value|inr|usd|total|balance/i, numCols(table)[0] ?? ''), date: dateCols(table)[0] ?? '' });
    setOut(null);
  }, [table]);

  const run = async () => {
    if (!table || !c.text) return;
    if (!(await requestRun('workflow-automation', { rows: table.rows.length }))) return;
    setBusy(true); await new Promise(r => setTimeout(r, 400));
    setOut(routeAll(table, c, rules, threshold)); setBusy(false);
  };
  const count = (k: keyof Routed) => { const m = new Map<string, number>(); out?.forEach(o => m.set(String(o[k]), (m.get(String(o[k])) ?? 0) + 1)); return [...m].sort((a, z) => z[1] - a[1]).map(([label, value]) => ({ label, value })); };
  const setRule = (i: number, patch: Partial<Rule>) => setRules(rs => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const download = () => {
    if (!out) return;
    const head = ['Priority', 'ID', 'Customer', 'Amount', 'Category', 'Team', 'SLA (h)', 'Due by', 'Next action', 'Request text', 'Why'];
    const row = (o: Routed) => [o.priority, o.id, o.customer, o.amount, o.category, o.team, o.slaH, o.due, o.action, o.text, o.why];
    const teams = Array.from(new Set<string>(out.map(o => o.team)));
    downloadXlsx('Routed_work_queue.xlsx', [
      { name: 'All requests', header: head, rows: out.map(row) },
      { name: 'Summary', header: ['Team', 'Requests', 'P1', 'Value'], rows: teams.map(t => { const x = out.filter(o => o.team === t); return [t, x.length, x.filter(o => o.priority === 'P1').length, x.reduce((s, o) => s + (o.amount ?? 0), 0)]; }) },
      ...teams.slice(0, 12).map(t => ({ name: t.replace(/[\\/?*[\]:]/g, ' '), header: head, rows: out.filter(o => o.team === t).map(row) })),
      { name: 'Rules used', header: ['Category', 'Keywords', 'Team', 'SLA (h)', 'Action'], rows: rules.map(r => [r.category, r.keywords, r.team, r.slaH, r.action]) },
    ]);
  };

  const input = 'w-full px-2 py-1 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:border-teal-500';
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4 min-w-0">
        <Card className="!p-4 space-y-3">
          <Label>Your requests</Label>
          <FilePick label="Upload tickets / disputes / emails list" hint="Excel or CSV with one request per row" table={table} onFile={load} err={err} template={{ name: 'workflow_template.csv', csv: TEMPLATE }} />
          {table && (
            <div className="grid grid-cols-2 gap-2">
              <ColSelect label="Request text" value={c.text} options={textCols(table)} onChange={v => setC({ ...c, text: v })} />
              <ColSelect label="ID / reference" value={c.id} options={table.columns} onChange={v => setC({ ...c, id: v })} allowNone />
              <ColSelect label="Customer / vendor" value={c.customer} options={textCols(table)} onChange={v => setC({ ...c, customer: v })} allowNone />
              <ColSelect label="Amount" value={c.amount} options={numCols(table)} onChange={v => setC({ ...c, amount: v })} allowNone />
              <ColSelect label="Received date" value={c.date} options={dateCols(table)} onChange={v => setC({ ...c, date: v })} allowNone />
              <label className="block text-[11px] font-semibold text-slate-600">Escalate if amount ≥
                <input type="number" value={threshold} onChange={e => setThreshold(+e.target.value || 0)} className="mt-0.5 w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs" />
              </label>
            </div>
          )}
          <button type="button" onClick={() => setShowRules(s => !s)} className="text-xs font-semibold text-teal-700 hover:underline">{showRules ? 'Hide' : 'Edit'} routing rules ({rules.length})</button>
          {showRules && (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {rules.map((r, i) => (
                <div key={i} className="rounded-xl border border-slate-200 p-2 space-y-1 bg-slate-50">
                  <div className="text-[11px] font-bold text-slate-800">{r.category}</div>
                  <input className={input} value={r.keywords} onChange={e => setRule(i, { keywords: e.target.value })} title="Keywords (comma separated)" />
                  <div className="grid grid-cols-[1fr_64px] gap-1">
                    <input className={input} value={r.team} onChange={e => setRule(i, { team: e.target.value })} title="Team" />
                    <input className={input} type="number" value={r.slaH} onChange={e => setRule(i, { slaH: +e.target.value || 24 })} title="SLA hours" />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setRules(DEFAULT_RULES)} className="inline-flex items-center gap-1 text-[11px] text-slate-500"><RotateCcw className="w-3 h-3" /> Reset rules</button>
            </div>
          )}
          <PrimaryButton icon={GitBranch} busy={busy} disabled={!table || !c.text} onClick={run}>Classify & route</PrimaryButton>
          <TrialBadge tool="workflow-automation" />
          <Note>Each row is matched to a rule by keywords, given a team, SLA and priority (P1 for urgent wording, high amounts or short SLAs). Edit the rules to fit your process.</Note>
        </Card>
      </div>
      <div className="lg:col-span-8 space-y-4 min-w-0">
        {!out ? (
          <Card className="text-sm text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">What you'll get</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Every request classified with the reason it matched</li><li>Owner team, priority and SLA due time</li>
              <li>Workload by team and category, plus unclassified items to review</li><li>An Excel work queue with one sheet per team</li>
            </ul>
          </Card>
        ) : (<>
          <Kpis items={[
            { label: 'Requests', value: String(out.length) },
            { label: 'Auto-classified', value: `${((100 * out.filter(o => o.category !== 'Unclassified').length) / (out.length || 1)).toFixed(0)}%`, tone: 'good' },
            { label: 'P1 — act today', value: String(out.filter(o => o.priority === 'P1').length), tone: 'bad' },
            { label: 'Value in queue', value: inr(out.reduce((s, o) => s + (o.amount ?? 0), 0)) },
          ]} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><Bars title="Workload by team" rows={count('team').slice(0, 10)} /></Card>
            <Card><Bars title="Requests by category" rows={count('category').slice(0, 10).map(x => ({ ...x, flag: x.label === 'Unclassified' }))} /></Card>
          </div>
          <Card>
            <Label>Routed queue (highest priority first)</Label>
            <MiniTable max={15} head={['Pri', 'ID', 'Customer', 'Amount', 'Category', 'Team', 'Due', 'Why']} align={['l', 'l', 'l', 'r', 'l', 'l', 'l', 'l']}
              rows={out.map(o => [<span className={`px-1.5 rounded text-[10px] font-bold ${o.priority === 'P1' ? 'bg-red-100 text-red-700' : o.priority === 'P2' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{o.priority}</span>,
                o.id, o.customer, o.amount == null ? '' : inr(o.amount), o.category, o.team, o.due ? o.due.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : `${o.slaH}h`, <span className="text-slate-500">{o.why}</span>])} />
          </Card>
          <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold"><Download className="w-4 h-4" /> Download work queues (Excel)</button>
        </>)}
      </div>
    </div>
  );
};
