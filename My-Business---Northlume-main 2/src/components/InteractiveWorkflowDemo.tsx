import React, { useState, useEffect } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Mail, 
  FileText, 
  Download, 
  Database, 
  Cpu, 
  BarChart3, 
  Send,
  Clock,
  Check,
  AlertCircle,
  FileCheck2,
  TrendingUp
} from 'lucide-react';

export const InteractiveWorkflowDemo: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);

  const demoSteps = [
    {
      id: 1,
      title: 'Checking Inbox',
      detail: 'Monitoring operations@company.com for daily branch submissions...',
      icon: Mail,
      logText: '[08:00:01] Connected to mail exchange. Scanning unread operational threads...'
    },
    {
      id: 2,
      title: 'Finding Reports',
      detail: 'Identified 47 matching emails containing morning shift logs & dispatch manifests.',
      icon: FileText,
      logText: '[08:00:02] Matched 47 operational emails across 12 branch regions.'
    },
    {
      id: 3,
      title: 'Downloading Attachments',
      detail: 'Extracting 12 Excel spreadsheets (.xlsx), 8 CSV feeds, and 4 PDF delivery slips.',
      icon: Download,
      logText: '[08:00:04] 24 total attachments retrieved. Validating checksums and mime-types...'
    },
    {
      id: 4,
      title: 'Extracting Data',
      detail: 'Normalizing column headers, removing duplicates, and reconciling cross-branch SKUs.',
      icon: Database,
      logText: '[08:00:06] Ingested 14,820 row items. Deduplication removed 118 redundant rows.'
    },
    {
      id: 5,
      title: 'AI Analysis',
      detail: 'Evaluating variance, classifying delivery bottlenecks, and predicting day-end SLA adherence.',
      icon: Cpu,
      logText: '[08:00:08] AI reasoning flagged 3 operational anomalies in Midwest branch logistics.'
    },
    {
      id: 6,
      title: 'Updating Dashboard',
      detail: 'Pushing consolidated dataset to live leadership BI dashboard and updating KPI metrics.',
      icon: BarChart3,
      logText: '[08:00:10] Operations BI synced. Live metrics refreshed for VP Operations & Regional Leads.'
    },
    {
      id: 7,
      title: 'Sending Management Summary',
      detail: 'Drafting and dispatching 8:00 AM concise executive digest email to leadership.',
      icon: Send,
      logText: '[08:00:11] Executive digest dispatched to leadership distribution list.'
    }
  ];

  const handleStart = () => {
    setIsRunning(true);
    setIsCompleted(false);
    setCurrentStep(1);
    setLogs([demoSteps[0].logText]);
  };

  const handleReset = () => {
    setIsRunning(false);
    setIsCompleted(false);
    setCurrentStep(0);
    setLogs([]);
  };

  useEffect(() => {
    if (!isRunning || isCompleted) return;

    if (currentStep < demoSteps.length) {
      const timer = setTimeout(() => {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setLogs((prev) => [...prev, demoSteps[nextStep - 1].logText]);
      }, 1100);
      return () => clearTimeout(timer);
    } else if (currentStep === demoSteps.length) {
      const timer = setTimeout(() => {
        setIsRunning(false);
        setIsCompleted(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isRunning, currentStep, isCompleted]);

  return (
    <section id="demo" className="py-14 md:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-800 text-xs font-mono font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Interactive Workflow Simulation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight">
            See What Automation Looks Like
          </h2>

          <p className="text-base sm:text-lg text-slate-600">
            Experience how a complex 4.5-hour daily operations reporting ordeal becomes a single 12-second automated background execution.
          </p>
        </div>

        {/* The Interactive Demo Container */}
        <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
          {/* Top Demo Bar */}
          <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div>
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  Scenario:&nbsp;
                </span>
                <span className="text-xs font-mono text-teal-300 font-bold">
                  Daily Operations Reporting & Anomaly Triage
                </span>
              </div>
            </div>

            {/* Interactive Demo Label Tag */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Interactive Demo (Simulated)
              </span>

              {!isRunning && !isCompleted ? (
                <button
                  id="run-automation-btn"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Run Automation</span>
                </button>
              ) : isRunning ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-teal-300 font-mono text-xs rounded-lg border border-teal-500/30 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  <span>Executing Step {currentStep} of {demoSteps.length}...</span>
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs rounded-lg border border-slate-700 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              )}
            </div>
          </div>

          {/* Main Demo Body */}
          <div className="p-5 sm:p-7 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Left: 7 Stepped Workflow Sequence */}
            <div className="lg:col-span-7 space-y-3">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                Execution Pipeline Stages:
              </h4>

              <div className="space-y-2.5">
                {demoSteps.map((step) => {
                  const Icon = step.icon;
                  const isPast = currentStep > step.id || isCompleted;
                  const isCurrent = currentStep === step.id;

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-xl border transition-all duration-300 flex items-start gap-3.5 ${
                        isCurrent
                          ? 'bg-teal-950/40 border-teal-500/80 shadow-md ring-1 ring-teal-500/40'
                          : isPast
                          ? 'bg-slate-900/60 border-slate-800 text-slate-200'
                          : 'bg-slate-900/20 border-slate-800/60 opacity-50'
                      }`}
                    >
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          isCurrent
                            ? 'bg-teal-500 text-slate-950 font-bold'
                            : isPast
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isPast ? (
                          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-mono font-bold ${isCurrent ? 'text-teal-300' : isPast ? 'text-slate-200' : 'text-slate-400'}`}>
                            {step.id}. {step.title}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 animate-pulse">
                              Processing...
                            </span>
                          )}
                          {isPast && (
                            <span className="text-[10px] font-mono text-emerald-400">
                              Completed ✓
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                          {step.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Terminal & Outcome Summary */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              {/* Terminal Logs Window */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 font-mono text-xs h-64 flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400 text-[11px]">
                  <span>System Execution Log</span>
                  <span className="text-teal-400">stdout: live</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 text-slate-300 pr-1">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-4">
                      <Cpu className="w-8 h-8 text-slate-600 mb-2" />
                      <p>Click &quot;Run Automation&quot; to begin simulation</p>
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <p key={idx} className="leading-snug">
                        <span className="text-teal-400">&gt;</span> {log}
                      </p>
                    ))
                  )}
                  {isRunning && (
                    <p className="text-teal-400 animate-pulse">&gt; Processing operational stream...</p>
                  )}
                </div>
              </div>

              {/* Completion Outcome Card */}
              {isCompleted ? (
                <div className="bg-gradient-to-br from-teal-950/80 via-slate-900 to-slate-900 border-2 border-teal-500/80 rounded-xl p-5 shadow-lg animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h4 className="font-mono font-bold text-sm tracking-wider text-white uppercase">
                      Automation Complete
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs font-mono mb-4">
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">PROCESSED</span>
                      <span className="text-white font-bold text-sm">47 emails</span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">ANALYZED</span>
                      <span className="text-white font-bold text-sm">12 files</span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">ANOMALIES</span>
                      <span className="text-amber-400 font-bold text-sm">3 issues flagged</span>
                    </div>
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">DELIVERABLE</span>
                      <span className="text-teal-300 font-bold text-sm">1 MIS Summary</span>
                    </div>
                  </div>

                  <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-teal-400" />
                      <span className="text-xs text-slate-200 font-semibold">
                        Estimated Manual Effort Saved:
                      </span>
                    </div>
                    <span className="font-mono font-extrabold text-teal-300 text-sm">
                      4.5 Hours
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center h-32">
                  <FileCheck2 className="w-6 h-6 text-slate-600 mb-1" />
                  <p>Results summary will appear here upon completion</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Footnote */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 text-[11px] text-slate-500 text-center font-mono">
            Notice: Interactive simulation for demonstration purposes. Real workflows integrate with your specific ERPs, inboxes, and spreadsheets.
          </div>
        </div>
      </div>
    </section>
  );
};
