import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  MessageSquare,
  X,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getVersion, getDeck, sendChatMessage } from '../api';
import { DeckVersion, SlideAnalysis, Slide, ChatMessage, FullAnalysis } from '../types';

// ── Verdict Badge ─────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: 'invest' | 'maybe' | 'pass' }) {
  const cfg = {
    invest: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    maybe: 'bg-amber-100 text-amber-800 border-amber-200',
    pass: 'bg-red-100 text-red-800 border-red-200',
  };
  const labels = { invest: 'INVEST', maybe: 'MAYBE', pass: 'PASS' };
  return (
    <span
      className={`inline-flex items-center border rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wide ${cfg[verdict]}`}
    >
      {labels[verdict]}
    </span>
  );
}

// ── Progress Comparison ───────────────────────────────────────────────────────

function ProgressSection({ progress }: { progress: NonNullable<FullAnalysis['progressVsPrevious']> }) {
  return (
    <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-900">Progress Since Last Version</h2>
        <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded font-mono">
          {progress.verdictShift}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {progress.improved.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2 flex items-center gap-1">
              <TrendingUp size={11} /> Improved
            </p>
            <ul className="space-y-1">
              {progress.improved.map((item, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progress.regressed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <TrendingDown size={11} /> Regressed
            </p>
            <ul className="space-y-1">
              {progress.regressed.map((item, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="text-red-400 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progress.stayedSame.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Minus size={11} /> Same
            </p>
            <ul className="space-y-1">
              {progress.stayedSame.map((item, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-gray-300 mt-0.5">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {progress.remainingGaps.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
              Remaining Gaps
            </p>
            <ul className="space-y-1">
              {progress.remainingGaps.map((item, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                  <span className="text-amber-400 mt-0.5">!</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Slide Chat Panel ──────────────────────────────────────────────────────────

interface SlideChatProps {
  deckId: string;
  versionId: string;
  slide: Slide;
  onClose: () => void;
}

function SlideChatPanel({ deckId, versionId, slide, onClose }: SlideChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput('');
    setSending(true);

    const userMsg: ChatMessage = { role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await sendChatMessage(deckId, versionId, slide.index, msg, chatId);
      setChatId(result.chatId);
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: result.reply,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        role: 'assistant',
        content: `Error: ${err.response?.data?.error || err.message || 'Chat failed'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl mt-3 flex flex-col bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-gray-400" />
          <span className="text-sm font-medium text-gray-900">
            Discuss: {slide.title}
          </span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-80 px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">
            Ask about this slide. Request rewrites. Challenge the analysis.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-xs rounded-lg px-3 py-2 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <Loader2 size={12} className="text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-100">
        <textarea
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400 transition-colors"
          placeholder="Ask about this slide..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={2}
        />
        <button
          onClick={send}
          disabled={!input.trim() || sending}
          className="flex items-center justify-center w-8 h-8 bg-gray-900 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors shrink-0"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Slide Card ────────────────────────────────────────────────────────────────

interface SlideCardProps {
  slide: Slide;
  analysis: SlideAnalysis;
  deckId: string;
  versionId: string;
}

function SlideCard({ slide, analysis, deckId, versionId }: SlideCardProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [contentExpanded, setContentExpanded] = useState(false);

  const hasIssues = analysis.whatIsWeak.length > 0 || analysis.whatIsMissing.length > 0;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
      {/* Slide header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono">
            {slide.index + 1}
          </span>
          <h3 className="text-sm font-semibold text-gray-900">{slide.title}</h3>
          {hasIssues ? (
            <XCircle size={13} className="text-red-300" />
          ) : (
            <CheckCircle2 size={13} className="text-emerald-300" />
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 divide-x divide-gray-100">
        {/* Left: Slide content */}
        <div className="p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Slide Content
          </p>
          <div
            className={`text-xs text-gray-600 leading-relaxed whitespace-pre-wrap overflow-hidden transition-all ${
              contentExpanded ? '' : 'max-h-32'
            }`}
          >
            {slide.content}
          </div>
          {slide.content.length > 300 && (
            <button
              onClick={() => setContentExpanded(!contentExpanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 mt-2 transition-colors"
            >
              {contentExpanded ? (
                <>
                  <ChevronUp size={11} /> Show less
                </>
              ) : (
                <>
                  <ChevronDown size={11} /> Show more
                </>
              )}
            </button>
          )}
        </div>

        {/* Right: Analysis */}
        <div className="p-4 space-y-3">
          {analysis.whatWorks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1 flex items-center gap-1">
                <CheckCircle2 size={10} /> What works
              </p>
              <ul className="space-y-0.5">
                {analysis.whatWorks.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.whatIsWeak.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <XCircle size={10} /> What's weak
              </p>
              <ul className="space-y-0.5">
                {analysis.whatIsWeak.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.whatIsMissing.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                <HelpCircle size={10} /> What's missing
              </p>
              <ul className="space-y-0.5">
                {analysis.whatIsMissing.map((item, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                    <span className="text-amber-400 mt-0.5 shrink-0">?</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.whatShouldBeRemoved.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Trash2 size={10} /> Remove this
              </p>
              <ul className="space-y-0.5">
                {analysis.whatShouldBeRemoved.map((item, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="text-gray-300 mt-0.5 shrink-0">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.brutalInvestorQuestions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Investor Questions
              </p>
              <ul className="space-y-1">
                {analysis.brutalInvestorQuestions.map((q, i) => (
                  <li key={i} className="text-xs text-gray-600 italic">
                    "{q}"
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Discuss button */}
          <div className="pt-1">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
            >
              <MessageSquare size={11} />
              {chatOpen ? 'Close chat' : 'Discuss / Improve'}
            </button>
          </div>
        </div>
      </div>

      {/* Chat panel */}
      {chatOpen && (
        <div className="px-4 pb-4">
          <SlideChatPanel
            deckId={deckId}
            versionId={versionId}
            slide={slide}
            onClose={() => setChatOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AnalysisView() {
  const { deckId, versionId } = useParams<{ deckId: string; versionId: string }>();
  const navigate = useNavigate();
  const [version, setVersion] = useState<DeckVersion | null>(null);
  const [deckName, setDeckName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deckId || !versionId) return;
    Promise.all([getVersion(deckId, versionId), getDeck(deckId)])
      .then(([v, d]) => {
        setVersion(v);
        setDeckName(d.name);
      })
      .catch(() => setError('Analysis not found'))
      .finally(() => setLoading(false));
  }, [deckId, versionId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-24 bg-gray-100 rounded-xl" />
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !version) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12 text-center">
        <p className="text-gray-500">{error || 'Version not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  if (!version.analysis) {
    return (
      <div className="max-w-4xl mx-auto px-8 py-12 text-center">
        <p className="text-gray-500">This version has not been analyzed yet.</p>
        <button onClick={() => navigate('/new')} className="mt-4 text-sm text-gray-700 underline">
          Start analysis
        </button>
      </div>
    );
  }

  const { analysis } = version;
  const { overall } = analysis;

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(`/decks/${deckId}`)}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          {deckName || 'Back'}
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-semibold text-gray-900">{deckName}</h1>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                v{version.versionNumber}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {new Date(version.analysis.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              {version.slides.length} slides
            </p>
          </div>
          <button
            onClick={() => navigate('/new')}
            className="flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            <Plus size={12} />
            New version
          </button>
        </div>
      </div>

      {/* Overall verdict card */}
      <div className="border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex items-start gap-4 mb-5">
          <VerdictBadge verdict={overall.verdict} />
          <p className="text-sm text-gray-700 leading-relaxed flex-1">{overall.verdictReason}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Strengths */}
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-2">
              Strengths (3)
            </p>
            <ul className="space-y-1">
              {overall.topStrengths.map((s, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                  <span className="text-emerald-400 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div>
            <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-2">
              Weaknesses (5)
            </p>
            <ul className="space-y-1">
              {overall.topWeaknesses.map((w, i) => (
                <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                  <span className="text-red-400 shrink-0">✗</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          {overall.keyRisks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
                Key Risks
              </p>
              <ul className="space-y-1">
                {overall.keyRisks.map((r, i) => (
                  <li key={i} className="text-xs text-gray-700 flex items-start gap-1">
                    <span className="text-amber-400 shrink-0">!</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Info */}
          {overall.missingCriticalInfo.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Missing Info
              </p>
              <ul className="space-y-1">
                {overall.missingCriticalInfo.map((m, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                    <span className="text-gray-300 shrink-0">?</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Progress comparison (if v2+) */}
      {analysis.progressVsPrevious && (
        <ProgressSection progress={analysis.progressVsPrevious} />
      )}

      {/* Slide by Slide */}
      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Slide by Slide
        </h2>

        {version.slides.map(slide => {
          const slideAnalysis = analysis.slideAnalyses.find(
            sa => sa.slideIndex === slide.index
          );
          if (!slideAnalysis) return null;
          return (
            <SlideCard
              key={slide.index}
              slide={slide}
              analysis={slideAnalysis}
              deckId={deckId!}
              versionId={versionId!}
            />
          );
        })}
      </div>
    </div>
  );
}
