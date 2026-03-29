import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getHistory } from '../api';
import { AnalysisSummary } from '../types';

function ScoreDelta({ current, prev }: { current: number; prev?: number }) {
  if (prev === undefined) return null;
  const delta = current - prev;
  if (delta === 0) return <Minus size={12} className="text-gray-400" />;
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-xs text-emerald-600">
      <TrendingUp size={11} /> +{delta}
    </span>
  );
  return (
    <span className="flex items-center gap-0.5 text-xs text-red-500">
      <TrendingDown size={11} /> {delta}
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

function objectiveLabel(obj: string) {
  const map: Record<string, string> = {
    fundraising: 'Fundraising',
    hiring: 'Hiring',
    customers: 'Customer Acq.',
    partnerships: 'Partnerships',
  };
  return map[obj] || obj;
}

export default function History() {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(setSummaries)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Group by groupId
  const groups = new Map<string, AnalysisSummary[]>();
  for (const s of summaries) {
    const gid = s.groupId || s.id;
    if (!groups.has(gid)) groups.set(gid, []);
    groups.get(gid)!.push(s);
  }
  // Sort each group by version
  for (const [, arr] of groups) {
    arr.sort((a, b) => a.version - b.version);
  }

  const groupList = Array.from(groups.entries()).sort((a, b) => {
    const latestA = a[1][a[1].length - 1];
    const latestB = b[1][b[1].length - 1];
    return new Date(latestB.timestamp).getTime() - new Date(latestA.timestamp).getTime();
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">History</h1>
        <p className="text-sm text-gray-500 mt-1">
          {summaries.length} {summaries.length === 1 ? 'analysis' : 'analyses'} across {groupList.length}{' '}
          {groupList.length === 1 ? 'document' : 'documents'}
        </p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white border border-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && groupList.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No analyses yet.</p>
          <button
            onClick={() => navigate('/new')}
            className="mt-4 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 transition-colors"
          >
            Start first analysis
          </button>
        </div>
      )}

      <div className="space-y-6">
        {groupList.map(([groupId, versions]) => {
          const latest = versions[versions.length - 1];
          const first = versions[0];
          const hasIterations = versions.length > 1;

          return (
            <div key={groupId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Group header */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{latest.filename}</span>
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {objectiveLabel(latest.objective)}
                    </span>
                  </div>
                  {hasIterations && (
                    <span className="text-xs text-gray-400">
                      {versions.length} versions
                    </span>
                  )}
                </div>

                {hasIterations && (
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span>v1 → v{versions.length}</span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      Clarity:
                      <span className="font-mono">{first.overall.clarityScore}</span>
                      →
                      <span className="font-mono">{latest.overall.clarityScore}</span>
                      <ScoreDelta current={latest.overall.clarityScore} prev={first.overall.clarityScore} />
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      VC:
                      <span className="font-mono">{first.overall.investorAttractiveness}</span>
                      →
                      <span className="font-mono">{latest.overall.investorAttractiveness}</span>
                      <ScoreDelta current={latest.overall.investorAttractiveness} prev={first.overall.investorAttractiveness} />
                    </span>
                  </div>
                )}
              </div>

              {/* Versions */}
              <div className="divide-y divide-gray-50">
                {versions.map((v, i) => {
                  const prev = i > 0 ? versions[i - 1] : undefined;
                  return (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/analysis/${v.id}`)}
                      className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 font-mono w-5">v{v.version}</span>
                        <div>
                          <p className="text-xs text-gray-500">{formatDate(v.timestamp)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{v.context.targetInvestor}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            Clarity{' '}
                            <span className="font-mono font-semibold text-gray-900">
                              {v.overall.clarityScore}
                            </span>
                          </span>
                          {prev && (
                            <ScoreDelta
                              current={v.overall.clarityScore}
                              prev={prev.overall.clarityScore}
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>
                            VC{' '}
                            <span className="font-mono font-semibold text-gray-900">
                              {v.overall.investorAttractiveness}
                            </span>
                          </span>
                          {prev && (
                            <ScoreDelta
                              current={v.overall.investorAttractiveness}
                              prev={prev.overall.investorAttractiveness}
                            />
                          )}
                        </div>
                        <ArrowRight
                          size={12}
                          className="text-gray-300 group-hover:text-gray-600 transition-colors"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
