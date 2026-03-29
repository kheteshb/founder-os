export type Objective = 'fundraising' | 'hiring' | 'customers' | 'partnerships';

export interface ContextAnswers {
  stage: string;
  raised: string;
  targetInvestor: string;
  whyInvestor: string;
  keyMetric: string;
  biggestConcern: string;
  objective: Objective;
}

export interface SectionFeedback {
  title: string;
  originalContent: string;
  whatWorks: string;
  whatIsWeak: string;
  whatIsMissing: string;
  whatIsConfusing: string;
  whatToRemove: string;
}

export interface ImprovementSuggestion {
  priority: 'critical' | 'high' | 'medium';
  section: string;
  current: string;
  suggested: string;
  reasoning: string;
}

export interface InvestorQuestion {
  question: string;
  whyAsked: string;
  expectedAnswer: string;
}

export interface OverallAssessment {
  clarityScore: number;
  convictionScore: number;
  investorAttractiveness: number;
  executionRisk: number;
  summary: string;
}

export interface BrutalTruth {
  rejectionReasons: string[];
  biggestRisk: string;
  founderBlindSpot: string;
}

export interface AnalysisResult {
  overall: OverallAssessment;
  sections: SectionFeedback[];
  brutalTruth: BrutalTruth;
  investorQuestions: InvestorQuestion[];
  improvements: ImprovementSuggestion[];
  coachingInsight: string;
}

export interface Analysis {
  id: string;
  timestamp: string;
  filename: string;
  objective: Objective;
  context: ContextAnswers;
  extractedContent: string;
  result: AnalysisResult;
  version: number;
  groupId?: string;
}

export interface AnalysisSummary {
  id: string;
  timestamp: string;
  filename: string;
  objective: Objective;
  version: number;
  groupId?: string;
  overall: OverallAssessment;
  context: {
    stage: string;
    targetInvestor: string;
  };
}
