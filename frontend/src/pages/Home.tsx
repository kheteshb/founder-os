import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { getDecks, parseDeck } from '../api';
import { DeckSummary } from '../types';

function VerdictBadge({ verdict }: { verdict?: 'invest' | 'maybe' | 'pass' }) {
  if (!verdict) return null;
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

export default function Home() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropping, setDropping] = useState(false);

  useEffect(() => {
    getDecks()
      .then(setDecks)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (!accepted[0]) return;
      setDropping(true);
      try {
        const fd = new FormData();
        fd.append('file', accepted[0]);
        const result = await parseDeck(fd);
        window.dispatchEvent(new Event('founder-os:refresh'));
        navigate('/new', {
          state: {
            fromParse: true,
            deckId: result.deckId,
            deckName: result.deckName,
            versionId: result.versionId,
            versionNumber: result.versionNumber,
            slides: result.slides,
            questions: result.questions,
          },
        });
      } catch (err: any) {
        setDropping(false);
        alert(err.response?.data?.error || 'Upload failed. Try again.');
      }
    },
    [navigate]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
    disabled: dropping,
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-8 py-12 space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (decks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <FileText size={20} className="text-gray-400" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900 mb-2">
            Upload your first pitch deck
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Get brutal, specific feedback from an investor lens. No fluff.
          </p>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 cursor-pointer transition-colors mb-4 ${
              isDragActive
                ? 'border-gray-400 bg-gray-50'
                : dropping
                ? 'border-gray-300 bg-gray-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            {dropping ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500">Parsing deck...</p>
              </div>
            ) : (
              <>
                <Upload size={20} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-600 font-medium">
                  {isDragActive ? 'Drop it here' : 'Drop PDF here, or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or TXT · Max 20MB</p>
              </>
            )}
          </div>

          <p className="text-xs text-gray-400">— or —</p>
          <button
            onClick={() => navigate('/new')}
            className="mt-3 inline-flex items-center gap-2 text-sm text-gray-700 border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-400 transition-colors"
          >
            <Plus size={14} />
            Paste text instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-gray-900">Your Decks</h1>
        <button
          onClick={() => navigate('/new')}
          className="flex items-center gap-1.5 bg-gray-900 text-white text-sm px-3 py-1.5 rounded font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={13} />
          New Analysis
        </button>
      </div>

      <div className="space-y-2">
        {decks.map(deck => (
          <button
            key={deck.id}
            onClick={() =>
              deck.latestVersionId
                ? navigate(`/decks/${deck.id}/versions/${deck.latestVersionId}`)
                : navigate(`/decks/${deck.id}`)
            }
            className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3.5 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={14} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{deck.name}</span>
                    {deck.versionCount > 1 && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                        {deck.versionCount} versions
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(deck.latestAnalysisDate || deck.createdAt)}
                  </p>
                </div>
              </div>
              <VerdictBadge verdict={deck.latestVerdict} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
