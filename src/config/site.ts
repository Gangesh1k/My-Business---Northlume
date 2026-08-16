export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  positioning: string;
  corePromise: string;
  founder: {
    name: string;
    title: string;
    experience: string;
    portfolioResponsibility: string;
    teamScale: string;
    specializations: string[];
    credentials: string[];
    bio: string;
  };
  contact: {
    email: string;
    linkedIn: string;
  };
  navLinks: { name: string; href: string }[];
  impactMetrics: { label: string; value: string; detail: string }[];
}

export const siteConfig: SiteConfig = {
  name: "NorthLume",
  shortName: "NorthLume",
  tagline: "AI Automation & Operations Transformation",
  positioning: "AI Automation for Businesses That Still Run on Email, Excel & Manual Processes",
  corePromise: "We identify repetitive operational work and turn it into intelligent, automated workflows that save time, reduce errors and improve business visibility.",
  founder: {
    name: "Gangesh Kumar Dubey",
    title: "AI-Powered Operations Leader | Lean Six Sigma Master Black Belt | AI/ML",
    experience: "20+ Years Operations Leadership",
    portfolioResponsibility: "$4.5M+ Annual Portfolio Responsibility",
    teamScale: "450+ FTE Global Leadership Experience",
    specializations: [
      "Finance & Supply Chain Operations",
      "Order-to-Cash (O2C)",
      "Procure-to-Pay (P2P)",
      "Record-to-Report (RTR)",
      "Lean Six Sigma Process Architecture",
      "AI/ML & Intelligent Workflow Integration"
    ],
    credentials: [
      "Lean Six Sigma Master Black Belt",
      "AI & Machine Learning Practitioner",
      "Global Operations Transformation Specialist"
    ],
    bio: "Deep enterprise operations background driving high-yield process transformation, Lean Six Sigma methodologies, and practical AI execution for mission-critical business workflows."
  },
  contact: {
    email: "gangesh1k@gmail.com",
    linkedIn: "https://www.linkedin.com/in/gangesh-kumar-d-10268b56/",
  },
  navLinks: [
    { name: "Solutions", href: "#solutions" },
    { name: "What We Automate", href: "#what-we-automate" },
    { name: "Interactive Demo", href: "#demo" },
    { name: "Before vs After", href: "#before-after" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Scorecard", href: "#scorecard" },
    { name: "Credibility", href: "#about" },
    { name: "FAQ", href: "#faq" },
  ],
  impactMetrics: [
    { label: "Manual Effort Reduction", value: "70-90%", detail: "In routine spreadsheet consolidation & reporting" },
    { label: "Processing Speed", value: "10x Faster", detail: "Turnaround time from raw email to executive KPI summary" },
    { label: "Data Accuracy", value: "99.9%", detail: "Elimination of copy-paste and manual formula transposition errors" },
    { label: "Time-to-Deploy", value: "2-4 Weeks", detail: "From discovery to production-ready automated workflows" },
  ]
};
