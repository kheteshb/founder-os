import { GoogleGenAI } from '@google/genai';
import { ContextAnswers, AnalysisResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });
const MODEL = 'gemini-3-flash-preview';

const ANALYST_SYSTEM = `You are a ruthless startup analyst. Extract and structure exactly what is in the document - no fluff, no filler.

For each section/slide, identify:
- The claim being made
- Any metrics or data
- What the narrative assumes

Output clean JSON only. No markdown, no explanation.`;

const INVESTOR_SYSTEM = `You are a top-tier VC investor who has seen 10,000+ pitches and funded 50+ companies.

You think like Paul Graham and Sam Altman combined:
- Cut through fluff instantly
- Default to deep skepticism
- Reward specificity and insight
- Penalize vague language and borrowed ideas
- Care about: real market size, defensibility, founder conviction, unit economics, timing

Your job: evaluate this pitch like you're deciding whether to take a meeting.

Rules:
- Be specific. Generic feedback is useless.
- Quote the actual text when critiquing it.
- Every weakness must name exactly what is wrong.
- Don't soften anything. Founders need truth.

Output clean JSON only.`;

const SKEPTIC_SYSTEM = `You are the most skeptical person in the room. Your job is to find every hole.

Ask exactly the questions that kill fundraises:
- The "why not Google?" question
- The "where are the real numbers?" question
- The "why you?" question
- The "why now?" question
- The hidden assumption questions

Be the investor who passes. Articulate exactly why.

Output clean JSON only.`;

const COACH_SYSTEM = `You are a founder coach who has helped 200+ companies improve their pitches.

Your job: turn brutal feedback into specific, actionable improvements.

Rules:
- Every improvement must show: CURRENT text → BETTER text
- No generic advice ("be more specific" is useless)
- Prioritize ruthlessly: 2-3 critical items, not 10 medium ones
- Focus on what changes the outcome, not polish

Output clean JSON only.`;

function extractJSON(text: string): any {
  // Try to find JSON in the response
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try { return JSON.parse(codeBlockMatch[1].trim()); } catch {}
  }

  const objectMatch = text.match(/(\{[\s\S]*\})/);
  if (objectMatch) {
    try { return JSON.parse(objectMatch[1]); } catch {}
  }

  return null;
}

function buildContextString(context: ContextAnswers): string {
  return `
FOUNDER CONTEXT:
- Stage: ${context.stage}
- Capital raised: ${context.raised || 'Not specified'}
- Target investor/audience: ${context.targetInvestor}
- Why this investor: ${context.whyInvestor}
- Key metric: ${context.keyMetric}
- Biggest concern: ${context.biggestConcern}
- Objective: ${context.objective}`.trim();
}

export async function runAnalysis(
  content: string,
  context: ContextAnswers,
  onProgress: (step: string) => void
): Promise<AnalysisResult> {
  const contextStr = buildContextString(context);

  // ─── Agent 1: Analyst ────────────────────────────────────────────────────
  onProgress('Extracting document structure...');

  const analystRes = await ai.models.generateContent({
    model: MODEL,
    contents: `Analyze this startup document.

${contextStr}

DOCUMENT:
${content}

Output this JSON structure:
{
  "documentType": "pitch deck | memo | email | other",
  "sections": [
    {
      "title": "section name",
      "content": "what it actually says (quote key phrases)",
      "keyClaimOrMetric": "the core point"
    }
  ],
  "overallNarrative": "the story being told in 2 sentences",
  "metricsPresent": ["list of any numbers/metrics mentioned"],
  "criticallyMissing": ["info a top investor would immediately ask for that isn't here"]
}`,
    config: { systemInstruction: ANALYST_SYSTEM, maxOutputTokens: 4000 }
  });

  const analystText = analystRes.text ?? '';
  const extractedStructure = extractJSON(analystText) || { sections: [], overallNarrative: '' };

  // ─── Agent 2: Investor Evaluation ────────────────────────────────────────
  onProgress('Evaluating as a top investor...');

  const investorRes = await ai.models.generateContent({
    model: MODEL,
    contents: `Evaluate this pitch. Be a top-tier VC deciding whether to take a meeting.

${contextStr}

DOCUMENT STRUCTURE:
${JSON.stringify(extractedStructure, null, 2)}

FULL DOCUMENT:
${content}

Output this exact JSON structure:
{
  "overall": {
    "clarityScore": <1-10, be harsh>,
    "convictionScore": <1-10, how much do you believe in this>,
    "investorAttractiveness": <1-10, would you fund this>,
    "executionRisk": <1-10, 10 = highest risk>,
    "summary": "<2-3 sentence honest assessment. Lead with the most important thing.>"
  },
  "sections": [
    {
      "title": "<section title>",
      "originalContent": "<key quote from this section>",
      "whatWorks": "<specific thing that actually works, or 'Nothing stands out'>",
      "whatIsWeak": "<specific weakness with quote>",
      "whatIsMissing": "<specific missing element>",
      "whatIsConfusing": "<specific confusing element or 'N/A'>",
      "whatToRemove": "<what adds no signal or 'N/A'>"
    }
  ],
  "brutalTruth": {
    "rejectionReasons": [
      "<exact reason 1 a top VC would pass - be specific>",
      "<exact reason 2>",
      "<exact reason 3>"
    ],
    "biggestRisk": "<the single biggest thing that could kill this>",
    "founderBlindSpot": "<what the founder clearly doesn't see>"
  }
}`,
    config: { systemInstruction: INVESTOR_SYSTEM, maxOutputTokens: 6000 }
  });

  const investorText = investorRes.text ?? '';
  const evaluation = extractJSON(investorText) || {};

  // ─── Agent 3: Skeptic + Investor Questions ────────────────────────────────
  onProgress('Generating investor questions...');

  const skepticRes = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate the 5 toughest investor questions for this pitch.

${contextStr}

EVALUATION SO FAR:
${JSON.stringify(evaluation?.brutalTruth || {}, null, 2)}

FULL DOCUMENT:
${content}

Output this JSON:
{
  "investorQuestions": [
    {
      "question": "<exact, brutal question an investor would ask>",
      "whyAsked": "<what underlying concern is this probing>",
      "expectedAnswer": "<what a great answer looks like - be specific>"
    }
  ]
}

Make them painful. These are the questions that end meetings.`,
    config: { systemInstruction: SKEPTIC_SYSTEM, maxOutputTokens: 3000 }
  });

  const skepticText = skepticRes.text ?? '';
  const skepticData = extractJSON(skepticText) || { investorQuestions: [] };

  // ─── Agent 4: Coach ───────────────────────────────────────────────────────
  onProgress('Synthesizing improvements...');

  const coachRes = await ai.models.generateContent({
    model: MODEL,
    contents: `Generate specific improvements for this pitch. Show exactly what to change.

${contextStr}

FULL EVALUATION:
${JSON.stringify(evaluation, null, 2)}

FULL DOCUMENT:
${content}

Output this JSON:
{
  "improvements": [
    {
      "priority": "critical|high|medium",
      "section": "<section name>",
      "current": "<exact quote of what's currently written>",
      "suggested": "<exact replacement text — full sentences, ready to paste>",
      "reasoning": "<why this change materially improves the outcome>"
    }
  ],
  "coachingInsight": "<one pattern this founder needs to break — be direct>"
}

Rules:
- Max 7 improvements
- At least 2 must be critical
- Every "suggested" must be a complete, pasteable rewrite
- Order by impact (most critical first)`,
    config: { systemInstruction: COACH_SYSTEM, maxOutputTokens: 4000 }
  });

  const coachText = coachRes.text ?? '';
  const coaching = extractJSON(coachText) || { improvements: [], coachingInsight: '' };

  // ─── Combine ──────────────────────────────────────────────────────────────
  const result: AnalysisResult = {
    overall: evaluation.overall || {
      clarityScore: 5,
      convictionScore: 5,
      investorAttractiveness: 5,
      executionRisk: 5,
      summary: 'Analysis completed.'
    },
    sections: evaluation.sections || [],
    brutalTruth: evaluation.brutalTruth || {
      rejectionReasons: [],
      biggestRisk: '',
      founderBlindSpot: ''
    },
    investorQuestions: skepticData.investorQuestions || [],
    improvements: coaching.improvements || [],
    coachingInsight: coaching.coachingInsight || ''
  };

  return result;
}
