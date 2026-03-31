import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getDeck } from '../api';
import { DeckWithVersions, DeckVersion } from '../types';

function VerdictBadge({ verdict }: { verdict?: 'invest' | 'maybe' | 'pass' }) {
  if (!verdict) return <span className="text-xs text-gray-400">Not analyzed</span>;
  const cfg = {
    invest: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    maybe: 'bg-amber-50 text-amber-700 border-amber-200',
    pass: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded border ${cfg[verdict]}`}>
      {verdict}
    </span>
  );
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function VerdictShift({ from, to }: { from?: string; to?: string }) {
  if (!from || !to || from === to) return <Minus size={11} className="text-gray-400" />;
  const isGood =
    (from === 'pass' && (to === 'maybe' || to === 'invest')) ||
    (from === 'maybe' && to === 'invest');
  const isBad =
    (from === 'invest' && (to === 'maybe' || to === 'pass')) ||
    (from === 'maybe' && to === 'pass');
  if (isGood) return <TrendingUp size={11} className="text-emerald-500" />;
  if (isBad) return <TrendingDown size={11} className="text-red-500" />;
  return <Minus size={11} className="text-gray-400" />;
}

export default function DeckHistory() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<DeckWithVersions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!deckId) return;
    getDeck(deckId)
      .then(setDeck)
      .catch(() => setError('Deck not found'))
      .finally(() => setLoading(false));
  }, [deckId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-16 bg-gray-100 rounded-xl" />
          <div className="h-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 text-center">
        <p className="text-gray-500">{error || 'Deck not found'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-gray-700 underline">
          Go home
        </button>
      </div>
    );
  }

  const versions = [...(deck.versions || [])].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        All Decks
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-gray-400" />
            <h1 className="text-xl font-semibold text-gray-900">{deck.name}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {versions.length} {versions.length === 1 ? 'version' : 'versions'}
          </p>
        </div>
        <button
          onClick={() => navigate('/new')}
          className="text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-400 hover:text-gray-900 transition-colors"
        >
          + New version
        </button>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        {versions.length > 1 && (
          <div className="absolute left-5 top-8 bottom-8 w-px bg-gray-200" />
        )}

        <div className="space-y-3">
          {versions.map((v: DeckVersion, i: number) => {
            const prevVersion = versions[i + 1]; // previous is next in reverse-sorted array
            const isLatest = i === 0;
            return (
              <button
                key={v.id}
                onClick={() => navigate(`/decks/${deckId}/versions/${v.id}`)}
                className="w-full text-left flex items-start gap-4 group"
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isLatest
                      ? 'border-gray-900 bg-gray-900'
                      : 'border-gray-300 bg-white group-hover:border-gray-500'
                  }`}
                >
                  <span
                    className={`text-xs font-bold ${
                      isLatest ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    v{v.versionNumber}
                  </span>
                </div>

                {/* Card */}
                <div className="flex-1 border border-gray-200 rounded-xl px-4 py-3.5 bg-white group-hover:border-gray-300 group-hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-900">
                        Version {v.versionNumber}
                        {isLatest && (
                          <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                            latest
                          </span>
                        )}
                      </p>
                      {prevVersion?.analysis && v.analysis && (
                        <VerdictShift
                          from={prevVersion.analysis.overall.verdict}
                          to={v.analysis.overall.verdict}
                        />
                      )}
                    </div>
                    <VerdictBadge verdict={v.analysis?.overall?.verdict} />
                  </div>

                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-xs text-gray-400">
                      {formatDate(v.uploadedAt)}
                    </p>
                    <span className="text-gray-200">·</span>
                    <p className="text-xs text-gray-400">{v.slides.length} slides</p>
                    {v.analysis?.overall?.verdictReason && (
                      <>
                        <span className="text-gray-200">·</span>
                        <p className="text-xs text-gray-500 truncate max-w-xs">
                          {v.analysis.overall.verdictReason}
                        </p>
                      </>
                    )}
                  </div>

                  {/* Progress comparison badge */}
                  {v.analysis?.progressVsPrevious && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded font-mono">
                        {v.analysis.progressVsPrevious.verdictShift}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
