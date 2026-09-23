import React, { useState } from 'react';
import { Webhook, Search, Tags, GitBranch, RefreshCw, BellRing, ArrowRight, Download, ScrollText } from 'lucide-react';
import { Card, downloadXlsx, inr, Kpis, Label, MiniTable, Note, PrimaryButton, sleep, SmallButton, Stepper, useStages } from './kit';

// ---------------- sample: disputes raised by customers in the CRM
interface Dispute { id: string; customer: string; invoice: string; text: string; received: string }
const DISPUTES: Dispute[] = [
  { id: 'D-1041', customer: 'Apex Retail', invoice: 'INV-88210', text: 'We were charged ₹4,200 per unit but the agreed contract rate is ₹3,950.', received: '09:02' },
  { id: 'D-1042', customer: 'Metro Mart', invoice: 'INV-88164', text: '40 cartons short delivered, please issue credit for missing quantity.', received: '09:05' },
  { id: 'D-1043', customer: 'Kiran Stores', invoice: 'INV-88302', text: 'This invoice looks like a duplicate of INV-88301 billed last week.', received: '09:11' },
  { id: 'D-1044', customer: 'BlueLeaf Pharma', invoice: 'INV-88177', text: 'Goods arrived damaged, 12 boxes broken. Attaching photos.', received: '09:14' },
  { id: 'D-1045', customer: 'Nova Electronics', invoice: 'INV-88221', text: 'GST charged at 18% but this item is 12% as per HSN code.', received: '09:20' },
  { id: 'D-1046', customer: 'Sunrise Foods', invoice: 'INV-88340', text: 'Promised 5% volume discount not applied on this bill.', received: '09:26' },
  { id: 'D-1047', customer: 'Shree Traders', invoice: 'INV-88109', text: 'Payment already made via NEFT on 12 Sep, UTR attached, still showing overdue.', received: '09:31' },
  { id: 'D-1048', customer: 'Om Distributors', invoice: 'INV-88255', text: 'Price on invoice higher than PO price. Please revise.', received: '09:40' },
  { id: 'D-1049', customer: 'Apex Retail', invoice: 'INV-88262', text: 'Received wrong SKU, we ordered the 1L variant.', received: '09:44' },
  { id: 'D-1050', customer: 'Metro Mart', invoice: 'INV-88281', text: 'Freight charges were not part of the agreement.', received: '09:52' },
];
// ERP lookup (invoice amount, days since invoice, account owner)
const ERP: Record<string, { amount: number; age: number; kam: string; tier: 'Key' | 'Standard' }> = {
  'INV-88210': { amount: 186000, age: 12, kam: 'Rohit', tier: 'Key' }, 'INV-88164': { amount: 94000, age: 8, kam: 'Sneha', tier: 'Key' },
  'INV-88302': { amount: 58000, age: 3, kam: 'Aman', tier: 'Standard' }, 'INV-88177': { amount: 312000, age: 10, kam: 'Priya', tier: 'Key' },
  'INV-88221': { amount: 41000, age: 15, kam: 'Rohit', tier: 'Standard' }, 'INV-88340': { amount: 77500, age: 2, kam: 'Aman', tier: 'Standard' },
  'INV-88109': { amount: 128000, age: 38, kam: 'Sneha', tier: 'Standard' }, 'INV-88255': { amount: 22000, age: 6, kam: 'Priya', tier: 'Standard' },
  'INV-88262': { amount: 64000, age: 5, kam: 'Rohit', tier: 'Key' }, 'INV-88281': { amount: 15500, age: 9, kam: 'Sneha', tier: 'Key' },
};
const REASONS: { reason: string; rx: RegExp; team: string; action: string; slaH: number }[] = [
  { reason: 'Pricing / rate mismatch', rx: /price|rate|contract|po price|charged .* per unit/i, team: 'Pricing Desk', action: 'Compare with contract & PO; draft credit note for difference', slaH: 24 },
  { reason: 'Discount not applied', rx: /discount|rebate|scheme/i, team: 'Pricing Desk', action: 'Check scheme eligibility; draft credit note', slaH: 24 },
  { reason: 'Tax / GST error', rx: /gst|tax|hsn|igst|cgst/i, team: 'Tax & Compliance', action: 'Validate HSN rate; issue revised tax invoice', slaH: 48 },
  { reason: 'Short / wrong delivery', rx: /short|missing|wrong sku|wrong item|ordered the/i, team: 'Logistics', action: 'Match POD vs invoice qty; raise replacement or credit', slaH: 48 },
  { reason: 'Damaged goods', rx: /damage|broken|leak/i, team: 'Logistics', action: 'Open insurance claim; schedule pickup', slaH: 72 },
  { reason: 'Duplicate billing', rx: /duplicate|billed twice|double/i, team: 'Billing Ops', action: 'Verify duplicate in ERP; cancel invoice', slaH: 8 },
  { reason: 'Payment already made', rx: /already (made|paid)|utr|neft|rtgs|paid on/i, team: 'Cash Applications', action: 'Match UTR in bank feed; apply cash & clear overdue', slaH: 8 },
  { reason: 'Unagreed charges', rx: /freight|charges were not|extra charge|handling/i, team: 'Billing Ops', action: 'Check contract terms; reverse charge if not agreed', slaH: 24 },
];

interface Routed extends Dispute { amount: number; reason: string; team: string; action: string; slaH: number; priority: 'P1' | 'P2' | 'P3'; escalate: boolean; hold: boolean; owner: string }

export const WorkflowDemo: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const [threshold, setThreshold] = useState(100000);
  const [holdDunning, setHoldDunning] = useState(true);
  const [keyFirst, setKeyFirst] = useState(true);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<Routed[] | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [live, setLive] = useState<string | null>(null);
  const { stages, step, reset } = useStages([
    { title: 'Webhook: new CRM ticket', icon: Webhook }, { title: 'Enrich from ERP', icon: Search }, { title: 'Classify reason', icon: Tags },
    { title: 'Route & prioritise', icon: GitBranch }, { title: 'Sync ERP · CRM · Sheet', icon: RefreshCw }, { title: 'Alert & audit log', icon: BellRing },
  ]);

  const route = (d: Dispute): Routed => {
    const e = ERP[d.invoice];
    const r = REASONS.find(x => x.rx.test(d.text)) ?? { reason: 'Other', team: 'AR Specialist', action: 'Manual review', slaH: 24 };
    const escalate = e.amount >= threshold;
    const priority = escalate || (keyFirst && e.tier === 'Key') ? 'P1' : r.slaH <= 24 ? 'P2' : 'P3';
    return { ...d, amount: e.amount, reason: r.reason, team: r.team, action: r.action, slaH: priority === 'P1' ? Math.min(r.slaH, 8) : r.slaH, priority, escalate, hold: holdDunning, owner: e.kam };
  };

  const run = async () => {
    setBusy(true); setOut(null); setLog([]); reset();
    const add = (s: string) => setLog(l => [...l, `${new Date().toLocaleTimeString('en-IN', { hour12: false })}  ${s}`]);
    await step(0, 'Listening for new disputes…', () => `${DISPUTES.length} new dispute tickets received from CRM`, 500);
    await step(1, 'Looking up invoices in ERP…', () => `${DISPUTES.length} invoices found · amount, age & account owner attached`, 600);
    const results: Routed[] = [];
    for (const d of DISPUTES) {
      setLive(d.id);
      const r = route(d); results.push(r);
      add(`${d.id} ${d.customer} · ${r.reason} → ${r.team} (${r.priority}${r.escalate ? ', escalated' : ''})`);
      await sleep(170);
    }
    setLive(null);
    await step(2, 'Reading dispute text…', () => `${results.filter(r => r.reason !== 'Other').length}/${results.length} classified into ${new Set(results.map(r => r.reason)).size} reason codes`, 200);
    await step(3, 'Applying routing rules…', () => `${results.filter(r => r.priority === 'P1').length} P1 · ${results.filter(r => r.escalate).length} escalated to Finance Controller`, 400);
    await step(4, 'Updating systems…', () => {
      add(`ERP: dispute flag set on ${results.length} invoices${holdDunning ? ', dunning paused' : ''}`);
      add(`CRM: ${results.length} tickets assigned with SLA timers`); add('Google Sheet “Dispute Tracker”: rows appended');
      return `ERP flags set${holdDunning ? ' · reminders paused' : ''} · CRM assigned · tracker updated`;
    }, 500);
    await step(5, 'Notifying owners…', () => {
      results.filter(r => r.escalate).forEach(r => add(`ALERT → Finance Controller: ${r.id} ${inr(r.amount)} (${r.reason})`));
      return `${new Set(results.map(r => r.team)).size} teams notified · full audit trail written`;
    }, 400);
    setOut(results); setBusy(false);
  };

  const pr = { P1: 'bg-red-100 text-red-700', P2: 'bg-amber-100 text-amber-700', P3: 'bg-slate-100 text-slate-600' };
  const byTeam = out ? [...new Set(out.map(r => r.team))].map(t => ({ t, n: out.filter(r => r.team === t).length, v: out.filter(r => r.team === t).reduce((s, r) => s + r.amount, 0) })) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-slate-50 !p-4 space-y-3">
          <Label>Incoming disputes (CRM)</Label>
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {DISPUTES.map(d => (
              <div key={d.id} className={`rounded-xl border px-3 py-2 text-xs transition-colors ${live === d.id ? 'bg-teal-50 border-teal-300' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between font-semibold text-slate-800"><span>{d.id} · {d.customer}</span><span className="font-mono text-slate-400">{d.received}</span></div>
                <div className="text-slate-600 truncate">{d.text}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-4 space-y-3">
          <Label>Routing rules (edit & re-run)</Label>
          <label className="block text-xs text-slate-700">Escalate to Finance Controller above <b>{inr(threshold)}</b>
            <input type="range" min={25000} max={300000} step={5000} value={threshold} onChange={e => setThreshold(+e.target.value)} className="w-full accent-teal-600" />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={keyFirst} onChange={e => setKeyFirst(e.target.checked)} className="accent-teal-600" /> Key accounts always P1</label>
          <label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={holdDunning} onChange={e => setHoldDunning(e.target.checked)} className="accent-teal-600" /> Pause payment reminders while disputed</label>
        </Card>
        <PrimaryButton busy={busy} icon={Webhook} onClick={run}>{busy ? 'Workflow running…' : out ? 'Re-run with new rules' : 'Run workflow'}</PrimaryButton>
      </div>

      <div className="lg:col-span-8 space-y-5 min-w-0">
        <Stepper stages={stages} />
        {(log.length > 0) && (
          <div className="rounded-2xl bg-slate-900 text-slate-300 p-4 font-mono text-[11px] leading-relaxed max-h-44 overflow-y-auto">
            <div className="text-teal-300 font-bold mb-1 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5" /> Audit log</div>
            {log.map((l, i) => <div key={i} className={l.includes('ALERT') ? 'text-red-300' : ''}>{l}</div>)}
          </div>
        )}
        {out && (
          <Card className="shadow-xl space-y-5">
            <Kpis items={[
              { label: 'Auto-routed', value: `${out.filter(r => r.reason !== 'Other').length}/${out.length}`, sub: 'no manual triage', tone: 'good' },
              { label: 'Time to route', value: '≈2 sec', sub: 'vs ~35 min manual each', tone: 'good' },
              { label: 'Escalated', value: String(out.filter(r => r.escalate).length), sub: `≥ ${inr(threshold)}` },
              { label: 'Value in dispute', value: inr(out.reduce((s, r) => s + r.amount, 0)) },
            ]} />
            <div><Label>Routing result</Label>
              <MiniTable max={10} head={['Dispute', 'Customer', 'Amount', 'Reason', 'Routed to', 'Priority', 'SLA']} align={['l', 'l', 'r', 'l', 'l', 'l', 'r']}
                rows={out.map(r => [r.id, r.customer, inr(r.amount), r.reason, r.team, <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${pr[r.priority]}`}>{r.priority}{r.escalate ? ' ↑' : ''}</span>, `${r.slaH}h`])} /></div>
            <div><Label>Workload by team</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {byTeam.map(b => <div key={b.t} className="rounded-xl border border-slate-200 px-3 py-2 text-xs"><div className="font-semibold text-slate-800">{b.t}</div><div className="text-slate-500">{b.n} disputes · {inr(b.v)}</div></div>)}
              </div></div>
            <div className="flex flex-wrap gap-3">
              <SmallButton tone="teal" icon={Download} onClick={() => downloadXlsx('NorthLume_Dispute_Tracker.xlsx', [{ name: 'Dispute tracker', header: ['Dispute', 'Customer', 'Invoice', 'Amount', 'Reason', 'Team', 'Next action', 'Priority', 'SLA (h)', 'Escalated', 'Account owner', 'Dispute text'],
                rows: out.map(r => [r.id, r.customer, r.invoice, r.amount, r.reason, r.team, r.action, r.priority, r.slaH, r.escalate ? 'Yes' : 'No', r.owner, r.text]) }])}>Download tracker</SmallButton>
              <SmallButton tone="dark" onClick={onOpenConsultation}>Automate my workflow <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
            </div>
            <Note>Try lowering the escalation limit or unticking “Key accounts always P1”, then re-run — the routing changes instantly. In production the same flow runs on n8n/Make or custom code connected to your ERP and CRM.</Note>
          </Card>
        )}
      </div>
    </div>
  );
};
