export interface WorkflowNode {
  id: string;
  name: string;
  shortCode: string;
  description: string;
  details: string;
  iconName: string;
  badge: string;
}

export interface AutomationProblem {
  id: string;
  title: string;
  shortDesc: string;
  symptom: string;
  impact: string;
  iconName: string;
}

export interface AutomationCapability {
  id: string;
  title: string;
  description: string;
  examples: string[];
  workflowSnippet: string;
  iconName: string;
  metric: string;
}

export interface SolutionPackage {
  id: string;
  tier: string;
  badge?: string;
  idealFor: string;
  features: string[];
  ctaText: string;
  deliverables: string;
}

export interface UseCaseCategory {
  id: string;
  name: string;
  iconName: string;
  headline: string;
  description: string;
  workflows: {
    name: string;
    description: string;
    impact: string;
  }[];
}

export interface CaseStudy {
  id: string;
  title: string;
  category: string;
  before: string;
  after: string;
  potentialImpact: string;
  timeframe: string;
}

export interface ScorecardQuestion {
  id: number;
  question: string;
  options: {
    label: string;
    points: number;
    description?: string;
  }[];
}

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}
