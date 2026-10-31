export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  positioning: string;
  corePromise: string;
  contact: {
    email: string;          // sales enquiries
    supportEmail: string;   // account, payment and privacy help
    linkedIn: string;
  };
  navLinks: { name: string; href: string }[];
  impactMetrics: { label: string; value: string; detail: string }[];
}

export const siteConfig: SiteConfig = {
  name: "NorthLume AI",
  shortName: "NorthLume AI",
  tagline: "AI Automation & Operations Transformation",
  positioning: "AI Automation for Businesses That Still Run on Email, Excel & Manual Processes",
  corePromise: "We identify repetitive operational work and turn it into intelligent, automated workflows that save time, reduce errors and improve business visibility.",
  contact: {
    email: "sales@northlumeai.com",
    supportEmail: "support@northlumeai.com",
    linkedIn: "",   // personal profile removed from the site
  },
  navLinks: [
    { name: "Services", href: "#solutions" },
    { name: "Capabilities", href: "#what-we-automate" },
    { name: "Live Demo", href: "#capability-demos" },
    { name: "SAP Recon", href: "#sap-bank-reconciliation" },
    { name: "Before & After", href: "#before-after" },
    { name: "Use Cases", href: "#use-cases" },
    { name: "Process", href: "#how-it-works" },
    { name: "Scorecard", href: "#scorecard" },
    { name: "FAQ", href: "#faq" },
  ],
  impactMetrics: [
    { label: "Manual Effort Reduction", value: "70-90%", detail: "In routine spreadsheet consolidation & reporting" },
    { label: "Processing Speed", value: "10x Faster", detail: "Turnaround time from raw email to executive KPI summary" },
    { label: "Data Accuracy", value: "99.9%", detail: "Elimination of copy-paste and manual formula transposition errors" },
    { label: "Time-to-Deploy", value: "2-4 Weeks", detail: "From discovery to production-ready automated workflows" },
  ]
};
