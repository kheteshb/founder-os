import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { getHistory } from '../api';
import { AnalysisSummary } from '../types';

function ScorePill({ score, invert = false }: { score: number; invert?: boolean }) {
  const norm = invert ? 11 - score : score;
  const cls =
    norm >= 8
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : norm >= 6
      ? 'bg-amber-50 text-amber-700 border-amber-100'
      : 'bg-red-50 text-red-700 border-red-100';
  return (
    <span className={`inline-flex items-center border rounded px-1.5 py-0.5 text-xs font-mono font-semibold ${cls}`}>
      {score}
    </span>
  );
}

function objectiveLabel(obj: string) {
  const map: Record<string, string> = {
    fundraising: 'Fundraising',
    hiring: 'Hiring',
    customers: 'Customer Acq.',
    partnerships: 'Partnerships',
  };
  return map[obj] || obj;
}

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setSummaries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const recent = summaries.slice(0, 6);

  // Group by groupId to show latest per group
  const groups = new Map<string, AnalysisSummary>();
  for (const s of summaries) {
    const gid = s.groupId || s.id;
    if (!groups.has(gid) || (groups.get(gid)!.version < s.version)) {
      groups.set(gid, s);
    }
  }
  const latestPerGroup = Array.from(groups.values()).slice(0, 6);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-gray-900">Founder OS</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Pitch review. Investment thinking. No fluff.
        </p>
      </div>

      {/* Quick start */}
      {summaries.length === 0 && !loading && (
        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center mb-10">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={18} className="text-gray-400" />
          </div>
          <h2 className="text-sm font-medium text-gray-900 mb-1">No analyses yet</h2>
          <p className="text-xs text-gray-500 mb-5">
            Upload a pitch deck or memo and get brutal, specific feedback in minutes.
          </p>
          <button
            onClick={() => navigate('/new')}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus size={14} />
            Start your first analysis
          </button>
        </div>
      )}

      {/* Recent analyses */}
      {latestPerGroup.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Recent
            </h2>
            {summaries.length > 6 && (
              <button
                onClick={() => navigate('/history')}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
              >
                View all →
              </button>
            )}
          </div>

          <div className="space-y-2">
            {latestPerGroup.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/analysis/${s.id}`)}
                className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={14} className="text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {s.filename}
                        </span>
                        {s.version > 1 && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                            v{s.version}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{formatDate(s.timestamp)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{objectiveLabel(s.objective)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{s.context.targetInvestor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Clarity</span>
                      <ScorePill score={s.overall.clarityScore} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">VC</span>
                      <ScorePill score={s.overall.investorAttractiveness} />
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-gray-300 group-hover:text-gray-600 transition-colors"
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button
              onClick={() => navigate('/new')}
              className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded hover:bg-gray-800 transition-colors font-medium"
            >
              <Plus size={14} />
              New Analysis
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white border border-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
