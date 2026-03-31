import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { parseDeck, analyzeVersion } from '../api';
import { ClarificationQuestion, ClarificationAnswer, Slide } from '../types';

type Step = 'upload' | 'questions' | 'analyzing';

interface ParseState {
  deckId: string;
  deckName: string;
  versionId: string;
  versionNumber: number;
  slides: Slide[];
  questions: ClarificationQuestion[];
}

export default function NewAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState<Step>('upload');
  const [error, setError] = useState('');

  // Upload step
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [deckName, setDeckName] = useState('');
  const [parsing, setParsing] = useState(false);

  // Questions step
  const [parseState, setParseState] = useState<ParseState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Check if navigated here with pre-parsed state (from Home drop zone)
  useEffect(() => {
    const state = location.state as any;
    if (state?.fromParse) {
      setParseState({
        deckId: state.deckId,
        deckName: state.deckName,
        versionId: state.versionId,
        versionNumber: state.versionNumber,
        slides: state.slides,
        questions: state.questions,
      });
      setStep('questions');
    }
  }, [location.state]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const canProceedUpload =
    inputMode === 'upload' ? !!file : pastedText.trim().length > 50;

  async function handleParse() {
    setParsing(true);
    setError('');
    try {
      const fd = new FormData();
      if (inputMode === 'upload' && file) {
        fd.append('file', file);
      } else {
        fd.append('pastedText', pastedText);
      }
      if (deckName.trim()) {
        fd.append('deckName', deckName.trim());
      }

      const result = await parseDeck(fd);
      setParseState({
        deckId: result.deckId,
        deckName: result.deckName,
        versionId: result.versionId,
        versionNumber: result.versionNumber,
        slides: result.slides,
        questions: result.questions,
      });
      window.dispatchEvent(new Event('founder-os:refresh'));
      setStep('questions');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Parse failed. Try again.');
    } finally {
      setParsing(false);
    }
  }

  async function handleAnalyze() {
    if (!parseState) return;
    setStep('analyzing');
    setError('');
    try {
      const answersList: ClarificationAnswer[] = (parseState.questions || []).map(q => ({
        questionId: q.id,
        question: q.question,
        answer: answers[q.id] || '',
      }));

      const result = await analyzeVersion(parseState.versionId, answersList);
      window.dispatchEvent(new Event('founder-os:refresh'));
      navigate(`/decks/${parseState.deckId}/versions/${parseState.versionId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Analysis failed. Try again.');
      setStep('questions');
    }
  }

  // ── Step: Upload ──────────────────────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="max-w-xl mx-auto px-8 py-12">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload your pitch deck</h1>
          <p className="text-sm text-gray-500">PDF or paste text. We'll parse it into slides.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              inputMode === 'upload'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setInputMode('upload')}
          >
            Upload file
          </button>
          <button
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              inputMode === 'paste'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            onClick={() => setInputMode('paste')}
          >
            Paste text
          </button>
        </div>

        {inputMode === 'upload' ? (
          <div>
            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={20} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-600 font-medium">
                  {isDragActive ? 'Drop it here' : 'Drop PDF here, or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF or TXT · Max 20MB</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                    <FileText size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <textarea
              className="w-full h-48 border border-gray-200 rounded-xl p-4 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-400 transition-colors"
              placeholder="Paste your pitch deck content here..."
              value={pastedText}
              onChange={e => setPastedText(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{pastedText.length} characters</p>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 mb-1.5">
            Deck name (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Acme Series A Deck"
            value={deckName}
            onChange={e => setDeckName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
          />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            disabled={!canProceedUpload || parsing}
            onClick={handleParse}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
          >
            {parsing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Parsing...
              </>
            ) : (
              <>
                Continue
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Questions ───────────────────────────────────────────────────────
  if (step === 'questions' && parseState) {
    return (
      <div className="max-w-xl mx-auto px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => setStep('upload')}
            className="text-sm text-gray-400 hover:text-gray-700 transition-colors mb-4 block"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            {parseState.deckName}
          </h1>
          <p className="text-sm text-gray-500">
            {parseState.slides.length} slides parsed
            {parseState.versionNumber > 1 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                v{parseState.versionNumber}
              </span>
            )}
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {parseState.questions && parseState.questions.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Clarification Questions — answer what you can, skip the rest
            </p>
            <div className="space-y-5">
              {parseState.questions.map(q => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    {q.question}
                  </label>
                  <p className="text-xs text-gray-400 mb-2">{q.reason}</p>
                  <textarea
                    className="w-full h-20 border border-gray-200 rounded-lg p-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:border-gray-400 transition-colors"
                    placeholder="Optional — leave blank to skip"
                    value={answers[q.id] || ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              No clarification questions generated. Running analysis with slide content only.
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
          >
            Run Analysis
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Step: Analyzing ───────────────────────────────────────────────────────
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 size={20} className="text-white animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Analyzing with investor lens...</h2>
        <p className="text-sm text-gray-400">This takes 30–60 seconds. Running 4 agents.</p>
      </div>
    </div>
  );
}
