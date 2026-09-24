import React from 'react';
import { ReportingTool } from './tools/ReportingTool';
import { WorkflowTool } from './tools/WorkflowTool';
import { ReconTool } from './tools/ReconTool';
import { Mail, FileSpreadsheet, BarChart3, Sparkles, Share2, Bot, PlayCircle } from 'lucide-react';
import { EmailAutomationLab } from './EmailAutomationLab';
import { ExcelDemo } from './demos/ExcelDemo';
import { ReportingDemo } from './demos/ReportingDemo';
import { InsightsDemo } from './demos/InsightsDemo';
import { WorkflowDemo } from './demos/WorkflowDemo';
import { AgentsDemo } from './demos/AgentsDemo';

export const DEMOS = [
  { id: 'email-automation', label: 'Email Automation', icon: Mail, blurb: 'Reads each email, pulls the data from the attachment — or the table in the body — analyses it and replies with the findings.' },
  { id: 'excel-automation', label: 'Excel Automation', icon: FileSpreadsheet, blurb: 'Combines branch files with different layouts into one clean master, removes duplicates and reconciles every row against the ERP.' },
  { id: 'reporting-automation', label: 'Reporting Automation', icon: BarChart3, blurb: 'A scheduled job pulls data from three systems, calculates KPIs and sends a finished management report — no one touches Excel.' },
  { id: 'ai-business-insights', label: 'AI Business Insights', icon: Sparkles, blurb: 'Ask business questions in plain English and get answers, root causes and charts from the data — plus an automatic executive brief.' },
  { id: 'workflow-automation', label: 'Workflow Automation', icon: Share2, blurb: 'Customer billing disputes are classified, routed to the right team with an SLA, and synced to ERP, CRM and a tracker automatically.' },
  { id: 'ai-agents', label: 'AI Operational Agents', icon: Bot, blurb: 'Watch an agent plan, call tools and make decisions: reconcile bank receipts, answer vendor queries, or check invoices before payment.' },
] as const;
export type DemoId = typeof DEMOS[number]['id'];

interface Props { active: DemoId; onChange: (id: DemoId) => void; onOpenConsultation: (topic: string) => void }

const OWN_TOOLS: Partial<Record<string, { label: string; C: React.FC }>> = {
  'reporting-automation': { label: 'Build a report from my file', C: ReportingTool },
  'workflow-automation': { label: 'Route my own tickets', C: WorkflowTool },
  'ai-agents': { label: 'Reconcile my bank statement', C: ReconTool },
};

export const CapabilityDemos: React.FC<Props> = ({ active, onChange, onOpenConsultation }) => {
  const cur = DEMOS.find(d => d.id === active)!;
  const [mode, setMode] = React.useState<'sample' | 'own'>('sample');
  React.useEffect(() => setMode('sample'), [active]);
  const own = OWN_TOOLS[active];
  const consult = () => onOpenConsultation(`${cur.label} — live demo follow-up`);
  return (
    <section id="capability-demos" className="py-20 md:py-28 bg-white border-y border-slate-200 relative scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-bold uppercase tracking-wider">
            <PlayCircle className="w-3.5 h-3.5 text-teal-600" /><span>Live Capability Demos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">See Each Automation Work — Right Here</h2>
          <p className="text-base sm:text-lg text-slate-600">Pick a capability and run it on realistic sample data, or try it on your own file. Everything runs in your browser; nothing is uploaded.</p>
        </div>

        <div role="tablist" className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap sm:justify-center">
          {DEMOS.map(d => {
            const Icon = d.icon; const on = d.id === active;
            return (
              <button key={d.id} role="tab" aria-selected={on} onClick={() => onChange(d.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${on ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                <Icon className={`w-4 h-4 ${on ? 'text-teal-400' : 'text-teal-600'}`} />{d.label}
              </button>
            );
          })}
        </div>
        <p className="text-center text-sm text-slate-600 max-w-3xl mx-auto mb-8">
          {cur.blurb}{' '}
          <a href="#go-live" className="font-semibold text-teal-700 hover:text-teal-600 whitespace-nowrap">How clients use this after go-live →</a>
        </p>

        {own && (
          <div className="flex justify-center mb-6">
            <div className="inline-flex p-1 rounded-full bg-slate-100 border border-slate-200 text-sm font-semibold">
              {([['sample', 'Sample demo'], ['own', own.label]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k}
                  className={`px-4 py-1.5 rounded-full transition-all ${mode === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}>{l}</button>
              ))}
            </div>
          </div>
        )}
        {own && mode === 'own' ? <div key={active + '-own'} className="animate-in fade-in duration-300"><own.C /></div> :
        <div key={active} className="animate-in fade-in duration-300">
          {active === 'email-automation' && <EmailAutomationLab embedded onOpenConsultation={consult} />}
          {active === 'excel-automation' && <ExcelDemo onOpenConsultation={consult} />}
          {active === 'reporting-automation' && <ReportingDemo onOpenConsultation={consult} />}
          {active === 'ai-business-insights' && <InsightsDemo onOpenConsultation={consult} />}
          {active === 'workflow-automation' && <WorkflowDemo onOpenConsultation={consult} />}
          {active === 'ai-agents' && <AgentsDemo onOpenConsultation={consult} />}
        </div>}
      </div>
    </section>
  );
};
