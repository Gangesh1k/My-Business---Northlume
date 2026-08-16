import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/site';
import { NorthLumeMark } from './Logo';
import { Menu, X, ArrowUpRight, Sparkles, Zap, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenDeployGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsultation, onOpenDeployGuide }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-md border-b border-slate-200 shadow-xs py-3.5'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Positioning Tag */}
          <a
            href="#"
            className="flex items-center gap-2.5 group transition-transform hover:opacity-90"
            id="nav-logo"
          >
            <NorthLumeMark className="w-8 h-8 rounded-lg shadow-2xs" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900">
                {siteConfig.name}
              </span>
              <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-100 rounded-full">
                AI Operations
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            {siteConfig.navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-teal-600 transition-colors"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenDeployGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-full transition-colors"
              title="Vercel Deployment Checklist"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 1155 1000" fill="currentColor">
                <path d="m577.3 0 577.4 1000H0z" />
              </svg>
              <span>Vercel Deploy</span>
            </button>

            <button
              id="nav-consultation-btn"
              onClick={onOpenConsultation}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 flex items-center gap-1.5"
            >
              <span>Book Free Consultation</span>
              <ArrowUpRight className="w-4 h-4 text-teal-300" />
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenConsultation}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-full shadow-sm"
            >
              Book Call
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-5 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col space-y-1">
              {siteConfig.navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full py-3 px-4 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-full text-center shadow-sm"
              >
                Book Free Consultation
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenDeployGuide();
                }}
                className="w-full py-2 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full text-center"
              >
                View Vercel Deployment Guide
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
