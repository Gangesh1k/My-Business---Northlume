import React from 'react';
import { siteConfig } from '../config/site';
import { NorthLumeMark } from './Logo';
import { Zap, ArrowUp, ArrowUpRight, Mail, Sparkles } from 'lucide-react';

interface FooterProps {
  onOpenConsultation: () => void;
  onOpenDeployGuide: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenConsultation, onOpenDeployGuide }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-900">
          {/* Col 1 & 2: Brand & Tagline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <NorthLumeMark className="w-8 h-8 rounded-lg shadow-2xs" />
              <span className="font-bold text-xl tracking-tight text-white">
                {siteConfig.name}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-mono leading-relaxed max-w-sm">
              {siteConfig.tagline}
            </p>

            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              Helping businesses eliminate repetitive spreadsheet, email, and reporting bottlenecks through pragmatic AI workflows and Lean Six Sigma process architecture.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <a
                href={siteConfig.contact.linkedIn}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Email"
              >
                <Mail className="w-4 h-4" />
              </a>

              <button
                onClick={onOpenDeployGuide}
                className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Vercel Deployment Guide"
              >
                <svg className="w-4 h-4" viewBox="0 0 1155 1000" fill="currentColor">
                  <path d="m577.3 0 577.4 1000H0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Col 3: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  Solutions &amp; Packages
                </a>
              </li>
              <li>
                <a href="#what-we-automate" className="hover:text-white transition-colors">
                  What We Automate
                </a>
              </li>
              <li>
                <a href="#demo" className="hover:text-white transition-colors">
                  Interactive Demo
                </a>
              </li>
              <li>
                <a href="#before-after" className="hover:text-white transition-colors">
                  Before vs. After
                </a>
              </li>
              <li>
                <a href="#use-cases" className="hover:text-white transition-colors">
                  Use Cases
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Framework & Method */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Operations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  4-Step Implementation
                </a>
              </li>
              <li>
                <a href="#scorecard" className="hover:text-white transition-colors">
                  Automation Scorecard
                </a>
              </li>
              <li>
                <a href="#case-studies" className="hover:text-white transition-colors">
                  Illustrative Scenarios
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Founder Credibility
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Connect */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Engagement
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenConsultation}
                  className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                >
                  <span>Book Free Consultation</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </li>
              <li>
                <a
                  href={siteConfig.contact.linkedIn}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>LinkedIn Profile</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-white transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <button
                  onClick={onOpenDeployGuide}
                  className="hover:text-white transition-colors text-left"
                >
                  Vercel Setup Guide
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px]">
              AI Automation • Lean Six Sigma • Business Intelligence
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
              aria-label="Back to top"
            >
              <span>Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
