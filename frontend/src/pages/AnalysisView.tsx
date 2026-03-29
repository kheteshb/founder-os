import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  MessageSquare,
  Zap,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import { getAnalysis } from '../api';
import { Analysis, SectionFeedback, InvestorQuestion, ImprovementSuggestion } from '../types';
import ScoreCard from '../components/ScoreCard';
import ExpandableSection from '../components/ExpandableSection';

function PriorityBadge({ priority }: { priority: 'critical' | 'high' | 'medium' }) {
  const cfg = {
    critical: 'bg-red-50 text-red-600 border-red-100',
    high: 'bg-amber-50 text-amber-600 border-amber-100',
    medium: 'bg-blue-50 text-blue-600 border-blue-100',
  };
  return (
    <span className={`inline-flex items-center border rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${cfg[priority]}`}>
      {priority}
    </span>
  );
}

function SectionCard({ section }: { section: SectionFeedback }) {
  const hasIssues = section.whatIsWeak || section.whatIsMissing;
  return (
    <ExpandableSection
      title={section.title}
      accent={hasIssues ? 'amber' : 'default'}
      badge={
        section.whatWorks && section.whatWorks !== 'Nothing stands out' ? (
          <CheckCircle2 size={12} className="text-emerald-400" />
        ) : (
          <XCircle size={12} className="text-red-300" />
        )
      }
    >
      <div className="space-y-3 text-sm">
        {section.originalContent && (
          <div className="bg-gray-50 rounded p-3 border-l-2 border-gray-200">
            <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Original</p>
            <p className="text-gray-600 italic text-xs leading-relaxed">"{section.originalContent}"</p>
          </div>
        )}
        {section.whatWorks && section.whatWorks !== 'Nothing stands out' && section.whatWorks !== 'N/A' && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Works</p>
            <p className="text-gray-700 text-sm leading-relaxed">{section.whatWorks}</p>
          </div>
        )}
        {section.whatIsWeak && section.whatIsWeak !== 'N/A' && (
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Weak</p>
            <p className="text-gray-700 text-sm leading-relaxed">{section.whatIsWeak}</p>
          </div>
        )}
        {section.whatIsMissing && section.whatIsMissing !== 'N/A' && (
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1">Missing</p>
            <p className="text-gray-700 text-sm leading-relaxed">{section.whatIsMissing}</p>
          </div>
        )}
        {section.whatIsConfusing && section.whatIsConfusing !== 'N/A' && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Confusing</p>
            <p className="text-gray-700 text-sm leading-relaxed">{section.whatIsConfusing}</p>
          </div>
        )}
        {section.whatToRemove && section.whatToRemove !== 'N/A' && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Remove</p>
            <p className="text-gray-700 text-sm leading-relaxed">{section.whatToRemove}</p>
          </div>
        )}
      </div>
    </ExpandableSection>
  );
}

function QuestionCard({ q }: { q: InvestorQuestion }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-start gap-3"
        onClick={() => setOpen(!open)}
      >
        <MessageSquare size={14} className="text-gray-400 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{q.question}</p>
          {!open && (
            <p className="text-xs text-gray-400 mt-0.5">
              Tests: {q.whyAsked}
            </p>
          )}
        </div>
        {open ? (
          <ChevronDown size={14} className="text-gray-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-gray-400 mt-0.5 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-3">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Why they ask this</p>
            <p className="text-sm text-gray-700">{q.whyAsked}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">What a great answer looks like</p>
            <p className="text-sm text-gray-700">{q.expectedAnswer}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ImprovementCard({ item }: { item: ImprovementSuggestion }) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`border rounded-lg overflow-hidden ${
      item.priority === 'critical' ? 'border-red-200' :
      item.priority === 'high' ? 'border-amber-200' :
      'border-blue-100'
    }`}>
      <button
        className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors flex items-center justify-between"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <PriorityBadge priority={item.priority} />
          <span className="text-sm font-medium text-gray-900">{item.section}</span>
        </div>
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100 space-y-3">
          {item.current && (
            <div className="bg-red-50 rounded p-3 border border-red-100">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-1">Current</p>
              <p className="text-sm text-red-800 italic">"{item.current}"</p>
            </div>
          )}
          {item.suggested && (
            <div className="bg-emerald-50 rounded p-3 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Suggested rewrite</p>
              <p className="text-sm text-emerald-900 leading-relaxed">{item.suggested}</p>
            </div>
          )}
          {item.reasoning && (
            <p className="text-xs text-gray-500 leading-relaxed">{item.reasoning}</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AnalysisView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getAnalysis(id)
      .then(setAnalysis)
      .catch(() => setError('Analysis not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-4 bg-gray-100 rounded w-32" />
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <p className="text-gray-500">{error || 'Analysis not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  const { result } = analysis;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900">{analysis.filename}</h1>
              {analysis.version > 1 && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  v{analysis.version}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(analysis.timestamp)} · {analysis.objective} · {analysis.context.targetInvestor}
            </p>
          </div>
          <button
            onClick={() => navigate('/new')}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <RotateCcw size={12} />
            New version
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <ScoreCard label="Clarity" score={result.overall.clarityScore} size="lg" />
        <ScoreCard label="Conviction" score={result.overall.convictionScore} size="lg" />
        <ScoreCard label="VC Interest" score={result.overall.investorAttractiveness} size="lg" />
        <ScoreCard label="Exec Risk" score={result.overall.executionRisk} invert size="lg" />
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700 leading-relaxed">{result.overall.summary}</p>
      </div>

      {/* Coaching Insight */}
      {result.coachingInsight && (
        <div className="bg-gray-900 text-white rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Coaching Signal
          </p>
          <p className="text-sm leading-relaxed">{result.coachingInsight}</p>
        </div>
      )}

      {/* Brutal Truth */}
      <div className="mb-6">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Brutal Truth
        </h2>
        <div className="bg-red-50 border border-red-100 rounded-lg p-5 space-y-4">
          {result.brutalTruth.rejectionReasons.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
                Why this gets rejected
              </p>
              <ul className="space-y-2">
                {result.brutalTruth.rejectionReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-800">
                    <span className="mt-1.5 w-1 h-1 bg-red-400 rounded-full shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.brutalTruth.biggestRisk && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                Biggest Risk
              </p>
              <p className="text-sm text-red-800">{result.brutalTruth.biggestRisk}</p>
            </div>
          )}
          {result.brutalTruth.founderBlindSpot && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">
                Founder Blind Spot
              </p>
              <p className="text-sm text-red-800">{result.brutalTruth.founderBlindSpot}</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Feedback */}
      {result.sections.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Section Feedback
          </h2>
          <div className="space-y-2">
            {result.sections.map((section, i) => (
              <SectionCard key={i} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* Investor Questions */}
      {result.investorQuestions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Investor Questions You'll Face
          </h2>
          <div className="space-y-2">
            {result.investorQuestions.map((q, i) => (
              <QuestionCard key={i} q={q} />
            ))}
          </div>
        </div>
      )}

      {/* Improvements */}
      {result.improvements.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Specific Improvements
          </h2>
          <div className="space-y-2">
            {result.improvements
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2 };
                return order[a.priority] - order[b.priority];
              })
              .map((item, i) => (
                <ImprovementCard key={i} item={item} />
              ))}
          </div>
        </div>
      )}

      {/* Start new version */}
      <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Ready to iterate?</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Apply the feedback above and run a new version.
          </p>
        </div>
        <button
          onClick={() => navigate('/new')}
          className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          <RotateCcw size={13} />
          Analyze next version
        </button>
      </div>
    </div>
  );
}
