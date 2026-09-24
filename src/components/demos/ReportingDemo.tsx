import React, { useMemo, useState } from 'react';
import { AlarmClock, Database, Calculator, FileBarChart2, Send, Download, Printer, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { track } from '../../lib/track';
import { Card, downloadXlsx, InsightList, Label, LineChart, MiniTable, Note, num, PrimaryButton, Severity, SmallButton, Stepper, useStages } from './kit';

// ---------------- sample operations data: 4 teams × 35 days from 3 systems
const TEAMS = ['Order Processing', 'Customer Support', 'Accounts Payable', 'Collections'];
interface Day { date: Date; team: string; received: number; processed: number; slaMet: number; aht: number; errors: number; staff: number }
let seed = 21;
const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const DATA: Day[] = [];
for (let d = 0; d < 35; d++) {
  const date = new Date(2026, 7, 19 + d);
  if (date.getDay() === 0) continue; // Sundays off
  TEAMS.forEach((team, ti) => {
    const base = [420, 610, 260, 180][ti];
    const received = Math.round(base * (0.85 + rnd() * 0.3) * (ti === 1 && d > 27 ? 1.25 : 1));
    const capacity = [440, 600, 270, 175][ti] * (ti === 2 && d > 29 ? 0.8 : 1);
    const processed = Math.min(received + 40, Math.round(capacity * (0.9 + rnd() * 0.15)));
    const sla = Math.min(99.5, Math.max(70, (ti === 1 && d > 27 ? 84 : 95) + (rnd() - 0.5) * 6));
    DATA.push({ date, team, received, processed, slaMet: sla, aht: [4.2, 6.8, 9.5, 7.1][ti] * (0.9 + rnd() * 0.2), errors: Math.round(rnd() * [6, 9, 4, 3][ti]), staff: [12, 22, 8, 6][ti] });
  });
}
const LAST = DATA[DATA.length - 1].date;
const fmtD = (d: Date) => d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
const SLA_TARGET = 92;

type Kind = 'daily' | 'weekly' | 'monthly';
const KINDS: { id: Kind; label: string; when: string; days: number }[] = [
  { id: 'daily', label: 'Daily Operations MIS', when: 'Every working day · 08:00 AM', days: 1 },
  { id: 'weekly', label: 'Weekly Management Briefing', when: 'Every Monday · 08:00 AM', days: 6 },
  { id: 'monthly', label: 'Month-end Operations Pack', when: '1st working day · 09:00 AM', days: 26 },
];

function periodRows(days: number, offset = 0) {
  const dates = [...new Set(DATA.map(d => +d.date))].sort((a, b) => a - b);
  const pick = new Set(dates.slice(Math.max(0, dates.length - days * (offset + 1)), dates.length - days * offset));
  return DATA.filter(d => pick.has(+d.date));
}
function agg(rows: Day[]) {
  const s = (f: (d: Day) => number) => rows.reduce((a, d) => a + f(d), 0);
  const received = s(d => d.received), processed = s(d => d.processed);
  return {
    received, processed, backlog: received - processed,
    sla: rows.length ? s(d => d.slaMet * d.received) / (received || 1) : 0,
    aht: rows.length ? s(d => d.aht * d.processed) / (processed || 1) : 0,
    accuracy: 100 - (100 * s(d => d.errors)) / (processed || 1),
    productivity: processed / (s(d => d.staff) || 1),
  };
}

export const ReportingDemo: React.FC<{ onOpenConsultation: () => void }> = ({ onOpenConsultation }) => {
  const [kind, setKind] = useState<Kind>('daily');
  const [recipients, setRecipients] = useState('vp.ops@acme.com, team.leads@acme.com');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Kind | null>(null);
  const { stages, step, reset } = useStages([
    { title: 'Scheduled Trigger', icon: AlarmClock }, { title: 'Data Aggregator', icon: Database }, { title: 'KPI Engine', icon: Calculator },
    { title: 'Executive Report', icon: FileBarChart2 }, { title: 'Distribution', icon: Send },
  ]);
  const K = KINDS.find(k => k.id === kind)!;

  const report = useMemo(() => {
    const cur = periodRows(K.days), prev = periodRows(K.days, 1);
    const a = agg(cur), b = agg(prev);
    const teams = TEAMS.map(t => ({ team: t, now: agg(cur.filter(d => d.team === t)), before: agg(prev.filter(d => d.team === t)) }));
    const dates = [...new Set(DATA.map(d => +d.date))].sort((x, y) => x - y).slice(-Math.max(12, Math.min(26, K.days * 3)));
    const trend = dates.map(dt => agg(DATA.filter(d => +d.date === dt)));
    const callouts: { severity: Severity; title: string; detail: string }[] = [];
    teams.forEach(t => {
      if (t.now.sla < SLA_TARGET) callouts.push({ severity: t.now.sla < 88 ? 'critical' : 'warning', title: `${t.team}: SLA ${t.now.sla.toFixed(1)}% (target ${SLA_TARGET}%)`,
        detail: `Down ${(t.before.sla - t.now.sla).toFixed(1)} pts vs previous period; volume ${t.now.received > t.before.received ? 'up' : 'down'} ${Math.abs((100 * (t.now.received - t.before.received)) / (t.before.received || 1)).toFixed(0)}%.` });
      if (t.now.backlog > 0.1 * t.now.received && t.now.backlog > 25) callouts.push({ severity: 'warning', title: `${t.team}: backlog building (${num(t.now.backlog)} items)`,
        detail: `Processing ${num(t.now.processed)} vs ${num(t.now.received)} received — capacity ${((100 * t.now.processed) / t.now.received).toFixed(0)}% of demand.` });
    });
    const best = [...teams].sort((x, y) => y.now.sla - x.now.sla)[0];
    callouts.push({ severity: 'positive', title: `${best.team} best on SLA at ${best.now.sla.toFixed(1)}%`, detail: `Accuracy ${best.now.accuracy.toFixed(1)}% · ${best.now.productivity.toFixed(1)} items per person per day.` });
    return { a, b, teams, trend: { labels: dates.map(d => fmtD(new Date(d))), rec: trend.map(t => t.received), proc: trend.map(t => t.processed) }, callouts,
      period: K.days === 1 ? fmtD(LAST) : `${fmtD(cur[0].date)} – ${fmtD(LAST)}` };
  }, [kind]);

  const run = async () => {
    track('demo_run', 'reporting-automation');
    setBusy(true); setDone(null); reset();
    const cur = periodRows(K.days);
    await step(0, `Schedule fired: ${K.when}`, () => `${K.label} · period ${report.period}`, 500);
    await step(1, 'Pulling ticketing, WFM & QA systems…', () => `${num(cur.length)} team-day records from 3 systems merged`, 800);
    await step(2, 'Calculating SLA, AHT, backlog, accuracy…', () => `7 KPIs × ${TEAMS.length} teams · RAG status vs targets`);
    await step(3, 'Writing commentary & charts…', () => `${report.callouts.length} key call-outs written`);
    await step(4, 'Sending…', () => `Emailed to ${recipients.split(',').filter(x => x.trim()).length} recipients · PDF + Excel attached`);
    setDone(kind); setBusy(false);
  };

  const delta = (n: number, o: number, goodUp = true, unit = '%', pts = false) => {
    const d = pts ? n - o : (100 * (n - o)) / (Math.abs(o) || 1);
    const good = goodUp ? d >= 0 : d <= 0;
    const Icon = d >= 0 ? ArrowUpRight : ArrowDownRight;
    return <span className={`inline-flex items-center text-[11px] font-mono ${good ? 'text-emerald-600' : 'text-red-600'}`}><Icon className="w-3 h-3" />{Math.abs(d).toFixed(1)}{pts ? ' pts' : unit}</span>;
  };
  const rag = (sla: number) => sla >= SLA_TARGET ? 'bg-emerald-500' : sla >= 88 ? 'bg-amber-400' : 'bg-red-500';
  const { a, b } = report;

  const print = () => {
    const el = document.getElementById('nl-report');
    const w = globalThis.open("", "_blank", "width=900,height=1000");
    if (!w || !el) return;
    const css = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map(n => n.outerHTML).join('');
    w.document.write(`<html><head><base href="${location.origin}/"><title>${K.label}</title>${css}</head><body style="padding:32px">${el.outerHTML}</body></html>`);
    w.document.close(); setTimeout(() => w.print(), 700);
  };
  const excel = () => downloadXlsx(`NorthLumeAI_${K.label.replace(/\s+/g, '_')}.xlsx`, [
    { name: 'Scorecard', header: ['Team', 'Received', 'Processed', 'Backlog', 'SLA %', 'AHT (min)', 'Accuracy %', 'Items / person / day'],
      rows: report.teams.map(t => [t.team, t.now.received, t.now.processed, t.now.backlog, +t.now.sla.toFixed(1), +t.now.aht.toFixed(2), +t.now.accuracy.toFixed(2), +t.now.productivity.toFixed(1)]) },
    { name: 'Call-outs', header: ['Severity', 'Call-out', 'Detail'], rows: report.callouts.map(c => [c.severity, c.title, c.detail]) },
    { name: 'Raw data', header: ['Date', 'Team', 'Received', 'Processed', 'SLA %', 'AHT', 'Errors', 'Staff'], rows: DATA.map(d => [d.date, d.team, d.received, d.processed, +d.slaMet.toFixed(1), +d.aht.toFixed(2), d.errors, d.staff]) },
  ]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4">
        <Card className="bg-slate-50 !p-4 space-y-3">
          <Label>Choose a scheduled report</Label>
          {KINDS.map(k => (
            <button key={k.id} onClick={() => { setKind(k.id); setDone(null); reset(); }}
              className={`w-full text-left rounded-2xl border p-3 transition-colors ${kind === k.id ? 'bg-white border-slate-900 ring-2 ring-teal-500/20' : 'bg-white/60 border-slate-200 hover:bg-white'}`}>
              <div className="text-sm font-bold text-slate-900">{k.label}</div>
              <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mt-0.5"><AlarmClock className="w-3 h-3" />{k.when}</div>
            </button>
          ))}
          <label className="block text-xs font-semibold text-slate-700">Send to
            <input value={recipients} onChange={e => setRecipients(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:border-teal-500" />
          </label>
          <Note>Sources in this demo: ticketing system, workforce management (staffing) and QA error log — {TEAMS.length} teams, 5 weeks of data.</Note>
        </Card>
        <PrimaryButton busy={busy} icon={AlarmClock} onClick={run}>{busy ? 'Generating report…' : 'Run the schedule now'}</PrimaryButton>
      </div>

      <div className="lg:col-span-8 space-y-5 min-w-0">
        <Stepper stages={stages} />
        {done && (
          <Card className="shadow-xl space-y-5">
            <div id="nl-report" className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 pb-3">
                <div><div className="text-[11px] font-mono uppercase tracking-wider text-teal-700">NorthLume AI · automated report</div>
                  <div className="text-xl font-extrabold text-slate-900">{K.label}</div></div>
                <div className="text-xs text-slate-500">Period: <b className="text-slate-800">{report.period}</b> · vs previous period</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Volume received', num(a.received), delta(a.received, b.received, true)],
                  ['Processed', num(a.processed), delta(a.processed, b.processed, true)],
                  ['SLA met', `${a.sla.toFixed(1)}%`, delta(a.sla, b.sla, true, '', true)],
                  ['Backlog', num(Math.max(0, a.backlog)), delta(a.backlog, b.backlog, false)],
                ].map(([l, v, d]) => (
                  <div key={l as string} className="rounded-2xl border border-slate-200 p-3"><div className="text-[11px] text-slate-500">{l}</div>
                    <div className="text-xl font-extrabold text-slate-900">{v}</div>{d}</div>
                ))}
              </div>
              <div><Label>Daily volume — received vs processed</Label>
                <LineChart labels={report.trend.labels} series={[{ name: 'Processed', values: report.trend.proc }, { name: 'Received', values: report.trend.rec, dashed: true }]} /></div>
              <div><Label>Team scorecard</Label>
                <MiniTable head={['Team', 'Received', 'Processed', 'SLA %', 'AHT (min)', 'Accuracy', '']} align={['l', 'r', 'r', 'r', 'r', 'r', 'l']}
                  rows={report.teams.map(t => [t.team, num(t.now.received), num(t.now.processed), `${t.now.sla.toFixed(1)}%`, t.now.aht.toFixed(1), `${t.now.accuracy.toFixed(1)}%`,
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${rag(t.now.sla)}`} title="RAG vs SLA target" />])} /></div>
              <div><Label>Key call-outs</Label><InsightList items={report.callouts} /></div>
            </div>
            <div className="flex flex-wrap gap-3">
              <SmallButton tone="teal" icon={Download} onClick={excel}>Excel scorecard</SmallButton>
              <SmallButton icon={Printer} onClick={print}>Print / save as PDF</SmallButton>
              <SmallButton tone="dark" onClick={onOpenConsultation}>Automate my reports <ArrowRight className="w-4 h-4 text-teal-400" /></SmallButton>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

