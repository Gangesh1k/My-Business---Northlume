import React, { useState, useEffect } from 'react';
import { siteConfig } from '../config/site';
import { AccountChip } from '../auth/AccountChip';
import { NorthLumeMark, NorthLumeWordmark } from './Logo';
import { Menu, X, ArrowUpRight, Sparkles, ChevronRight } from 'lucide-react';

interface NavbarProps {
  onOpenConsultation: () => void;
  onOpenDeployGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConsultation, onOpenDeployGuide }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Detect active section
      const sections = siteConfig.navLinks.map(link => link.href.replace('#', ''));
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-xs py-3'
          : 'bg-slate-50/80 backdrop-blur-xs py-4 md:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand Logo & Identifier */}
          <a
            href="#"
            className="flex items-center gap-3 group transition-transform hover:opacity-95 shrink-0"
            id="nav-logo"
            aria-label="NorthLume AI Home"
          >
            <div className="relative">
              <NorthLumeMark className="w-8 h-8 rounded-xl shadow-xs transition-transform group-hover:scale-105" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <NorthLumeWordmark className="text-xl" />
                <span className="hidden 2xl:inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-700 border border-teal-200/60 rounded-full">
                  Automation
                </span>
              </div>
              <span className="hidden 2xl:block text-[10px] font-medium text-slate-500 -mt-0.5">
                AI Automation &amp; Operations
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links - Centered & Aligned */}
          <nav className="hidden xl:flex items-center gap-0.5 2xl:gap-1.5 p-1 bg-slate-100/80 border border-slate-200/80 rounded-full">
            {siteConfig.navLinks.map((link) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <a
                  key={link.name}
                  href={link.href}
                  className={`px-2.5 2xl:px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                  }`}
                >
                  {link.name}
                </a>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <AccountChip />

            <button
              id="nav-consultation-btn"
              onClick={onOpenConsultation}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4.5 py-2 rounded-full text-xs font-bold shadow-sm hover:shadow transition-all group"
            >
              <span>Book Consultation</span>
              <div className="w-4 h-4 rounded-full bg-teal-500/20 text-teal-300 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
                <ArrowUpRight className="w-3 h-3 text-teal-300" />
              </div>
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex xl:hidden items-center gap-2">
            <button
              onClick={onOpenConsultation}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full shadow-2xs"
            >
              Book Call
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 transition-colors"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 p-4 bg-white rounded-3xl border border-slate-200 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-1.5">
              {siteConfig.navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 text-xs font-medium text-slate-700 hover:text-teal-700 hover:bg-teal-50/70 rounded-xl transition-colors flex items-center justify-between"
                >
                  <span>{link.name}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </a>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenConsultation();
                }}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-full text-center shadow-sm flex items-center justify-center gap-2"
              >
                <span>Book Free Consultation</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-teal-400" />
              </button>
              <AccountChip mobile onAction={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
