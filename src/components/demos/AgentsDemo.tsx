import React, { useRef, useState } from 'react';
import { Bot, Scale, MessagesSquare, ShieldCheck, Play, Brain, Wrench, Eye, CheckCircle2, ArrowRight, Download, Mail } from 'lucide-react';
import { Card, downloadXlsx, inr, Kpis, Label, MiniTable, Note, PrimaryButton, sleep, SmallButton } from './kit';

type Ev = { kind: 'thought' | 'tool' | 'obs' | 'done'; text: string };
interface Output { kpis: { label: string; value: string; sub?: string; tone?: 'good' | 'bad' }[]; table: { head: string[]; rows: string[][] }; drafts: { to: string; subject: string; body: string }[]; sheet: { name: string; header: string[]; rows: (string | number)[][] } }
interface AgentDef { id: string; name: string; icon: React.ElementType; goal: string; inputs: string; run: () => { events: Ev[]; output: Output } }

// ======================= 1. Reconciliation agent
const BANK = [
  { date: '15-09', narration: 'NEFT-SHREE TRADERS-INV2401', amount: 48250 }, { date: '15-09', narration: 'RTGS APEX RETAIL PVT LTD', amount: 186000 },
  { date: '16-09', narration: 'UPI/METROMART/PAYMENT', amount: 94000 }, { date: '16-09', narration: 'NEFT KIRAN STORES', amount: 30000 },
  { date: '17-09', narration: 'IMPS SUNRISE FOODS INV 2409 2410', amount: 112400 }, { date: '17-09', narration: 'BANK CHARGES GST', amount: -590 },
  { date: '18-09', narration: 'NEFT-OM DISTRIBUTORS', amount: 64820 }, { date: '18-09', narration: 'NEFT BLUELEAF PHARMA LTD', amount: 311250 },
  { date: '19-09', narration: 'CHQ DEP 004512', amount: 27500 }, { date: '19-09', narration: 'RTGS NOVA ELECTRONICS', amount: 41000 },
];
const AR = [
  { inv: 'INV-2401', customer: 'Shree Traders', amount: 48250, due: '14-09' }, { inv: 'INV-2403', customer: 'Apex Retail', amount: 186000, due: '15-09' },
  { inv: 'INV-2404', customer: 'Metro Mart', amount: 94000, due: '12-09' }, { inv: 'INV-2406', customer: 'Kiran Stores', amount: 58000, due: '10-09' },
  { inv: 'INV-2409', customer: 'Sunrise Foods', amount: 67400, due: '16-09' }, { inv: 'INV-2410', customer: 'Sunrise Foods', amount: 45000, due: '16-09' },
  { inv: 'INV-2412', customer: 'Om Distributors', amount: 64820, due: '20-09' }, { inv: 'INV-2413', customer: 'BlueLeaf Pharma', amount: 312000, due: '18-09' },
  { inv: 'INV-2415', customer: 'Nova Electronics', amount: 41000, due: '19-09' }, { inv: 'INV-2417', customer: 'Gupta Agencies', amount: 27500, due: '22-09' },
  { inv: 'INV-2418', customer: 'Apex Retail', amount: 72300, due: '25-09' },
];
const squash = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
function reconAgent() {
  const ev: Ev[] = []; const rows: string[][] = []; const drafts: Output['drafts'] = []; const open = new Set(AR.map(a => a.inv));
  ev.push({ kind: 'thought', text: 'Goal: match 10 bank credits from 19 Sep statement against 11 open receivables. Start with exact reference matches, then amount + name, then combinations.' });
  ev.push({ kind: 'tool', text: 'bank.fetch_statement(account="HDFC-CA-0921", from="15-09", to="19-09")' });
  ev.push({ kind: 'obs', text: `${BANK.length} transactions, ${inr(BANK.filter(b => b.amount > 0).reduce((s, b) => s + b.amount, 0))} credits` });
  ev.push({ kind: 'tool', text: 'erp.get_open_invoices(status="open")' });
  ev.push({ kind: 'obs', text: `${AR.length} open invoices, ${inr(AR.reduce((s, a) => s + a.amount, 0))}` });
  let matched = 0, value = 0;
  BANK.forEach(b => {
    const n = squash(b.narration);
    if (b.amount < 0) { rows.push([b.date, b.narration, inr(b.amount), '—', 'Bank charge → post to 6420 Bank Charges']); ev.push({ kind: 'thought', text: `"${b.narration}" is a debit for bank fees — not a customer receipt. Suggest GL posting.` }); return; }
    const refs = AR.filter(a => open.has(a.inv) && n.includes(a.inv.replace('INV-', '')));
    if (refs.length && Math.abs(refs.reduce((s, a) => s + a.amount, 0) - b.amount) < 1) {
      refs.forEach(a => open.delete(a.inv)); matched += refs.length; value += b.amount;
      rows.push([b.date, b.narration, inr(b.amount), refs.map(a => a.inv).join(' + '), refs.length > 1 ? 'Matched · one payment for 2 invoices' : 'Matched · reference in narration']);
      ev.push({ kind: 'obs', text: `Exact: ${b.narration} → ${refs.map(a => a.inv).join(' + ')}` }); return;
    }
    const byName = AR.filter(a => open.has(a.inv) && n.includes(squash(a.customer).slice(0, 8)));
    const exact = byName.find(a => Math.abs(a.amount - b.amount) < 1);
    if (exact) { open.delete(exact.inv); matched++; value += b.amount; rows.push([b.date, b.narration, inr(b.amount), exact.inv, 'Matched · customer name + amount']); ev.push({ kind: 'obs', text: `Name+amount: ${b.narration} → ${exact.inv}` }); return; }
    const near = byName.find(a => Math.abs(a.amount - b.amount) / a.amount < 0.01);
    if (near) {
      open.delete(near.inv); matched++; value += b.amount;
      ev.push({ kind: 'thought', text: `${near.customer} paid ${inr(b.amount)} against ${inr(near.amount)} — ${inr(near.amount - b.amount)} short, looks like TDS/short-payment.` });
      rows.push([b.date, b.narration, inr(b.amount), near.inv, `Matched with ${inr(near.amount - b.amount)} short-pay → raise query`]);
      drafts.push({ to: `accounts@${near.customer.split(' ')[0].toLowerCase()}.demo`, subject: `Short payment against ${near.inv}`, body: `Dear ${near.customer} team,\n\nThank you for your payment of ${inr(b.amount)} received on ${b.date}. Invoice ${near.inv} is for ${inr(near.amount)}, leaving a balance of ${inr(near.amount - b.amount)}.\n\nIf this is TDS, please share the TDS certificate; otherwise kindly arrange the balance.\n\nRegards,\nAccounts Receivable` });
      return;
    }
    const partial = byName.find(a => b.amount < a.amount);
    if (partial) {
      matched++; value += b.amount;
      ev.push({ kind: 'thought', text: `${partial.customer} paid ${inr(b.amount)} of ${inr(partial.amount)} — part payment. Keep invoice open with balance ${inr(partial.amount - b.amount)}.` });
      rows.push([b.date, b.narration, inr(b.amount), partial.inv, `Part payment · ${inr(partial.amount - b.amount)} still open`]); return;
    }
    const byAmt = AR.filter(a => open.has(a.inv) && Math.abs(a.amount - b.amount) < 1);
    if (byAmt.length === 1) {
      ev.push({ kind: 'thought', text: `"${b.narration}" has no name, but amount ${inr(b.amount)} equals only ${byAmt[0].inv} (${byAmt[0].customer}). Suggest match, needs human confirmation.` });
      rows.push([b.date, b.narration, inr(b.amount), byAmt[0].inv, 'Suggested · amount only — confirm']); return;
    }
    rows.push([b.date, b.narration, inr(b.amount), '—', 'Unmatched → investigate']);
  });
  const stillOpen = AR.filter(a => open.has(a.inv) && !rows.some(r => r[3].includes(a.inv)));
  ev.push({ kind: 'tool', text: 'erp.post_receipts(matches=' + matched + ', mode="draft")' });
  ev.push({ kind: 'obs', text: 'Draft receipts created in ERP, awaiting approval' });
  ev.push({ kind: 'done', text: `Reconciled ${matched} invoices worth ${inr(value)}. ${rows.filter(r => /Suggested|short|Part/.test(r[4])).length} items need a quick human check. ${stillOpen.length} invoices still unpaid: ${stillOpen.map(a => a.inv).join(', ')}.` });
  return { events: ev, output: {
    kpis: [{ label: 'Auto-matched', value: `${rows.filter(r => r[4].startsWith('Matched')).length}/${BANK.filter(b => b.amount > 0).length}`, sub: 'bank credits', tone: 'good' as const },
      { label: 'Cash applied', value: inr(value) }, { label: 'Needs review', value: String(rows.filter(r => /Suggested|short|Part|Unmatched/.test(r[4])).length), tone: 'bad' as const }, { label: 'Still unpaid', value: String(stillOpen.length), sub: inr(stillOpen.reduce((s, a) => s + a.amount, 0)) }],
    table: { head: ['Date', 'Bank narration', 'Amount', 'Invoice', 'Agent decision'], rows },
    drafts, sheet: { name: 'Reconciliation', header: ['Date', 'Narration', 'Amount', 'Invoice', 'Decision'], rows } } };
}

// ======================= 2. Vendor query assistant
const AP = [
  { inv: 'VB-7781', vendor: 'Kalpana Packaging', amount: 84500, status: 'Approved', pay: '26-Sep-2026' }, { inv: 'VB-7790', vendor: 'Rathi Logistics', amount: 212000, status: 'On hold – GRN pending', pay: '' },
  { inv: 'VB-7802', vendor: 'Sai Chemicals', amount: 56300, status: 'Paid', pay: '19-Sep-2026', utr: 'HDFCR52026091934' }, { inv: 'VB-7815', vendor: 'Kalpana Packaging', amount: 39000, status: 'Rejected – PO mismatch', pay: '' },
  { inv: 'VB-7820', vendor: 'Mehta Electricals', amount: 17800, status: 'Under approval (L2)', pay: '30-Sep-2026' },
];
const QUERIES = [
  { from: 'accounts@kalpanapack.demo', vendor: 'Kalpana Packaging', text: 'Hi, please share payment status of our invoices VB-7781 and VB-7815.' },
  { from: 'billing@rathilogistics.demo', vendor: 'Rathi Logistics', text: 'Invoice VB-7790 of ₹2.12 L is overdue by 10 days. When will it be paid?' },
  { from: 'ar@saichem.demo', vendor: 'Sai Chemicals', text: 'We have not received payment for VB-7802. Kindly check.' },
  { from: 'office@mehtaelec.demo', vendor: 'Mehta Electricals', text: 'Can you confirm when VB-7820 will be released?' },
];
function vendorAgent() {
  const ev: Ev[] = []; const rows: string[][] = []; const drafts: Output['drafts'] = [];
  ev.push({ kind: 'thought', text: `Goal: answer ${QUERIES.length} vendor payment queries from the AP mailbox using live ERP status, and draft replies. Escalate anything blocked internally.` });
  ev.push({ kind: 'tool', text: 'mail.list(folder="AP-Queries", unread=true)' });
  ev.push({ kind: 'obs', text: `${QUERIES.length} unread vendor emails` });
  QUERIES.forEach(q => {
    const ids = q.text.match(/VB-\d+/g) ?? [];
    ev.push({ kind: 'tool', text: `erp.invoice_status(${ids.map(i => `"${i}"`).join(', ')})` });
    const found = ids.map(i => AP.find(a => a.inv === i)!).filter(Boolean);
    ev.push({ kind: 'obs', text: found.map(f => `${f.inv}: ${f.status}${f.pay ? ` · ${f.pay}` : ''}`).join(' | ') });
    const lines = found.map(f => f.status === 'Paid' ? `• ${f.inv} (${inr(f.amount)}) was paid on ${f.pay}, UTR ${(f as any).utr}. Please check with your bank using this reference.`
      : f.status === 'Approved' ? `• ${f.inv} (${inr(f.amount)}) is approved and scheduled for payment on ${f.pay}.`
        : f.status.startsWith('On hold') ? `• ${f.inv} (${inr(f.amount)}) is on hold because the goods receipt (GRN) is still pending at our warehouse. We have asked the team to complete it and will update you within 2 working days.`
          : f.status.startsWith('Rejected') ? `• ${f.inv} (${inr(f.amount)}) could not be processed because it does not match the PO. Please send a corrected invoice quoting the correct PO number.`
            : `• ${f.inv} (${inr(f.amount)}) is in final approval; expected payment date ${f.pay}.`);
    found.forEach(f => rows.push([q.vendor, f.inv, inr(f.amount), f.status, /hold|Rejected/.test(f.status) ? 'Reply + internal escalation' : 'Reply drafted']));
    if (found.some(f => f.status.startsWith('On hold'))) ev.push({ kind: 'thought', text: `${q.vendor}: payment blocked by missing GRN — notify warehouse lead so the vendor isn't left waiting.` });
    drafts.push({ to: q.from, subject: `Re: Payment status – ${ids.join(', ')}`, body: `Dear ${q.vendor} team,\n\nThank you for your email. Here is the latest status:\n\n${lines.join('\n')}\n\nRegards,\nAccounts Payable` });
  });
  ev.push({ kind: 'tool', text: 'mail.notify(to="warehouse.lead", subject="GRN pending for VB-7790 – vendor chasing")' });
  ev.push({ kind: 'done', text: `Drafted ${drafts.length} replies covering ${rows.length} invoices. 2 internal blockers flagged (GRN pending, PO mismatch). Replies are waiting for one-click approval.` });
  return { events: ev, output: { kpis: [{ label: 'Queries answered', value: `${QUERIES.length}/${QUERIES.length}`, tone: 'good' as const }, { label: 'Invoices looked up', value: String(rows.length) }, { label: 'Internal blockers', value: '2', tone: 'bad' as const }, { label: 'Avg. response time', value: '< 1 min', sub: 'vs 1–2 days' }],
    table: { head: ['Vendor', 'Invoice', 'Amount', 'ERP status', 'Agent action'], rows }, drafts, sheet: { name: 'Vendor queries', header: ['Vendor', 'Invoice', 'Amount', 'Status', 'Action'], rows } } };
}

// ======================= 3. Compliance check agent
const INVOICES = [
  { inv: 'PI-3301', vendor: 'Kalpana Packaging', gstin: '08AAKCK1234F1Z5', po: 'PO-9912', poAmt: 84500, amount: 84500, bankChanged: false, approved: true },
  { inv: 'PI-3302', vendor: 'Rathi Logistics', gstin: '27AABCR5678K1Z2', po: 'PO-9920', poAmt: 200000, amount: 212000, bankChanged: false, approved: true },
  { inv: 'PI-3303', vendor: 'Sai Chemicals', gstin: '24AAFCS9012L1ZX', po: '', poAmt: 0, amount: 56300, bankChanged: false, approved: true },
  { inv: 'PI-3304', vendor: 'Mehta Electricals', gstin: '08ABCPM3456', po: 'PO-9931', poAmt: 17800, amount: 17800, bankChanged: false, approved: true },
  { inv: 'PI-3305', vendor: 'Kalpana Packaging', gstin: '08AAKCK1234F1Z5', po: 'PO-9912', poAmt: 84500, amount: 84500, bankChanged: false, approved: true },
  { inv: 'PI-3306', vendor: 'Zenith Supplies', gstin: '29AAHCZ7788P1Z9', po: 'PO-9940', poAmt: 64000, amount: 64000, bankChanged: true, approved: false },
  { inv: 'PI-3307', vendor: 'Sai Chemicals', gstin: '24AAFCS9012L1ZX', po: 'PO-9944', poAmt: 22500, amount: 22500, bankChanged: false, approved: true },
  { inv: 'PI-3308', vendor: 'Rathi Logistics', gstin: '27AABCR5678K1Z2', po: 'PO-9950', poAmt: 140000, amount: 139200, bankChanged: false, approved: true },
];
function complianceAgent() {
  const ev: Ev[] = []; const rows: string[][] = [];
  const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  ev.push({ kind: 'thought', text: `Goal: check ${INVOICES.length} purchase invoices before payment run against 6 controls: GSTIN valid, PO present, amount within PO (+2%), no duplicates, approved vendor, bank details unchanged.` });
  ev.push({ kind: 'tool', text: 'erp.get_invoices(batch="Payment run 26-Sep")' });
  ev.push({ kind: 'obs', text: `${INVOICES.length} invoices · ${inr(INVOICES.reduce((s, i) => s + i.amount, 0))}` });
  ev.push({ kind: 'tool', text: 'vendor_master.lookup(all) · gst_portal.validate_format(all)' });
  let blocked = 0, atRisk = 0;
  INVOICES.forEach((i, idx) => {
    const issues: string[] = [];
    if (!GST.test(i.gstin)) issues.push('Invalid GSTIN format');
    if (!i.po) issues.push('No PO reference');
    else if (i.amount > i.poAmt * 1.02) issues.push(`Over PO by ${inr(i.amount - i.poAmt)}`);
    const dup = INVOICES.slice(0, idx).find(o => o.vendor === i.vendor && o.amount === i.amount && o.po === i.po);
    if (dup) issues.push(`Possible duplicate of ${dup.inv}`);
    if (!i.approved) issues.push('Vendor not in approved list');
    if (i.bankChanged) issues.push('Bank account changed in last 7 days');
    const high = issues.some(x => /duplicate|Bank|approved/.test(x));
    if (issues.length) { high ? blocked++ : 0; atRisk += i.amount; ev.push({ kind: 'obs', text: `${i.inv} ${i.vendor}: ${issues.join('; ')}` }); }
    rows.push([i.inv, i.vendor, inr(i.amount), issues.length ? issues.join('; ') : 'All 6 checks passed', issues.length ? (high ? 'BLOCK' : 'HOLD – fix') : 'PASS']);
  });
  ev.push({ kind: 'thought', text: 'PI-3306 combines a new, unapproved vendor with a recent bank change — classic payment-fraud pattern. Block and alert treasury.' });
  ev.push({ kind: 'tool', text: 'erp.set_payment_block(["PI-3305","PI-3306"]) · mail.notify(to="treasury")' });
  ev.push({ kind: 'done', text: `${rows.filter(r => r[4] === 'PASS').length} invoices cleared for payment. ${blocked} blocked (duplicate / fraud risk), ${rows.filter(r => r[4].startsWith('HOLD')).length} on hold until fixed. ${inr(atRisk)} prevented from going out incorrectly.` });
  return { events: ev, output: { kpis: [{ label: 'Checks run', value: String(INVOICES.length * 6) }, { label: 'Cleared', value: String(rows.filter(r => r[4] === 'PASS').length), tone: 'good' as const }, { label: 'Blocked / on hold', value: String(rows.filter(r => r[4] !== 'PASS').length), tone: 'bad' as const }, { label: 'Value protected', value: inr(atRisk) }],
    table: { head: ['Invoice', 'Vendor', 'Amount', 'Findings', 'Decision'], rows },
    drafts: [{ to: 'treasury@acme.demo', subject: 'Payment run 26-Sep: 2 invoices blocked', body: 'Hi Treasury,\n\nThe pre-payment compliance check blocked:\n• PI-3305 – possible duplicate of PI-3301 (same vendor, PO and amount)\n• PI-3306 – Zenith Supplies is not an approved vendor and its bank account changed this week\n\nPlease verify with the vendor by phone before releasing.\n\n— Compliance Agent' }],
    sheet: { name: 'Compliance check', header: ['Invoice', 'Vendor', 'Amount', 'Findings', 'Decision'], rows } } };
}

const AGENTS: AgentDef[] = [
  { id: 'recon', name: 'Reconciliation Agent', icon: Scale, goal: 'Match bank receipts to open invoices, explain short-payments and draft customer queries.', inputs: 'Bank statement · ERP open receivables', run: reconAgent },
  { id: 'vendor', name: 'Vendor Query Assistant', icon: MessagesSquare, goal: 'Read vendor payment-status emails, look up ERP and draft accurate replies.', inputs: 'AP mailbox · ERP invoice status', run: vendorAgent },
  { id: 'compliance', name: 'Compliance Check Agent', icon: ShieldCheck, goal: 'Check every invoice in the payment run against 6 controls and block risky payments.', inputs: 'Invoice batch · vendor master · GST rules', run: complianceAgent },
];
const EV_STYLE = { thought: { icon: Brain, c: 'text-violet-300', l: 'Thinking' }, tool: { icon: Wrench, c: 'text-sky-300', l: 'Tool' }, obs: { icon: Eye, c: 'text-slate-300', l: 'Result' }, done: { icon: CheckCircle2, c: 'text-teal-300', l: 'Done' } };

export const AgentsDemo: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const [agent, setAgent] = useState(AGENTS[0]);
  const [events, setEvents] = useState<Ev[]>([]);
  const [output, setOutput] = useState<Output | null>(null);
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const run = async () => {
    setBusy(true); setEvents([]); setOutput(null);
    const r = agent.run();
    for (const e of r.events) {
      setEvents(p => [...p, e]);
      requestAnimationFrame(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }));
      await sleep(e.kind === 'thought' ? 650 : 330);
    }
    setOutput(r.output); setBusy(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-slate-50 !p-4 space-y-2">
          <Label>Choose an agent</Label>
          {AGENTS.map(a => {
            const Icon = a.icon;
            return (
              <button key={a.id} onClick={() => { setAgent(a); setEvents([]); setOutput(null); }} disabled={busy}
                className={`w-full text-left rounded-2xl border p-3 transition-colors ${agent.id === a.id ? 'bg-white border-slate-900 ring-2 ring-teal-500/20' : 'bg-white/60 border-slate-200 hover:bg-white'}`}>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Icon className="w-4 h-4 text-teal-600" />{a.name}</div>
                <div className="text-xs text-slate-600 mt-1">{a.goal}</div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">Inputs: {a.inputs}</div>
              </button>
            );
          })}
        </Card>
        <PrimaryButton busy={busy} icon={Play} onClick={run}>{busy ? `${agent.name} working…` : `Run ${agent.name}`}</PrimaryButton>
        <Note>The agent's steps are generated from real calculations on sample data. In production, agents run on a schedule with your ERP, bank and mailbox, and a person approves before anything is posted or sent.</Note>
      </div>

      <div className="lg:col-span-8 space-y-5 min-w-0">
        <div ref={logRef} className="rounded-3xl bg-slate-950 border border-slate-800 p-4 h-72 overflow-y-auto font-mono text-[11.5px] leading-relaxed space-y-1.5">
          <div className="text-slate-500 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5" /> {agent.name} · agent console</div>
          {!events.length && <div className="text-slate-500">Press “Run” to watch the agent plan, call tools and decide.</div>}
          {events.map((e, i) => {
            const s = EV_STYLE[e.kind]; const Icon = s.icon;
            return <div key={i} className={`flex gap-2 ${s.c}`}><Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span><span className="opacity-60">{s.l}:</span> {e.text}</span></div>;
          })}
        </div>
        {output && (
          <Card className="shadow-xl space-y-5">
            <Kpis items={output.kpis} />
            <div><Label>Agent decisions</Label><MiniTable head={output.table.head} rows={output.table.rows.map(r => r.map((c, j) => j === r.length - 1 ? <span className={/BLOCK|Unmatched|HOLD|escalation|short|Suggested|Part/i.test(c) ? 'text-red-600 font-semibold' : 'text-emerald-700'}>{c}</span> : c))} max={11} /></div>
            {output.drafts.length > 0 && (
              <div><Label>Drafted for approval ({output.drafts.length})</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {output.drafts.slice(0, 4).map((d, i) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800"><Mail className="w-3.5 h-3.5 text-teal-600" /> {d.subject}</div>
                      <div className="text-[10px] font-mono text-slate-400">to {d.to}</div>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-700 max-h-40 overflow-y-auto">{d.body}</pre>
                    </div>
                  ))}
                </div></div>
            )}
            <div className="flex flex-wrap gap-3">
              <SmallButton tone="teal" icon={Download} onClick={() => downloadXlsx(`NorthLume_${agent.name.replace(/\s+/g, '_')}.xlsx`, [output.sheet, { name: 'Drafts', header: ['To', 'Subject', 'Body'], rows: output.drafts.map(d => [d.to, d.subject, d.body]) }])}>Download results</SmallButton>
              <SmallButton tone="dark" onClick={onOpenConsultation}>Build an agent for my team <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
