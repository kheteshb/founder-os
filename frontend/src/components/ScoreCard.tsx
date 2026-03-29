interface ScoreCardProps {
  label: string;
  score: number;
  maxScore?: number;
  invert?: boolean; // for risk scores where high = bad
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number, invert: boolean): string {
  const normalized = invert ? 11 - score : score;
  if (normalized >= 8) return 'text-emerald-600';
  if (normalized >= 6) return 'text-amber-500';
  return 'text-red-500';
}

function getScoreBg(score: number, invert: boolean): string {
  const normalized = invert ? 11 - score : score;
  if (normalized >= 8) return 'bg-emerald-50 border-emerald-100';
  if (normalized >= 6) return 'bg-amber-50 border-amber-100';
  return 'bg-red-50 border-red-100';
}

export default function ScoreCard({ label, score, maxScore = 10, invert = false, size = 'md' }: ScoreCardProps) {
  const colorClass = getScoreColor(score, invert);
  const bgClass = getScoreBg(score, invert);

  if (size === 'lg') {
    return (
      <div className={`border rounded-lg p-4 ${bgClass}`}>
        <div className={`text-3xl font-bold font-mono ${colorClass}`}>
          {score}<span className="text-lg font-normal text-gray-400">/{maxScore}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-wide">{label}</div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-sm font-semibold font-mono ${colorClass}`}>{score}/{maxScore}</span>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-3 ${bgClass}`}>
      <div className={`text-2xl font-bold font-mono ${colorClass}`}>
        {score}<span className="text-sm font-normal text-gray-400">/{maxScore}</span>
      </div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}
