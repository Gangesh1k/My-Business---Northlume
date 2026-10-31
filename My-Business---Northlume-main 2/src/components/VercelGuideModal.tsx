import React, { useState } from 'react';
import { X, Check, Copy, ExternalLink, Terminal, GitBranch, ArrowRight } from 'lucide-react';

interface VercelGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelGuideModal: React.FC<VercelGuideModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const steps = [
    {
      step: 'Step 1',
      title: 'Create GitHub Repository',
      desc: 'Initialize a new repository on your GitHub account (e.g. `ai-automation-business-site`).',
      command: 'git init\ngit add .\ngit commit -m "feat: initial AI automation static website"'
    },
    {
      step: 'Step 2',
      title: 'Push Project to GitHub',
      desc: 'Link your local project to the GitHub remote repository and push main branch.',
      command: 'git remote add origin https://github.com/your-username/ai-automation-site.git\ngit branch -M main\ngit push -u origin main'
    },
    {
      step: 'Step 3',
      title: 'Open Vercel Dashboard',
      desc: 'Visit https://vercel.com/new and log in with your GitHub account.',
      command: 'https://vercel.com/new'
    },
    {
      step: 'Step 4',
      title: 'Import GitHub Repository',
      desc: 'Select your newly created repository. Vercel automatically detects Vite + React configuration.',
      command: 'Framework Preset: Vite\nBuild Command: npm run build\nOutput Directory: dist'
    },
    {
      step: 'Step 5',
      title: 'Deploy to Production',
      desc: 'Click "Deploy". No environment variables required for the static version. Ready in < 45 seconds.',
      command: 'Deploy Completed -> https://your-brand-automation.vercel.app'
    }
  ];

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-white text-slate-950">
            <svg className="w-6 h-6" viewBox="0 0 1155 1000" fill="currentColor">
              <path d="m577.3 0 577.4 1000H0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-mono">
              Vercel 1-Click Deployment Checklist
            </h3>
            <p className="text-xs text-slate-400">
              Completely static, zero server dependencies, 100% Vercel compatible.
            </p>
          </div>
        </div>

        {/* 5 Steps */}
        <div className="space-y-4 my-6">
          {steps.map((s, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                    {s.step}
                  </span>
                  <span className="text-xs font-bold text-white">{s.title}</span>
                </div>

                <button
                  onClick={() => handleCopy(s.command, idx)}
                  className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 px-2 py-1 rounded"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400">{s.desc}</p>

              <pre className="bg-slate-900 p-2.5 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-slate-800/80">
                {s.command}
              </pre>
            </div>
          ))}
        </div>

        {/* Action button */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">
            Build command: <code className="text-teal-300">npm run build</code>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
