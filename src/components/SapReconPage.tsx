import React, { useEffect, useState } from 'react';
import { Landmark, Upload, Download, FileSpreadsheet, ShieldCheck, GitCompareArrows, ShieldAlert, FileCheck2, Database, ArrowRight, Lock, ChevronDown } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { ContactModal } from './ContactModal';
import { VercelGuideModal } from './VercelGuideModal';
import { SapReconDemo } from './demos/SapReconDemo';
import { SapLivePlan } from './SapLivePlan';

const SAMPLES = [
  { file: 'Sample_FBL3N_113100_Oct2026.csv', label: 'SAP G/L line items (FBL3N, CSV)', icon: FileSpreadsheet },
  { file: 'Sample_CITI_MT940_Oct2026.sta', label: 'Bank statement (MT940)', icon: Landmark },
  { file: 'Sample_bank_statement_Oct2026.csv', label: 'Bank statement (CSV)', icon: FileSpreadsheet },
];

const STEPS = [
  { n: '1', title: 'Export from SAP', text: 'Run FBL3N (or FAGLL03) for your bank G/L account and period, then List → Export → Spreadsheet or Local File. Excel and CSV both work.' },
  { n: '2', title: 'Add the bank statement', text: 'Use the MT940 file from your bank portal, or the statement downloaded as CSV / Excel with date, description and amount (or debit / credit).' },
  { n: '3', title: 'Reconcile and download', text: 'Matching runs in seconds. Review exceptions and proposed postings, then download the reconciliation as an Excel workbook.' },
];

const POINTS = [
  { icon: GitCompareArrows, title: 'Five matching passes', text: 'Reference, bank charges, invoice numbers in the narrative, F110 payment runs and lockbox batches (1:n), then amount within a date window.' },
  { icon: ShieldAlert, title: 'Every exception explained', text: 'Unidentified receipts, direct debits, bank charges, duplicates, stale cheques and timing items, each with a reason and a severity.' },
  { icon: FileCheck2, title: 'Postings proposed for you', text: 'Ready-to-approve entries with the SAP transaction to use (FEBAN, FB50, F-28, FB08). Nothing posts without approval.' },
  { icon: Database, title: 'Fits your SAP landscape', text: 'SAP ECC 6.0, S/4HANA on-premise, RISE and S/4HANA Cloud. FBL3N / ACDOCA line items against MT940, CSV or Excel statements.' },
];

const FAQS = [
  { q: 'Are my files uploaded anywhere?', a: 'No. On this page your SAP and bank files are read and reconciled inside your browser. Nothing is sent to our servers. The live service (below) runs in our cloud, your cloud or on your own server, with an NDA and a data-processing agreement.' },
  { q: 'Which SAP reports can I use?', a: 'FBL3N or FAGLL03 line items for the bank G/L account (and its clearing accounts), exported to Excel, CSV or text. The columns used are Document Number, Posting Date and Amount in local currency; Reference, Assignment, Document Type and Text improve matching.' },
  { q: 'Which bank formats are supported?', a: 'MT940 statements from any bank, and CSV or Excel statements with a date and an amount (or separate debit and credit columns). CAMT.053 and BAI2 are supported in the live service.' },
  { q: 'Does it post anything to SAP?', a: 'No. It proposes the entries and the transaction to use. In the live service approved entries are delivered as an upload file your team posts, or through an approved interface after sign-off.' },
  { q: 'Is there a limit?', a: 'The built-in sample and our published sample files are free and unlimited. Your own files: one free reconciliation after a quick email sign-in, then a subscription.' },
];

export const SapReconPage: React.FC = () => {
  const [consult, setConsult] = useState(false);
  const [topic, setTopic] = useState('');
  const [guide, setGuide] = useState(false);
  const open = (t: string) => { setTopic(t); setConsult(true); };

  useEffect(() => {
    document.title = 'SAP Bank Reconciliation Software — Reconcile FBL3N with MT940 | NorthLume AI';
    const m = document.querySelector('meta[name="description"]');
    const prev = m?.getAttribute('content') ?? '';
    m?.setAttribute('content', 'Reconcile SAP bank G/L accounts (FBL3N) against MT940, CSV or Excel bank statements in minutes. Automatic matching, explained exceptions, proposed SAP postings and a month-end reconciliation statement.');
    if (window.location.hash === '#reconcile') setTimeout(() => document.getElementById('reconcile')?.scrollIntoView({ block: 'start' }), 300);
    else window.scrollTo(0, 0);
    return () => { m?.setAttribute('content', prev); };
  }, []);

  const toTool = () => document.getElementById('reconcile')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      <Navbar onOpenConsultation={() => open('SAP Bank Reconciliation enquiry')} onOpenDeployGuide={() => setGuide(true)} />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-slate-900 text-white relative overflow-hidden pt-28 pb-14 md:pb-20">
          <div className="absolute inset-0 opacity-[0.07] bg-grid-pattern invert pointer-events-none" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-6">
            <a href="/" className="block w-fit text-xs text-slate-400 hover:text-white">← NorthLume AI</a>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
              <Landmark className="w-3.5 h-3.5" /><span>SAP Bank Reconciliation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl">Reconcile your SAP bank accounts in minutes, not days</h1>
            <p className="text-lg text-slate-300 max-w-2xl">Upload an FBL3N export and your bank statement. Matching runs automatically, every difference is explained, and the month-end reconciliation statement is ready to download.</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={toTool} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm">
                <Upload className="w-4 h-4" />Reconcile my files now
              </button>
              <a href="#sap-go-live" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 font-semibold text-sm">
                Automate it every day<ArrowRight className="w-4 h-4 text-teal-400" />
              </a>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400 pt-2">
              <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-teal-400" />Files stay in your browser</span>
              <span className="inline-flex items-center gap-1.5"><Database className="w-3.5 h-3.5 text-teal-400" />SAP ECC 6.0 and S/4HANA</span>
              <span className="inline-flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />FBL3N · MT940 · CSV · Excel</span>
            </div>
          </div>
        </section>

        {/* Steps + samples */}
        <section className="py-12 bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {STEPS.map(s => (
                <div key={s.n} className="rounded-2xl border border-slate-200 p-5">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold grid place-items-center text-sm">{s.n}</div>
                  <h3 className="font-bold mt-3">{s.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{s.text}</p>
                </div>
              ))}
            </div>
            <div className="lg:col-span-4 rounded-2xl bg-slate-50 border border-slate-200 p-5">
              <h3 className="font-bold">No files to hand? Use ours</h3>
              <p className="text-sm text-slate-600 mt-1 mb-3">One month of fictional SAP and bank data with the usual month-end surprises. Free and unlimited.</p>
              <ul className="space-y-2">
                {SAMPLES.map(x => { const I = x.icon; return (
                  <li key={x.file}><a href={`/samples/${x.file}`} download className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 text-sm hover:border-teal-500">
                    <I className="w-4 h-4 text-teal-600 shrink-0" /><span className="flex-1 min-w-0 truncate">{x.label}</span><Download className="w-4 h-4 text-slate-400" /></a></li>); })}
              </ul>
            </div>
          </div>
        </section>

        {/* The tool */}
        <section id="reconcile" className="py-12 md:py-16 bg-white scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Reconcile now</h2>
              <p className="text-sm text-slate-600 mt-1">Press <b>Run SAP bank reconciliation</b> to see the built-in sample, or open <b>Try it with my SAP files</b> on the left to load yours.</p>
            </div>
            <SapReconDemo uploadOpen onOpenConsultation={() => open('SAP Bank Reconciliation — after running the tool')} />
          </div>
        </section>

        {/* What it does */}
        <section className="py-12 md:py-16 bg-slate-50 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">What the reconciliation does</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {POINTS.map(p => { const I = p.icon; return (
                <div key={p.title} className="rounded-2xl bg-white border border-slate-200 p-5">
                  <I className="w-5 h-5 text-teal-600" /><h3 className="font-bold mt-2">{p.title}</h3><p className="text-sm text-slate-600 mt-1">{p.text}</p>
                </div>); })}
            </div>
          </div>
        </section>

        {/* Go live (paid) */}
        <section className="bg-slate-900 text-white pb-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SapLivePlan onOpenConsultation={() => open('Live SAP Bank Reconciliation — questions before subscribing')} />
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 md:py-16 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Questions</h2>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {FAQS.map(f => (
                <details key={f.q} className="group py-4">
                  <summary className="flex justify-between items-center gap-3 cursor-pointer font-semibold list-none">{f.q}<ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" /></summary>
                  <p className="text-sm text-slate-600 mt-2">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl bg-teal-50 border border-teal-100 p-5">
              <ShieldCheck className="w-5 h-5 text-teal-700" />
              <p className="text-sm text-slate-700 flex-1 min-w-[200px]">Want this on your own SAP data every day, with your matching rules and approvals?</p>
              <button type="button" onClick={() => open('SAP Bank Reconciliation walkthrough')} className="px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold">Book a 30-minute walkthrough</button>
            </div>
          </div>
        </section>
      </main>
      <Footer onOpenConsultation={() => open('SAP Bank Reconciliation enquiry')} onOpenDeployGuide={() => setGuide(true)} />
      <ContactModal isOpen={consult} onClose={() => setConsult(false)} initialTopic={topic} />
      <VercelGuideModal isOpen={guide} onClose={() => setGuide(false)} />
    </div>
  );
};
