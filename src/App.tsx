import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BusinessProblems } from './components/BusinessProblems';
import { WhatWeAutomate } from './components/WhatWeAutomate';
import { InteractiveWorkflowDemo } from './components/InteractiveWorkflowDemo';
import { CapabilityDemos, DEMOS, DemoId } from './components/CapabilityDemos';
import { ClientOnboarding } from './components/ClientOnboarding';
import { Solutions } from './components/Solutions';
import { BeforeVsAfter } from './components/BeforeVsAfter';
import { UseCases } from './components/UseCases';
import { BusinessImpact } from './components/BusinessImpact';
import { HowItWorks } from './components/HowItWorks';
import { MiniCaseStudies } from './components/MiniCaseStudies';
import { FounderCredibility } from './components/FounderCredibility';
import { AutomationScorecard } from './components/AutomationScorecard';
import { FAQ } from './components/FAQ';
import { LeadCTA } from './components/LeadCTA';
import { Footer } from './components/Footer';
import { ContactModal } from './components/ContactModal';
import { VercelGuideModal } from './components/VercelGuideModal';

export default function App() {
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [isDeployGuideOpen, setIsDeployGuideOpen] = useState(false);
  const [consultationTopic, setConsultationTopic] = useState('');
  const [activeDemo, setActiveDemo] = useState<DemoId>('email-automation');

  // "Try demo" on a capability card → open that demo tab and scroll to it
  const openDemo = (id: string) => {
    if (DEMOS.some(d => d.id === id)) setActiveDemo(id as DemoId);
    requestAnimationFrame(() => document.getElementById('capability-demos')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  // deep links such as northlume.vercel.app/#demo-excel-automation
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#demo-(.+)$/);
      if (m) openDemo(m[1]);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const handleOpenConsultation = (topic = '') => {
    setConsultationTopic(topic);
    setIsConsultationOpen(true);
  };

  const handleSelectPlan = (planName: string) => {
    setConsultationTopic(`Engagement Tier: ${planName}`);
    setIsConsultationOpen(true);
  };

  const handleScorecardSubmit = (scoreSummary: string) => {
    setConsultationTopic(scoreSummary);
    setIsConsultationOpen(true);
  };

  const scrollToScorecard = () => {
    const el = document.getElementById('scorecard');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-teal-100 selection:text-teal-900">
      {/* 1. Navigation */}
      <Navbar
        onOpenConsultation={() => handleOpenConsultation('General Operations Assessment')}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* 2. Hero & Interactive Workflow Visual */}
        <Hero
          onOpenScorecard={scrollToScorecard}
          onOpenConsultation={() => handleOpenConsultation('Hero Section Inquiry')}
        />

        {/* 3. Business Problem */}
        <BusinessProblems
          onOpenScorecard={scrollToScorecard}
        />

        {/* 4. What We Automate */}
        <WhatWeAutomate
          onOpenConsultation={() => handleOpenConsultation('What We Automate Inquiry')}
          onTryDemo={openDemo}
        />

        {/* 4b. Live demo for every capability (tabs) */}
        <CapabilityDemos
          active={activeDemo}
          onChange={setActiveDemo}
          onOpenConsultation={handleOpenConsultation}
        />

        {/* 4c. How clients use it after go-live (access, hosting, security) */}
        <ClientOnboarding
          active={activeDemo}
          onChange={setActiveDemo}
          onOpenConsultation={handleOpenConsultation}
        />

        {/* 5. Interactive Workflow Demo */}
        <InteractiveWorkflowDemo />

        {/* 6. Solutions & Engagement Packages */}
        <Solutions
          onSelectPlan={handleSelectPlan}
        />

        {/* 7. Before vs After Comparison */}
        <BeforeVsAfter />

        {/* 8. Use Cases & Department Workflows */}
        <UseCases
          onOpenConsultation={() => handleOpenConsultation('Use Cases Deep Dive')}
        />

        {/* 9. Business Impact & Interactive Hours-Saved Estimator */}
        <BusinessImpact
          onOpenConsultation={() => handleOpenConsultation('Impact & ROI Estimation Validation')}
        />

        {/* 10. How It Works (4-Step Timeline) */}
        <HowItWorks
          onOpenConsultation={() => handleOpenConsultation('Step 01 Process Walkthrough Request')}
        />

        {/* 11. Mini Case Studies / Illustrative Scenarios */}
        <MiniCaseStudies />

        {/* 12. About & Founder Credibility */}
        <FounderCredibility
          onOpenConsultation={() => handleOpenConsultation('Founder Direct Operations Review')}
        />

        {/* 13. Automation Scorecard (5-Question Tool) */}
        <AutomationScorecard
          onOpenConsultationWithScore={handleScorecardSubmit}
        />

        {/* 14. Frequently Asked Questions */}
        <FAQ
          onOpenConsultation={() => handleOpenConsultation('FAQ Process Feasibility Question')}
        />

        {/* 15. Main Lead CTA & Contact Form */}
        <LeadCTA
          initialNotes={consultationTopic}
          onOpenConsultation={() => handleOpenConsultation('Main Lead CTA')}
        />
      </main>

      {/* 16. Footer */}
      <Footer
        onOpenConsultation={() => handleOpenConsultation('Footer CTA')}
        onOpenDeployGuide={() => setIsDeployGuideOpen(true)}
      />

      {/* Interactive Modals */}
      <ContactModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        initialTopic={consultationTopic}
      />

      <VercelGuideModal
        isOpen={isDeployGuideOpen}
        onClose={() => setIsDeployGuideOpen(false)}
      />
    </div>
  );
}
