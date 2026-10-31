// AI Operational Agent on the visitor's own data: bank-statement ↔ open-invoice reconciliation.
import React, { useEffect, useState } from 'react';
import { Bot, Download, Brain, Wrench, Eye, CheckCircle2 } from 'lucide-react';
import { Table } from '../../lib/emailInsights';
import { Card, inr, Kpis, Label, MiniTable, Note, PrimaryButton, downloadXlsx } from '../demos/kit';
import { useAccess } from '../../auth/AccessProvider';
import { TrialBadge } from '../../auth/TrialBadge';
import { avgLen, ColSelect, FilePick, dateCols, numCols, pick, str, textCols, useTableFile } from './common';

const BANK_T = 'Date,Narration,Credit,Debit\n2026-09-15,NEFT-SHREE TRADERS-INV2401,48250,\n2026-09-15,RTGS APEX RETAIL PVT LTD,186000,\n2026-09-17,IMPS SUNRISE FOODS INV 2409 2410,112400,\n2026-09-17,BANK CHARGES GST,,590\n2026-09-18,NEFT BLUELEAF PHARMA LTD,311250,\n';
const AR_T = 'Invoice No,Customer,Invoice Date,Amount\nINV-2401,Shree Traders,2026-08-15,48250\nINV-2403,Apex Retail,2026-08-16,186000\nINV-2409,Sunrise Foods,2026-08-17,67400\nINV-2410,Sunrise Foods,2026-08-17,45000\nINV-2413,BlueLeaf Pharma,2026-08-19,312000\n';

type Conf = 'High' | 'Medium' | 'Review';
export interface ReconRow { date: string; narration: string; amount: number; invoices: string[]; customer: string; method: string; conf: Conf; diff: number; action: string }
interface Inv { ref: string; core: string; customer: string; ckey: string; amount: number; date: string }
export type AgentEv = { kind: 'thought' | 'tool' | 'obs' | 'done'; text: string };

const squash = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
const STOP = new Set(['PVT', 'LTD', 'LIMITED', 'PRIVATE', 'THE', 'AND', 'CO', 'COMPANY', 'INDIA', 'LLP', 'INC', 'CORP', 'ENTERPRISES', 'TRADING', 'SERVICES']);
const nameKeys = (n: string) => n.toUpperCase().split(/[^A-Z0-9]+/).filter(w => w.length >= 4 && !STOP.has(w));

export function reconcile(bank: Table, bc: { date: string; narr: string; amt: string; credit: string; debit: string }, ar: Table, ac: { ref: string; cust: string; amt: string; date: string }, tol = 0.02) {
  const ev: AgentEv[] = [];
  const invs: Inv[] = ar.rows.map(r => ({ ref: str(r[ac.ref]), core: str(r[ac.ref]).replace(/\D/g, ''), customer: ac.cust ? str(r[ac.cust]) : '', ckey: '', amount: Number(r[ac.amt]) || 0, date: ac.date ? str(r[ac.date]) : '' }))
    .filter(i => i.ref && i.amount).map(i => ({ ...i, ckey: squash(i.customer) }));
  const open = new Map(invs.map(i => [i.ref, i]));
  const lines = bank.rows.map(r => {
    const amount = bc.amt ? Number(r[bc.amt]) || 0 : (Number(r[bc.credit]) || 0) - (bc.debit ? Math.abs(Number(r[bc.debit]) || 0) : 0);
    return { date: str(r[bc.date]), narration: str(r[bc.narr]), amount };
  }).filter(l => l.amount !== 0);
  const credits = lines.filter(l => l.amount > 0);
  ev.push({ kind: 'thought', text: `Goal: match ${credits.length} bank credits (${inr(credits.reduce((s, l) => s + l.amount, 0))}) against ${invs.length} open invoices (${inr(invs.reduce((s, i) => s + i.amount, 0))}). Order: invoice reference → customer + exact amount → customer + combination → amount only → short/partial payments.` });
  ev.push({ kind: 'tool', text: `read_statement("${bank.name}") · read_open_items("${ar.name}")` });
  ev.push({ kind: 'obs', text: `${lines.length} bank lines (${lines.length - credits.length} debits), ${new Set(invs.map(i => i.customer)).size} customers with open items` });

  const close = (refs: Inv[]) => refs.forEach(i => open.delete(i.ref));
  const custOf = (n: string) => {
    const N = squash(n);
    const hits = [...new Set(invs.map(i => i.customer))].filter(c => { const k = squash(c); return (k.length >= 5 && N.includes(k)) || nameKeys(c).some(w => N.includes(w)); });
    return hits.length === 1 ? hits[0] : hits.sort((a, z) => squash(z).length - squash(a).length)[0] ?? '';
  };
  const near = (a: number, b: number) => Math.abs(a - b) < 1;
  const combos = (items: Inv[], target: number) => {
    const xs = items.slice(0, 18);
    for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
      if (near(xs[i].amount + xs[j].amount, target)) return [xs[i], xs[j]];
      for (let k = j + 1; k < xs.length; k++) if (near(xs[i].amount + xs[j].amount + xs[k].amount, target)) return [xs[i], xs[j], xs[k]];
    }
    return null;
  };
  const out: ReconRow[] = [];
  const push = (l: typeof lines[number], invoices: Inv[], method: string, conf: Conf, action: string, customer = invoices[0]?.customer ?? '') => {
    const diff = l.amount - invoices.reduce((s, i) => s + i.amount, 0);
    out.push({ ...l, invoices: invoices.map(i => i.ref), customer, method, conf, diff: invoices.length ? diff : 0, action });
  };

  lines.forEach(l => {
    if (l.amount < 0) { push(l, [], 'Debit — not a customer receipt', 'Review', /charge|fee|gst|sms|commission/i.test(l.narration) ? 'Post to Bank Charges GL' : 'Match to payables / expense'); return; }
    const N = squash(l.narration);
    const openList = [...open.values()];
    // 1. invoice references in the narration
    const refs = openList.filter(i => i.core.length >= 3 && (N.includes(squash(i.ref)) || N.includes(i.core)));
    if (refs.length) {
      const sum = refs.reduce((s, i) => s + i.amount, 0);
      if (near(sum, l.amount)) { close(refs); push(l, refs, `Reference in narration (${refs.map(r => r.ref).join(' + ')})`, 'High', 'Apply cash'); ev.push({ kind: 'obs', text: `"${l.narration}" quotes ${refs.map(r => r.ref).join(', ')} and the amount agrees → matched.` }); return; }
      if (l.amount < sum && sum - l.amount <= sum * tol) { close(refs); push(l, refs, 'Reference — short-paid', 'Medium', `Short by ${inr(sum - l.amount)} — check TDS / discount / bank charges, then write off or chase`); ev.push({ kind: 'thought', text: `${refs[0].ref}: received ${inr(l.amount)} vs ${inr(sum)} — difference ${inr(sum - l.amount)} is within ${tol * 100}%, likely TDS or a deduction.` }); return; }
      if (l.amount < sum) { push(l, refs, 'Reference — partial payment', 'Medium', `Apply as part payment; ${inr(sum - l.amount)} stays open`); ev.push({ kind: 'thought', text: `${refs[0].ref} quoted but only ${inr(l.amount)} of ${inr(sum)} paid → partial payment.` }); return; }
    }
    // 2. customer name in the narration
    const cust = custOf(l.narration);
    if (cust) {
      const mine = openList.filter(i => i.customer === cust);
      const exact = mine.find(i => near(i.amount, l.amount));
      if (exact) { close([exact]); push(l, [exact], 'Customer name + exact amount', 'High', 'Apply cash'); return; }
      const combo = combos(mine, l.amount);
      if (combo) { close(combo); push(l, combo, `Customer + ${combo.length} invoices add up`, 'Medium', 'Apply cash across invoices'); ev.push({ kind: 'thought', text: `${cust} paid ${inr(l.amount)} with no reference; ${combo.map(c => c.ref).join(' + ')} add up exactly.` }); return; }
      const short = mine.find(i => l.amount < i.amount && i.amount - l.amount <= i.amount * tol);
      if (short) { close([short]); push(l, [short], 'Customer — short-paid', 'Medium', `Short by ${inr(short.amount - l.amount)} — check TDS / deductions`); return; }
      const bigger = mine.filter(i => i.amount > l.amount).sort((x, y) => x.date.localeCompare(y.date));
      if (bigger.length) { push(l, [bigger[0]], 'Customer — partial payment (oldest invoice)', 'Review', `Apply as part payment to ${bigger[0].ref}; ${inr(bigger[0].amount - l.amount)} stays open — confirm with customer`); ev.push({ kind: 'thought', text: `${cust} paid ${inr(l.amount)}, less than any single open invoice — proposing part payment against the oldest, ${bigger[0].ref}.` }); return; }
      if (mine.length) { push(l, [], 'Customer identified, amount does not fit', 'Review', `Ask ${cust} for remittance advice; hold as on-account`, cust); ev.push({ kind: 'thought', text: `${inr(l.amount)} from ${cust} doesn't match any combination of their ${mine.length} open invoices → request remittance advice.` }); return; }
    }
    // 3. unique amount
    const same = openList.filter(i => near(i.amount, l.amount));
    if (same.length === 1) { close(same); push(l, same, 'Amount only (unique)', 'Review', 'Confirm with customer before applying'); ev.push({ kind: 'thought', text: `No name or reference in "${l.narration}", but only ${same[0].ref} (${same[0].customer}) has exactly ${inr(l.amount)} — suggest, needs confirmation.` }); return; }
    push(l, [], 'Unidentified receipt', 'Review', 'Park in suspense; ask bank for remitter details');
  });
  const stillOpen = [...open.values()];
  const hi = out.filter(o => o.conf === 'High').length, med = out.filter(o => o.conf === 'Medium').length;
  ev.push({ kind: 'done', text: `Done: ${hi} high-confidence and ${med} medium matches; ${out.filter(o => o.conf === 'Review' && o.amount > 0).length} receipts need review; ${stillOpen.length} invoices still open (${inr(stillOpen.reduce((s, i) => s + i.amount, 0))}).` });
  return { rows: out, stillOpen, ev };
}

export const ReconTool: React.FC = () => {
  const { requestRun } = useAccess();
  const bank = useTableFile(), ar = useTableFile();
  const [bc, setBc] = useState({ date: '', narr: '', amt: '', credit: '', debit: '' });
  const [ac, setAc] = useState({ ref: '', cust: '', amt: '', date: '' });
  const [res, setRes] = useState<ReturnType<typeof reconcile> | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = bank.table; if (!t) return;
    const nums = numCols(t), texts = textCols(t);
    const credit = nums.find(c => /credit|deposit|cr\b|receipt/i.test(c)) ?? '', debit = nums.find(c => /debit|withdraw|dr\b|payment/i.test(c)) ?? '';
    setBc({ date: dateCols(t)[0] ?? t.columns[0], narr: [...texts].sort((a, z) => avgLen(t, z) - avgLen(t, a))[0] ?? '', credit, debit, amt: credit ? '' : pick(nums, /amount|value/i) });
    setRes(null);
  }, [bank.table]);
  useEffect(() => {
    const t = ar.table; if (!t) return;
    setAc({ ref: pick(t.columns, /inv|bill|doc|ref|number|no\b/i), cust: pick(textCols(t), /customer|client|party|name|account/i, ''), amt: pick(numCols(t), /open|balance|outstanding|amount|value|due/i), date: dateCols(t)[0] ?? '' });
    setRes(null);
  }, [ar.table]);

  const run = async () => {
    if (!bank.table || !ar.table) return;
    if (!(await requestRun('ai-agents', { bank: bank.table.rows.length, ar: ar.table.rows.length }))) return;
    setBusy(true); await new Promise(r => setTimeout(r, 500));
    setRes(reconcile(bank.table, bc, ar.table, ac)); setBusy(false);
  };
  const download = () => res && downloadXlsx('Bank_reconciliation.xlsx', [
    { name: 'Reconciliation', header: ['Bank date', 'Narration', 'Amount', 'Invoices', 'Customer', 'How matched', 'Confidence', 'Difference', 'Suggested action'],
      rows: res.rows.map(r => [r.date, r.narration, r.amount, r.invoices.join(', '), r.customer, r.method, r.conf, r.diff || null, r.action]) },
    { name: 'Still open', header: ['Invoice', 'Customer', 'Date', 'Amount'], rows: res.stillOpen.map(i => [i.ref, i.customer, i.date, i.amount]) },
    { name: 'Agent log', header: ['Step', 'Detail'], rows: res.ev.map(e => [e.kind, e.text]) },
  ]);
  const icon = { thought: Brain, tool: Wrench, obs: Eye, done: CheckCircle2 };
  const credits = res?.rows.filter(r => r.amount > 0) ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4 min-w-0">
        <Card className="!p-4 space-y-3">
          <Label>1 · Bank statement</Label>
          <FilePick label="Upload bank statement" hint="Date, narration and amount (or credit/debit)" table={bank.table} onFile={bank.load} err={bank.err} template={{ name: 'bank_statement_template.csv', csv: BANK_T }} />
          {bank.table && (
            <div className="grid grid-cols-2 gap-2">
              <ColSelect label="Date" value={bc.date} options={bank.table.columns} onChange={v => setBc({ ...bc, date: v })} />
              <ColSelect label="Narration" value={bc.narr} options={textCols(bank.table)} onChange={v => setBc({ ...bc, narr: v })} />
              <ColSelect label="Credit column" value={bc.credit} options={numCols(bank.table)} onChange={v => setBc({ ...bc, credit: v, amt: v ? '' : bc.amt })} allowNone />
              <ColSelect label="Debit column" value={bc.debit} options={numCols(bank.table)} onChange={v => setBc({ ...bc, debit: v })} allowNone />
              {!bc.credit && <ColSelect label="Signed amount" value={bc.amt} options={numCols(bank.table)} onChange={v => setBc({ ...bc, amt: v })} />}
            </div>
          )}
          <Label>2 · Open invoices (AR ageing / ledger)</Label>
          <FilePick label="Upload open invoices" hint="Invoice no, customer and amount" table={ar.table} onFile={ar.load} err={ar.err} template={{ name: 'open_invoices_template.csv', csv: AR_T }} />
          {ar.table && (
            <div className="grid grid-cols-2 gap-2">
              <ColSelect label="Invoice no" value={ac.ref} options={ar.table.columns} onChange={v => setAc({ ...ac, ref: v })} />
              <ColSelect label="Customer" value={ac.cust} options={textCols(ar.table)} onChange={v => setAc({ ...ac, cust: v })} allowNone />
              <ColSelect label="Open amount" value={ac.amt} options={numCols(ar.table)} onChange={v => setAc({ ...ac, amt: v })} />
              <ColSelect label="Invoice date" value={ac.date} options={dateCols(ar.table)} onChange={v => setAc({ ...ac, date: v })} allowNone />
            </div>
          )}
          <PrimaryButton icon={Bot} busy={busy} disabled={!bank.table || !ar.table} onClick={run}>Run reconciliation agent</PrimaryButton>
          <TrialBadge tool="ai-agents" />
          <Note>The agent matches by invoice reference, customer name + amount, invoice combinations and unique amounts, and flags short payments (within 2%) and partial payments. Nothing is posted — you get a proposal to approve.</Note>
        </Card>
      </div>
      <div className="lg:col-span-8 space-y-4 min-w-0">
        {!res ? (
          <Card className="text-sm text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">What you'll get</div>
            <ul className="list-disc pl-5 space-y-1">
              <li>Each bank credit matched to invoices, with how and how confident</li><li>Short payments, partial payments and unidentified receipts flagged with next action</li>
              <li>Invoices still open after the run</li><li>The agent's reasoning log and an Excel file ready for posting review</li>
            </ul>
          </Card>
        ) : (<>
          <Kpis items={[
            { label: 'Receipts matched', value: `${credits.filter(r => r.invoices.length).length}/${credits.length}`, tone: 'good' },
            { label: 'Value matched', value: inr(credits.filter(r => r.invoices.length).reduce((s, r) => s + r.amount, 0)) },
            { label: 'Need review', value: String(credits.filter(r => r.conf === 'Review').length), tone: 'bad' },
            { label: 'Invoices still open', value: String(res.stillOpen.length), sub: inr(res.stillOpen.reduce((s, i) => s + i.amount, 0)) },
          ]} />
          <Card>
            <Label>Agent log</Label>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {res.ev.map((e, i) => { const I = icon[e.kind]; return <div key={i} className="flex gap-2 text-xs text-slate-700"><I className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${e.kind === 'done' ? 'text-teal-600' : 'text-slate-400'}`} /><span>{e.text}</span></div>; })}
            </div>
          </Card>
          <Card>
            <Label>Proposed matches</Label>
            <MiniTable max={15} head={['Date', 'Narration', 'Amount', 'Invoices', 'How', 'Conf.', 'Action']} align={['l', 'l', 'r', 'l', 'l', 'l', 'l']}
              rows={res.rows.map(r => [r.date, r.narration, inr(r.amount), r.invoices.join(', '), r.method,
                <span className={`px-1.5 rounded text-[10px] font-bold ${r.conf === 'High' ? 'bg-emerald-100 text-emerald-700' : r.conf === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{r.conf}</span>, r.action])} />
          </Card>
          <button onClick={download} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold"><Download className="w-4 h-4" /> Download reconciliation (Excel)</button>
        </>)}
      </div>
    </div>
  );
};
