import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import { analyzeDocument } from '../api';
import { Objective } from '../types';

type Step = 1 | 2 | 3 | 4;

const OBJECTIVES: { value: Objective; label: string; desc: string }[] = [
  { value: 'fundraising', label: 'Fundraising', desc: 'Investor pitch evaluation' },
  { value: 'hiring', label: 'Hiring', desc: 'Job posting or offer evaluation' },
  { value: 'customers', label: 'Customer Acquisition', desc: 'Sales deck or outreach review' },
  { value: 'partnerships', label: 'Partnerships', desc: 'Partnership deck or proposal' },
];

const STAGES = [
  'Pre-idea / Exploring',
  'Pre-seed (building)',
  'Seed ($0–$3M raised)',
  'Series A ($3M–$15M raised)',
  'Series B+ ($15M+ raised)',
];

const LOADING_STEPS = [
  'Parsing document...',
  'Extracting structure...',
  'Evaluating as investor...',
  'Running skeptic analysis...',
  'Generating improvements...',
  'Finalizing report...',
];

export default function NewAnalysis() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);

  // Step 1: Upload
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');

  // Step 2: Objective
  const [objective, setObjective] = useState<Objective>('fundraising');

  // Step 3: Context
  const [stage, setStage] = useState('');
  const [raised, setRaised] = useState('');
  const [targetInvestor, setTargetInvestor] = useState('');
  const [whyInvestor, setWhyInvestor] = useState('');
  const [keyMetric, setKeyMetric] = useState('');
  const [biggestConcern, setBiggestConcern] = useState('');

  // Step 4: Loading
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024,
  });

  const canProceedStep1 =
    inputMode === 'upload' ? !!file : pastedText.trim().length > 50;

  const canProceedStep3 =
    stage !== '' && targetInvestor.trim().length > 0;

  async function runAnalysis() {
    setStep(4);
    setError('');

    // Animate loading steps
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < LOADING_STEPS.length) setLoadingStep(i);
    }, 4000);

    try {
      const analysis = await analyzeDocument({
        file: inputMode === 'upload' ? file || undefined : undefined,
        pastedText: inputMode === 'paste' ? pastedText : undefined,
        context: {
          objective,
          stage,
          raised,
          targetInvestor,
          whyInvestor,
          keyMetric,
          biggestConcern,
        },
      });

      clearInterval(interval);
      navigate(`/analysis/${analysis.id}`);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.response?.data?.error || err.message || 'Analysis failed. Please try again.');
      setStep(3);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      {/* Progress */}
      {step < 4 && (
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  s < step
                    ? 'bg-gray-900 text-white'
                    : s === step
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              <span
                className={`text-xs ${
                  s === step ? 'text-gray-900 font-medium' : 'text-gray-400'
                }`}
              >
                {s === 1 ? 'Document' : s === 2 ? 'Objective' : 'Context'}
              </span>
              {s < 3 && <ChevronRight size={12} className="text-gray-300" />}
            </div>
          ))}
        </div>
      )}

      {/* ── Step 1: Upload ── */}
      {step === 1 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Upload your document</h1>
          <p className="text-sm text-gray-500 mb-6">
            Pitch deck PDF, memo, email, or any text. We'll extract and analyze it.
          </p>

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
                    {isDragActive ? 'Drop it here' : 'Drop your PDF here, or click to browse'}
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
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
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
                placeholder="Paste your pitch deck content, memo, or any text here..."
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1">{pastedText.length} characters</p>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Continue
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Objective ── */}
      {step === 2 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">What's this for?</h1>
          <p className="text-sm text-gray-500 mb-6">
            This shapes the evaluation lens we use.
          </p>

          <div className="space-y-2">
            {OBJECTIVES.map(obj => (
              <button
                key={obj.value}
                onClick={() => setObjective(obj.value)}
                className={`w-full text-left border rounded-lg px-4 py-3 transition-colors ${
                  objective === obj.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{obj.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{obj.desc}</p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border-2 transition-colors ${
                      objective === obj.value
                        ? 'border-gray-900 bg-gray-900'
                        : 'border-gray-300'
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded font-medium hover:bg-gray-800 transition-colors"
            >
              Continue
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Context ── */}
      {step === 3 && (
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Give us context</h1>
          <p className="text-sm text-gray-500 mb-6">
            5 sharp questions. This is what separates generic AI advice from real analysis.
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-5">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                What stage are you at? *
              </label>
              <select
                value={stage}
                onChange={e => setStage(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400 bg-white transition-colors"
              >
                <option value="">Select stage...</option>
                {STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Capital raised so far (if any)
              </label>
              <input
                type="text"
                placeholder="e.g. $500K from angels, nothing yet, $2M seed..."
                value={raised}
                onChange={e => setRaised(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Who is this document for? *
              </label>
              <input
                type="text"
                placeholder="e.g. Sequoia Capital, a16z, angel investors generally..."
                value={targetInvestor}
                onChange={e => setTargetInvestor(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Why this investor specifically?
              </label>
              <input
                type="text"
                placeholder="e.g. They led Stripe's seed, focus on B2B SaaS..."
                value={whyInvestor}
                onChange={e => setWhyInvestor(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                Your most important metric right now
              </label>
              <input
                type="text"
                placeholder="e.g. $45K MRR growing 20% m/m, 150 paying customers..."
                value={keyMetric}
                onChange={e => setKeyMetric(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1.5">
                What's your biggest concern about this pitch?
              </label>
              <input
                type="text"
                placeholder="e.g. market size feels small, team has no domain expertise..."
                value={biggestConcern}
                onChange={e => setBiggestConcern(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ← Back
            </button>
            <button
              disabled={!canProceedStep3}
              onClick={runAnalysis}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm px-5 py-2 rounded font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
            >
              Run Analysis
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Loading ── */}
      {step === 4 && (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 size={20} className="text-white animate-spin" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Analyzing your pitch</h2>
          <p className="text-sm text-gray-400 mb-8">
            Running 4 agents. This takes 30–60 seconds.
          </p>

          <div className="max-w-xs mx-auto space-y-2">
            {LOADING_STEPS.map((s, i) => (
              <div
                key={s}
                className={`flex items-center gap-2 text-sm transition-all ${
                  i <= loadingStep ? 'text-gray-900' : 'text-gray-300'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    i < loadingStep
                      ? 'bg-emerald-500'
                      : i === loadingStep
                      ? 'bg-gray-900 animate-pulse'
                      : 'bg-gray-200'
                  }`}
                />
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
