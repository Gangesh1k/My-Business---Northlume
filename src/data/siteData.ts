import {
  WorkflowNode,
  AutomationProblem,
  AutomationCapability,
  SolutionPackage,
  UseCaseCategory,
  CaseStudy,
  ScorecardQuestion,
  FAQItem
} from '../types';

export const workflowNodes: WorkflowNode[] = [
  {
    id: 'email',
    name: 'EMAIL',
    shortCode: '01',
    description: 'Automatically monitor incoming reports and operational requests.',
    details: 'Monitors distribution inboxes, supplier attachments, and operational feeds 24/7 without manual polling.',
    iconName: 'Mail',
    badge: 'Ingestion'
  },
  {
    id: 'data',
    name: 'DATA',
    shortCode: '02',
    description: 'Parse, validate and cleanse unorganized spreadsheets and PDF attachments.',
    details: 'Normalizes dirty CSVs, multi-tab Excel files, invoices, and legacy ERP data dumps.',
    iconName: 'FileSpreadsheet',
    badge: 'Extraction'
  },
  {
    id: 'ai',
    name: 'AI',
    shortCode: '03',
    description: 'Extract, classify, and intelligently analyze unstructured information.',
    details: 'Employs contextual reasoning to categorize line items, detect anomalies, and summarize context.',
    iconName: 'Cpu',
    badge: 'Intelligence'
  },
  {
    id: 'decision',
    name: 'DECISION',
    shortCode: '04',
    description: 'Apply business rules and Six Sigma exception-handling logic.',
    details: 'Evaluates thresholds, matches PO-to-invoice line items, and flags high-priority operational deviations.',
    iconName: 'GitBranch',
    badge: 'Rules Engine'
  },
  {
    id: 'automation',
    name: 'AUTOMATION',
    shortCode: '05',
    description: 'Trigger the right downstream operational action automatically.',
    details: 'Updates internal databases, dispatches Slack/Teams alerts, generates files, and calls API webhooks.',
    iconName: 'Zap',
    badge: 'Execution'
  },
  {
    id: 'dashboard',
    name: 'DASHBOARD',
    shortCode: '06',
    description: 'Give leadership real-time visibility into process health.',
    details: 'Live operational KPIs, SLA tracking, volume forecasting, and audit trail analytics.',
    iconName: 'BarChart3',
    badge: 'Visibility'
  },
  {
    id: 'action',
    name: 'ACTION',
    shortCode: '07',
    description: 'Empower management with proactive, exception-based decisions.',
    details: 'One-click approvals, automated stakeholder reports, and continuous process feedback loops.',
    iconName: 'CheckCircle2',
    badge: 'Outcome'
  }
];

export const businessProblems: AutomationProblem[] = [
  {
    id: 'excel',
    title: 'Too Much Excel',
    shortDesc: 'Employees spend hours copying, cleaning and consolidating spreadsheets.',
    symptom: 'VLOOKUP breaks, file version conflicts (e.g. Master_vFINAL_v3.xlsx), manual column formatting.',
    impact: '15-20 hours/week lost per operator',
    iconName: 'FileSpreadsheet'
  },
  {
    id: 'emails',
    title: 'Too Many Emails',
    shortDesc: 'Important information is buried inside repetitive email chains and attachments.',
    symptom: 'Manual forwarding, lost requests, missed attachments, and slow operational response cycles.',
    impact: '40% delayed customer/vendor inquiries',
    iconName: 'Mail'
  },
  {
    id: 'reporting',
    title: 'Manual Reporting',
    shortDesc: 'Reports are prepared manually every day, week, and month-end.',
    symptom: 'Operations leads spend Friday evenings assembling MIS reports from 5 different sources.',
    impact: 'Stale reports delivered 24-48 hrs late',
    iconName: 'FileText'
  },
  {
    id: 'insights',
    title: 'Delayed Insights',
    shortDesc: 'Management receives information after the business opportunity or issue has passed.',
    symptom: 'Reactive fire-fighting instead of proactive exception handling and forward forecasting.',
    impact: 'Missed revenue & escalated SLA penalties',
    iconName: 'Clock'
  },
  {
    id: 'tasks',
    title: 'Repetitive Tasks',
    shortDesc: 'Highly skilled, expensive talent spends time on low-value data shuffling activities.',
    symptom: 'Key analysts bogged down in data entry rather than strategic optimization or business growth.',
    impact: 'Employee burnout & high turnover',
    iconName: 'Repeat'
  },
  {
    id: 'errors',
    title: 'Human Errors',
    shortDesc: 'Manual processes create avoidable errors, rework, and costly operational friction.',
    symptom: 'Incorrect invoice amounts, mismatched inventory items, transposed SKU numbers.',
    impact: 'Unplanned rework & compliance risk',
    iconName: 'AlertTriangle'
  }
];

export const automationCapabilities: AutomationCapability[] = [
  {
    id: 'email-automation',
    title: 'Email Automation',
    description: 'Automatically read, classify and process incoming operational emails and attachments.',
    examples: [
      'Automated report collection from branches/vendors',
      'Intelligent email triage & priority tagging',
      'Attachment extraction (PDF, Excel, CSV, XML)',
      'Automated stakeholder notifications & receipt alerts',
      'Exception escalation to designated team leads'
    ],
    workflowSnippet: 'Inbox Monitor ➔ Attachment Extractor ➔ Data Normalizer ➔ Dispatcher',
    iconName: 'Mail',
    metric: 'Zero inbox backlog'
  },
  {
    id: 'excel-automation',
    title: 'Excel Automation',
    description: 'Turn repetitive spreadsheet work into reliable, push-button or automated background workflows.',
    examples: [
      'Multi-source spreadsheet consolidation & deduplication',
      'Automated cross-sheet reconciliation & variance checking',
      'Instant validation rules & data anomaly detection',
      'Automated VLOOKUP/XLOOKUP and index-match transformations',
      'Pre-formatted export to standardized executive sheets'
    ],
    workflowSnippet: 'Multi-file Ingest ➔ Header Mapping ➔ Cross-Reconcile ➔ Validated Master',
    iconName: 'FileSpreadsheet',
    metric: '85% time saved'
  },
  {
    id: 'reporting-automation',
    title: 'Reporting Automation',
    description: 'Automatically harvest data across siloes and generate polished management reports on schedule.',
    examples: [
      'Daily operational MIS & productivity summaries',
      'Weekly management briefing decks & PDF summaries',
      'Automated KPI scorecard calculations',
      'Executive performance dashboards & threshold alerts',
      'Month-end finance & operations closing packages'
    ],
    workflowSnippet: 'Scheduled Trigger ➔ Data Aggregator ➔ KPI Engine ➔ Executive Report',
    iconName: 'BarChart3',
    metric: 'Delivered at 8:00 AM daily'
  },
  {
    id: 'ai-business-insights',
    title: 'AI Business Insights',
    description: 'Turn raw operational and transaction data into concise, actionable executive intelligence.',
    examples: [
      'Natural language trend summarization and root-cause analysis',
      'Predictive SLA violation warnings & bottleneck discovery',
      'Vendor delivery variance & price discrepancy detection',
      'Revenue leakage analysis & operational efficiency scores',
      'Executive digest emails highlighting only the key exceptions'
    ],
    workflowSnippet: 'Data Stream ➔ Contextual LLM ➔ Anomaly Detector ➔ Executive Brief',
    iconName: 'Sparkles',
    metric: 'Proactive exception alerts'
  },
  {
    id: 'workflow-automation',
    title: 'Workflow Automation',
    description: 'Connect disparate software tools into seamless, automated end-to-end execution pipelines.',
    examples: [
      'End-to-end: Email ➔ Excel ➔ AI ➔ Database ➔ Dashboard ➔ Alert',
      'Procure-to-Pay (P2P) invoice validation and matching',
      'Order-to-Cash (O2C) billing dispute auto-routing',
      'Vendor onboarding and compliance document ingestion',
      'Cross-system synchronization between ERP, CRM, and Sheets'
    ],
    workflowSnippet: 'Webhook / Trigger ➔ Multi-step Pipeline ➔ System Sync ➔ Audit Log',
    iconName: 'Share2',
    metric: 'Continuous 24/7 sync'
  },
  {
    id: 'ai-agents',
    title: 'AI Operational Agents',
    description: 'Deploy intelligent autonomous agents specialized in executing multi-step operational tasks.',
    examples: [
      'Research & compliance verification agents',
      'Automated daily reconciliation and audit agents',
      'Vendor communication & status inquiry assistants',
      'Data synthesis & operations co-pilots for teams',
      '24/7 internal process query assistants'
    ],
    workflowSnippet: 'Task Objective ➔ Agent Reasoning ➔ Tool Execution ➔ Human Review Gate',
    iconName: 'Bot',
    metric: 'Trained on your process'
  }
];

export const solutionPackages: SolutionPackage[] = [
  {
    id: 'starter',
    tier: 'STARTER AUTOMATION',
    badge: 'Quick Win',
    idealFor: 'Businesses taking their first step to eliminate a specific, painful manual bottleneck.',
    features: [
      'Comprehensive single-process assessment',
      'Automation opportunity identification report',
      'One high-impact end-to-end workflow automation',
      'Basic automated reporting output (Excel/PDF/Slack)',
      'Team training and operational handover document',
      '30-day post-launch optimization support'
    ],
    ctaText: 'Explore Starter',
    deliverables: 'Live production workflow in 2 weeks'
  },
  {
    id: 'business',
    tier: 'BUSINESS AUTOMATION',
    badge: 'Most Popular',
    idealFor: 'Teams with multiple spreadsheet, email, and reporting workflows draining daily hours.',
    features: [
      'Cross-departmental workflow discovery & process mapping',
      'Multiple connected workflow automations (up to 3-5 core paths)',
      'End-to-end reporting automation (Daily MIS + Weekly KPI decks)',
      'AI-powered document extraction & validation logic',
      'Lean Six Sigma process stream optimization',
      '60-day stabilization & monitoring guarantee'
    ],
    ctaText: 'Explore Business',
    deliverables: 'Integrated multi-workflow system'
  },
  {
    id: 'intelligent-ops',
    tier: 'INTELLIGENT OPERATIONS',
    badge: 'Complete Transformation',
    idealFor: 'Companies seeking a complete operational intelligence layer with proactive AI insights.',
    features: [
      'Full-scale AI-powered operational workflow architecture',
      'Real-time business dashboards with custom KPI feeds',
      'Generative AI insights & automated anomaly detection',
      'Exception-based management alerts for executive leadership',
      'Lean Six Sigma continuous improvement governance',
      'Quarterly process reviews & optimization sprints'
    ],
    ctaText: 'Talk to Us',
    deliverables: 'Enterprise-grade operations control tower'
  },
  {
    id: 'custom',
    tier: 'CUSTOM AI SOLUTIONS',
    badge: 'Enterprise Scope',
    idealFor: 'Complex operations, high-volume BPOs, custom ERPs, and specialized industry requirements.',
    features: [
      'Custom autonomous AI agents tailored to proprietary workflows',
      'Complex multi-system enterprise integrations (SAP, Oracle, custom ERPs)',
      'Custom data pipelines & private AI reasoning models',
      'Enterprise security, role-based access & strict compliance',
      'Dedicated operations architect & engineering support',
      'Continuous SLA-backed maintenance and scaling'
    ],
    ctaText: 'Discuss Your Requirement',
    deliverables: 'Tailored enterprise AI automation architecture'
  }
];

export const useCases: UseCaseCategory[] = [
  {
    id: 'finance',
    name: 'Finance & Accounting',
    iconName: 'Receipt',
    headline: 'Accelerate Financial Close & Eliminate Manual Reconciliations',
    description: 'Transform high-stakes finance operations from tedious spreadsheet crunching into automated, audit-ready workflows.',
    workflows: [
      {
        name: 'Order-to-Cash (O2C) Streamlining',
        description: 'Auto-match customer payments to open invoices, flag deduction variances, and speed up DSO.',
        impact: '40% reduction in billing dispute turnaround'
      },
      {
        name: 'Procure-to-Pay (P2P) Invoice Processing',
        description: '3-way automated matching between PO, receiving slip, and vendor invoice with OCR exception triage.',
        impact: '90% touchless invoice approval rate'
      },
      {
        name: 'Bank & Ledger Reconciliation',
        description: 'Multi-account transaction matching with automated journal entry preparation for unreconciled line items.',
        impact: 'Month-end close shortened by 3 business days'
      },
      {
        name: 'Collections & Aging Follow-ups',
        description: 'Automated statement generation and intelligent follow-up scheduling based on debtor aging tiers.',
        impact: 'Improved working capital visibility'
      }
    ]
  },
  {
    id: 'operations',
    name: 'Operations & Teams',
    iconName: 'Activity',
    headline: 'Real-Time Operational Control & Effortless Daily Reporting',
    description: 'Free team leads from daily MIS assembly and establish exception-based operational governance.',
    workflows: [
      {
        name: 'Daily Operational MIS Automation',
        description: 'Harvest operational output logs from team spreadsheets and compile daily morning executive summaries.',
        impact: '10+ hours per supervisor saved weekly'
      },
      {
        name: 'Productivity & Capacity Tracking',
        description: 'Aggregate hourly output numbers and highlight load imbalances before SLAs are compromised.',
        impact: 'Balanced team workload distribution'
      },
      {
        name: 'SLA Monitoring & Early Warning Alerting',
        description: 'Real-time countdown trackers that escalate approaching breach thresholds directly to team managers.',
        impact: '99.5% SLA adherence across shifts'
      },
      {
        name: 'Workforce Shift & Task Allocation',
        description: 'Dynamic task assignment algorithms based on incoming queue volume and operator skill tags.',
        impact: 'Optimized queue throughput'
      }
    ]
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain & Logistics',
    iconName: 'Truck',
    headline: 'Eliminate Supply Chain Blind Spots & Procurement Delays',
    description: 'Connect fragmented supplier emails, carrier shipping spreadsheets, and warehouse inventories.',
    workflows: [
      {
        name: 'Vendor Performance & Delivery Tracking',
        description: 'Auto-ingest carrier tracking manifests and calculate actual vs. contracted On-Time In-Full (OTIF) rates.',
        impact: 'Instant supplier scorecards'
      },
      {
        name: 'Inventory Anomaly & Reorder Triggers',
        description: 'Continuous stock reconciliation across warehouses with intelligent buffer stock replenishment alerts.',
        impact: 'Prevented critical stockouts'
      },
      {
        name: 'Freight & Invoice Audit Automation',
        description: 'Cross-check carrier surcharges, fuel index tables, and contracted tariffs against actual freight bills.',
        impact: '3-7% direct freight spend savings'
      },
      {
        name: 'Procurement Exception Management',
        description: 'Automated RFQ tabulation and quotation comparison matrices delivered directly to buyers.',
        impact: 'RFQ turnaround reduced from days to hours'
      }
    ]
  },
  {
    id: 'bpo',
    name: 'BPO & Shared Services',
    iconName: 'Building2',
    headline: 'Drive High-Volume Process Accuracy & Client SLA Excellence',
    description: 'Scale client volume seamlessly without requiring linear headcount additions.',
    workflows: [
      {
        name: 'Client MIS & SLA Reporting Package',
        description: 'Multi-client automated report generation formatted to each client’s custom Excel layout template.',
        impact: 'Zero delayed reporting penalties'
      },
      {
        name: 'Transaction Quality Sampling & Audit',
        description: 'Automated random and risk-weighted audit sample extraction with auto-populated quality scorecards.',
        impact: '3x higher audit coverage'
      },
      {
        name: 'Agent Allocation & Volume Balancing',
        description: 'Predictive queue routing that balances email and ticket volumes across global delivery centers.',
        impact: 'Reduced idle time across shifts'
      },
      {
        name: 'Contractual Billing Data Aggregation',
        description: 'Automated unit-rate and FTE billing calculations backed by undeniable audit timestamps.',
        impact: 'Eliminated billing leakages'
      }
    ]
  },
  {
    id: 'management',
    name: 'Executive & Management',
    iconName: 'Compass',
    headline: 'Clarity, Control, and Automated Executive Briefings',
    description: 'Empower leadership with synthesized facts, forward-looking insights, and zero spreadsheet digging.',
    workflows: [
      {
        name: 'Automated Executive Briefing Digest',
        description: 'Daily 8:00 AM AI briefing summarizing top operational achievements, risks, and critical exceptions.',
        impact: 'Instant operational pulse in 2 minutes'
      },
      {
        name: 'Cross-Functional KPI Dashboards',
        description: 'Unified visualization combining finance, ops, and customer metrics updated continuously in real-time.',
        impact: 'Single source of operational truth'
      },
      {
        name: 'AI Root-Cause & Variance Analysis',
        description: 'Natural language diagnostic explanations when any operational metric moves beyond tolerance bands.',
        impact: 'Faster corrective decision making'
      },
      {
        name: 'Strategic Scenario & Capacity Planning',
        description: 'Automated forecast models that simulate the headcount and cost impact of incoming business volume.',
        impact: 'Data-driven hiring & scaling decisions'
      }
    ]
  }
];

export const caseStudies: CaseStudy[] = [
  {
    id: 'cs-1',
    title: 'Automated Daily Operations Reporting',
    category: 'Illustrative Scenario — Operations & BPO',
    before: 'Supervisors spent 3 hours every morning collecting 25+ Excel shift logs from multiple branches, manually copying rows, cleaning date formats, and fixing VLOOKUP broken links before emailing leadership.',
    after: 'Automated ingestion pipeline monitors inboxes, validates spreadsheet schema, unifies rows into an operational data warehouse, and dispatches interactive executive dashboards before 8:00 AM.',
    potentialImpact: '15+ weekly hours of repetitive manual assembly eliminated per operations team.',
    timeframe: 'Deployed in 2.5 weeks'
  },
  {
    id: 'cs-2',
    title: 'AI-Powered Operational Insights & Exception Detection',
    category: 'Illustrative Scenario — Supply Chain & Finance',
    before: 'Managers reviewed hundreds of invoice discrepancy rows line-by-line across 6 sheets, frequently missing root-cause supplier freight surcharge variations until month-end closing.',
    after: 'AI engine analyzes discrepancy patterns across all supplier transactions, clusters root causes (tariff mismatch vs. rate hike), and surfaces a high-priority exception queue with suggested fixes.',
    potentialImpact: 'Root-cause analysis completed in 10 seconds with 98% accuracy on anomaly detection.',
    timeframe: 'Deployed in 3 weeks'
  },
  {
    id: 'cs-3',
    title: 'End-to-End Workflow & System Synchronization',
    category: 'Illustrative Scenario — Enterprise Order-to-Cash',
    before: 'Order emails arrived in PDF format. Operators manually retyped order line items into ERP, exported a CSV, reconciled stock in Excel, and manually emailed shipping confirmations.',
    after: 'Intelligent workflow extracts PDF data with contextual validation, checks inventory thresholds, pushes clean records directly into ERP via API, and auto-notifies clients with tracking details.',
    potentialImpact: 'Order cycle time slashed from 6 hours to 4 minutes with 99.9% data fidelity.',
    timeframe: 'Deployed in 4 weeks'
  }
];

export const scorecardQuestions: ScorecardQuestion[] = [
  {
    id: 1,
    question: 'How often is the repetitive manual task or report performed?',
    options: [
      { label: 'Daily (or multiple times per day)', points: 3, description: 'Highest ROI for immediate automation' },
      { label: 'Weekly', points: 2, description: 'Substantial monthly time savings' },
      { label: 'Monthly / Ad-hoc', points: 1, description: 'Useful for complex closing cycles' }
    ]
  },
  {
    id: 2,
    question: 'How many team members perform or touch this manual process?',
    options: [
      { label: '5+ team members', points: 3, description: 'High multiplier on team productivity' },
      { label: '2 to 4 people', points: 2, description: 'Significant reduction in coordination friction' },
      { label: '1 person', points: 1, description: 'Key-person risk reduction' }
    ]
  },
  {
    id: 3,
    question: 'Does the process heavily involve spreadsheets (Excel / Google Sheets)?',
    options: [
      { label: 'Yes — constant copying, VLOOKUPs, and formula maintenance', points: 3, description: 'Prime candidate for automated ETL & validation' },
      { label: 'Partially — occasional exports and basic formatting', points: 2, description: 'Good potential for streamlined handoffs' },
      { label: 'No — mostly non-spreadsheet systems', points: 1, description: 'Targeted for system-to-system API pipelines' }
    ]
  },
  {
    id: 4,
    question: 'Does it involve processing repetitive incoming emails & attachments?',
    options: [
      { label: 'Yes — dozens of repetitive emails, PDFs, or CSV files', points: 3, description: 'Ideal for automated email triage & parsing' },
      { label: 'Occasionally — a few incoming notification emails', points: 2, description: 'Moderate automation opportunity' },
      { label: 'No — internal tools only', points: 1, description: 'Focuses on direct database/API automation' }
    ]
  },
  {
    id: 5,
    question: 'Does it require copying and re-entering data between separate systems?',
    options: [
      { label: 'Yes — retyping between email, ERP, spreadsheets, or portals', points: 3, description: 'Massive opportunity to eliminate human error' },
      { label: 'Sometimes — manual downloads and uploads', points: 2, description: 'Substantial time recovery potential' },
      { label: 'No — single system workflow', points: 1, description: 'Focus on in-system workflow intelligence' }
    ]
  }
];

export const faqItems: FAQItem[] = [
  {
    question: 'What types of businesses do you work with?',
    answer: 'We work primarily with small and mid-sized businesses, BPOs, fast-growing startups, and departmental operations teams (Finance, Operations, Supply Chain, Shared Services) that are constrained by repetitive manual processes, Excel dependencies, and high-volume email workflows.'
  },
  {
    question: 'Do I need expensive enterprise software licenses to get started?',
    answer: 'No. Our philosophy is practical, high-yield automation that leverages the tools and systems you already use wherever possible (e.g. your existing email, spreadsheets, cloud storage, or ERPs). We build reliable, lightweight automation layers and modern AI integrations without forcing costly enterprise migrations.'
  },
  {
    question: 'Can you automate complex Excel processes with macros or VLOOKUPs?',
    answer: 'Yes, absolutely. Spreadsheet consolidation, multi-source reconciliations, validation rules, VLOOKUP/XLOOKUP replacements, automated data transformation, and formatted executive report generation are among the most common and high-ROI workflows we automate.'
  },
  {
    question: 'Can you automate incoming operational emails and PDFs?',
    answer: 'Yes. We build intelligent workflows that continuously monitor specific inboxes, classify incoming requests, parse structured/unstructured attachments (PDFs, CSVs, scans), extract key fields, validate data against business rules, and route data to downstream tools automatically.'
  },
  {
    question: 'Can AI analyze our actual business data securely?',
    answer: 'Yes. AI can be integrated to perform trend analysis, automated classification, exception clustering, sentiment/urgency detection, and natural language executive summaries. Workflows can be configured with strict privacy boundaries and enterprise security standards.'
  },
  {
    question: 'Do you build custom AI workflows and autonomous agents?',
    answer: 'Yes. We design and build custom end-to-end operational pipelines and specialized AI agents tailored to your exact business rules, compliance requirements, and operational checklists.'
  }
];
