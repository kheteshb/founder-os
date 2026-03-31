export interface Slide {
  index: number;
  title: string;
  content: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  reason: string;
}

export interface ClarificationAnswer {
  questionId: string;
  question: string;
  answer: string;
}

export interface OverallAnalysis {
  verdict: 'invest' | 'maybe' | 'pass';
  verdictReason: string;
  topStrengths: string[];
  topWeaknesses: string[];
  keyRisks: string[];
  missingCriticalInfo: string[];
}

export interface SlideAnalysis {
  slideIndex: number;
  slideTitle: string;
  whatWorks: string[];
  whatIsWeak: string[];
  whatIsMissing: string[];
  whatShouldBeRemoved: string[];
  brutalInvestorQuestions: string[];
}

export interface ProgressComparison {
  improved: string[];
  stayedSame: string[];
  regressed: string[];
  remainingGaps: string[];
  verdictShift: string;
}

export interface FullAnalysis {
  id: string;
  createdAt: string;
  overall: OverallAnalysis;
  slideAnalyses: SlideAnalysis[];
  progressVsPrevious?: ProgressComparison;
}

export interface DeckVersion {
  id: string;
  deckId: string;
  versionNumber: number;
  uploadedAt: string;
  rawText: string;
  slides: Slide[];
  clarificationQuestions?: ClarificationQuestion[];
  clarificationAnswers?: ClarificationAnswer[];
  analysis?: FullAnalysis;
}

export interface Deck {
  id: string;
  name: string;
  createdAt: string;
  versionIds: string[];
}

export interface SlideChat {
  id: string;
  versionId: string;
  slideIndex: number;
  messages: ChatMessage[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface FounderStore {
  decks: Deck[];
  versions: DeckVersion[];
  chats: SlideChat[];
}
