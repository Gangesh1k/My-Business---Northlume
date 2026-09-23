import React from 'react';
import {
  Settings2, Users, Inbox, KeyRound, Cloud, Server, Laptop, ShieldCheck, Lock, FileCheck2, UserCheck, History,
  LogOut, CalendarCheck, Rocket, FlaskConical, LifeBuoy, Download, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { DEMOS, DemoId } from './CapabilityDemos';
import { downloadXlsx } from './demos/kit';

interface Plan { setup: string[]; daily: string[]; receive: string[]; access: string[]; channel: string }
const PLANS: Record<DemoId, Plan> = {
  'email-automation': {
    channel: 'A dedicated inbox such as reports@yourcompany.com (or a folder in an existing mailbox)',
    setup: ['Dedicated inbox or mailbox folder created', 'Sender allow-list (branches, vendors, clients)', 'Report types & KPI rules agreed with you', 'Reply template, escalation contacts and dashboard'],
    daily: ['Teams keep emailing reports exactly as today — attachment or table in the body', 'Nothing to install, no new software to learn'],
    receive: ['Threaded reply within minutes: insights + Excel report', 'High-priority items escalated to the named team lead', 'Live dashboard of every email processed'],
    access: ['Read access to one mailbox or folder (Microsoft 365 / Google Workspace / IMAP)', 'Send-as permission for that address only'],
  },
  'excel-automation': {
    channel: 'A shared drop folder (SharePoint, OneDrive, Google Drive) or the same email inbox',
    setup: ['Drop folder with Input / Output / Exceptions sub-folders', 'Column-mapping rules for every branch or vendor layout', 'Validation & reconciliation rules (ERP / ledger match)', 'Master file template in your format'],
    daily: ['Drop the files into the folder — or email them', 'Review the exceptions file only'],
    receive: ['Validated master workbook in the Output folder', 'Exceptions list with the reason for every mismatch', 'Email alert when a run finishes or fails'],
    access: ['Edit access to one shared folder', 'Read-only ERP / ledger export (scheduled file or read-only user)'],
  },
  'reporting-automation': {
    channel: 'Scheduled email (PDF + Excel), a live dashboard link, or a Teams / Slack channel',
    setup: ['Data sources connected read-only (database, ERP export, Sheets, ticketing)', 'KPI definitions, targets and RAG thresholds signed off', 'Recipient lists and schedule (e.g. 8:00 AM daily)', 'Report layout in your branding'],
    daily: ['Nothing — the report arrives on time, every time', 'Reply to the report to request a change or ad-hoc cut'],
    receive: ['Daily MIS, weekly briefing, month-end pack', 'Threshold alerts the moment a KPI breaches', 'Always-on dashboard for drill-down'],
    access: ['Read-only reporting user or scheduled exports', 'No write access to any system'],
  },
  'ai-business-insights': {
    channel: 'Ask in a secure web chat, Microsoft Teams / Slack, or by email',
    setup: ['Curated, read-only views of your data', 'Business glossary (what “revenue”, “region”, “SLA” mean for you)', 'User list and role-based permissions', 'Weekly executive brief format'],
    daily: ['Ask questions in plain English — “Why did West fall last month?”', 'Read the weekly brief; drill down only where flagged'],
    receive: ['Answers with the numbers, root causes and charts', 'Proactive anomaly & leakage alerts', 'Monday executive brief'],
    access: ['Read-only views on your data', 'AI provider configured so your data is not used for model training'],
  },
  'workflow-automation': {
    channel: 'Runs in the background between your systems; owners work from their usual queue',
    setup: ['Process map with owners, SLAs and routing rules', 'Connections to ERP / CRM / Sheets via API or webhooks', 'Rules sheet your team can edit without code', 'Audit log and failure alerts'],
    daily: ['Work items arrive already classified, routed and prioritised', 'Change a threshold or owner in the rules sheet — live next run'],
    receive: ['SLA timers and escalation alerts', 'Tracker updated automatically in every system', 'Weekly throughput & SLA summary'],
    access: ['Service account with API access to the specific objects only', 'Scoped keys stored in a secrets vault'],
  },
  'ai-agents': {
    channel: 'An approval queue by email or Teams — one click to approve, edit or reject',
    setup: ['Task definition, guardrails and approval levels', 'Tool access: bank feed, ERP, mailbox (read-mostly)', 'Draft templates and tone of voice', 'Full activity log of every step the agent takes'],
    daily: ['Review what the agent prepared and approve with one click', 'Handle only the items it flags for a human'],
    receive: ['Reconciliations, vendor replies and compliance checks done before you log in', 'Summary of what was done, what needs you, and why'],
    access: ['Read access to source systems', 'Anything that posts, pays or sends needs human approval'],
  },
};

const HOSTING = [
  { icon: Cloud, title: 'Managed by NorthLume AI', text: 'We host, monitor and maintain everything. Fastest start — you only share the access listed above.', tag: 'Most popular' },
  { icon: Server, title: 'In your cloud', text: 'Deployed inside your Azure, AWS or Google Cloud account. Your IT owns the environment; we build and support.', tag: 'For IT-led teams' },
  { icon: Laptop, title: 'On your own server or PC', text: 'Runs on a Windows / Mac machine in your office. Data never leaves your network.', tag: 'For sensitive data' },
];
const SECURITY = [
  { icon: Lock, t: 'Least-privilege access', d: 'Read-only by default; only the mailbox, folder or objects the automation needs.' },
  { icon: KeyRound, t: 'No shared passwords', d: 'App passwords / OAuth and scoped API keys, stored in a secrets vault — never sent over email.' },
  { icon: FileCheck2, t: 'NDA & data agreement', d: 'Signed before any access. Your data stays yours and is not used to train AI models.' },
  { icon: UserCheck, t: 'Human in the loop', d: 'Nothing is posted, paid or sent externally without the approval rules you set.' },
  { icon: History, t: 'Full audit trail', d: 'Every run, decision and change is logged and can be exported.' },
  { icon: LogOut, t: 'Revoke anytime', d: 'Remove access in one step. You keep the code, the configuration and all outputs.' },
];
const TIMELINE = [
  { icon: CalendarCheck, when: 'Day 1', title: 'Kick-off & access', text: 'Agree scope and KPIs; sign NDA; you grant the access on the checklist.' },
  { icon: FlaskConical, when: 'Week 1', title: 'Build on your samples', text: 'We configure it on real files you share; you review the first outputs.' },
  { icon: Settings2, when: 'Week 2', title: 'Parallel pilot', text: 'Runs alongside your manual process so every number is verified.' },
  { icon: Rocket, when: 'Week 3–4', title: 'Go-live', text: 'Manual process switched off; team walkthrough and a one-page user guide.' },
  { icon: LifeBuoy, when: 'Ongoing', title: 'Support & reviews', text: '30-day hypercare, then monitoring, fixes and a monthly improvement review.' },
];

interface Props { active: DemoId; onChange: (id: DemoId) => void; onOpenConsultation: (topic: string) => void }

export const ClientOnboarding: React.FC<Props> = ({ active, onChange, onOpenConsultation }) => {
  const plan = PLANS[active];
  const cur = DEMOS.find(d => d.id === active)!;

  const checklist = () => downloadXlsx(`NorthLumeAI_Onboarding_Checklist_${cur.label.replace(/\s+/g, '_')}.xlsx`, [
    { name: 'Access checklist', header: ['#', 'Item', 'Type', 'Owner (client)', 'Status', 'Notes'],
      rows: [
        ...plan.access.map((a, i) => [i + 1, a, 'Access to grant', '', 'Pending', '']),
        [plan.access.length + 1, 'NDA and data processing agreement signed', 'Legal', '', 'Pending', ''],
        [plan.access.length + 2, 'Sample files / data for the build (2–4 weeks of history)', 'Data', '', 'Pending', ''],
        [plan.access.length + 3, 'Named business owner and escalation contact', 'People', '', 'Pending', ''],
        [plan.access.length + 4, 'KPI definitions, targets and approval rules', 'Business rules', '', 'Pending', ''],
        [plan.access.length + 5, `Delivery channel confirmed: ${plan.channel}`, 'Delivery', '', 'Pending', ''],
      ] },
    { name: 'What we set up', header: ['Set-up item'], rows: plan.setup.map(s => [s]) },
    { name: 'How your team uses it', header: ['Your team', 'You receive'], rows: Array.from({ length: Math.max(plan.daily.length, plan.receive.length) }, (_, i) => [plan.daily[i] ?? '', plan.receive[i] ?? '']) },
    { name: 'Timeline', header: ['When', 'Step', 'What happens'], rows: TIMELINE.map(t => [t.when, t.title, t.text]) },
  ]);

  const Col: React.FC<{ icon: React.ElementType; title: string; items: string[]; tone?: string }> = ({ icon: Icon, title, items, tone = 'text-teal-600' }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2"><Icon className={`w-4 h-4 ${tone}`} />{title}</div>
      <ul className="space-y-1.5">{items.map(i => <li key={i} className="flex gap-2 text-xs text-slate-700"><CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${tone}`} /><span>{i}</span></li>)}</ul>
    </div>
  );

  return (
    <section id="go-live" className="py-20 md:py-28 bg-slate-50 relative border-t border-slate-200 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5 text-teal-600" /><span>For Clients</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">How Your Team Uses It After Go-Live</h2>
          <p className="text-base sm:text-lg text-slate-600">No new software for your team to learn. You grant a small, read-only set of access; we set everything up; your people keep working the way they do today — the results simply arrive.</p>
        </div>

        {/* capability selector — kept in sync with the demo tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
          {DEMOS.map(d => {
            const Icon = d.icon; const on = d.id === active;
            return (
              <button key={d.id} onClick={() => onChange(d.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${on ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
                <Icon className={`w-3.5 h-3.5 ${on ? 'text-teal-400' : 'text-teal-600'}`} />{d.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-100/60 p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2 text-sm text-slate-800"><Inbox className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" /><span><b>Where it lives:</b> {plan.channel}</span></div>
            <div className="flex gap-2">
              <button onClick={checklist} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"><Download className="w-3.5 h-3.5" /> Onboarding checklist</button>
              <a href="#capability-demos" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold">See the demo <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Col icon={Settings2} title="We set up" items={plan.setup} />
            <Col icon={KeyRound} title="Access you grant" items={plan.access} tone="text-amber-600" />
            <Col icon={Users} title="Your team does" items={plan.daily} tone="text-sky-600" />
            <Col icon={Inbox} title="You receive" items={plan.receive} tone="text-emerald-600" />
          </div>
        </div>

        {/* timeline */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-900 mb-4 text-center">From sign-up to live in 3–4 weeks</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {TIMELINE.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="rounded-2xl border border-slate-200 bg-white p-4 relative">
                  <div className="flex items-center justify-between"><Icon className="w-5 h-5 text-teal-600" /><span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">{t.when}</span></div>
                  <div className="text-sm font-bold text-slate-900 mt-2">{i + 1}. {t.title}</div>
                  <div className="text-xs text-slate-600 mt-1">{t.text}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* hosting + security */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xl font-bold text-slate-900">Where it runs — your choice</h3>
            {HOSTING.map(h => {
              const Icon = h.icon;
              return (
                <div key={h.title} className="rounded-2xl border border-slate-200 bg-white p-4 flex gap-3">
                  <div className="p-2 rounded-xl bg-teal-50 text-teal-700 h-fit"><Icon className="w-5 h-5" /></div>
                  <div><div className="flex flex-wrap items-center gap-2"><span className="text-sm font-bold text-slate-900">{h.title}</span><span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{h.tag}</span></div>
                    <p className="text-xs text-slate-600 mt-1">{h.text}</p></div>
                </div>
              );
            })}
          </div>
          <div className="lg:col-span-7">
            <h3 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-teal-600" /> Access & data security</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SECURITY.map(s => {
                const Icon = s.icon;
                return (
                  <div key={s.t} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><Icon className="w-4 h-4 text-teal-600" />{s.t}</div>
                    <p className="text-xs text-slate-600 mt-1">{s.d}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div><div className="text-lg font-bold">Start with a 2-week pilot on one process</div>
            <p className="text-sm text-slate-300 mt-1">Pick the capability above, share a few sample files, and see it running on your own data before you commit.</p></div>
          <button onClick={() => onOpenConsultation(`Pilot request — ${cur.label}`)} className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm">
            Request a pilot for {cur.label} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
