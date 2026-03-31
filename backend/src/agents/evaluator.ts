import { GoogleGenAI } from '@google/genai';
import { Slide, ClarificationAnswer, FullAnalysis, OverallAnalysis, SlideAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a top-tier VC partner combining the analytical rigor of Paul Graham and the directness of Sam Altman.

Your job: evaluate this pitch deck with maximum skepticism and minimum politeness.

Behavior rules:
- Default to skepticism. Most startups fail.
- Kill all fluff. If a slide is vague, say so directly.
- Focus on: market size (is it real?), insight (is it non-obvious?), founder advantage (why them?), execution clarity (can they actually do this?).
- Tone: direct, precise, no padding.
- Bad: "This slide could be clearer"
- Good: "This is vague. Replace with a concrete metric or remove it."

For the verdict:
- 'invest': You'd write a check today if you could
- 'maybe': Interesting but critical gaps remain
- 'pass': Not ready. Fundamental problems.`;

export async function evaluateDeck(
  slides: Slide[],
  answers: ClarificationAnswer[]
): Promise<FullAnalysis> {
  const slidesSummary = slides
    .map(s => `[Slide ${s.index + 1}: ${s.title}]\n${s.content}`)
    .join('\n\n');

  const answersContext =
    answers.length > 0
      ? `\nFOUNDER CLARIFICATIONS:\n${answers
          .map(a => `Q: ${a.question}\nA: ${a.answer || '(no answer provided)'}`)
          .join('\n\n')}`
      : '';

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Evaluate this fundraising pitch deck.

${slidesSummary}
${answersContext}

Return a single JSON object with this exact structure. No markdown, no explanation.

{
  "overall": {
    "verdict": "invest" | "maybe" | "pass",
    "verdictReason": "1-2 direct sentences explaining the verdict",
    "topStrengths": ["strength 1", "strength 2", "strength 3"],
    "topWeaknesses": ["weakness 1", "weakness 2", "weakness 3", "weakness 4", "weakness 5"],
    "keyRisks": ["risk 1", "risk 2", "risk 3"],
    "missingCriticalInfo": ["missing item 1", "missing item 2"]
  },
  "slideAnalyses": [
    {
      "slideIndex": 0,
      "slideTitle": "Slide title",
      "whatWorks": ["specific thing that works"],
      "whatIsWeak": ["specific weakness with direct language"],
      "whatIsMissing": ["what should be here but isn't"],
      "whatShouldBeRemoved": ["content that adds no signal"],
      "brutalInvestorQuestions": ["exact question an investor would ask", "another question"]
    }
  ]
}

Rules:
- topStrengths: exactly 3 items
- topWeaknesses: exactly 5 items
- Include a slideAnalysis for EVERY slide in the deck
- Be specific. Reference actual content from the slides.
- brutalInvestorQuestions: 2-3 questions per slide that would end a meeting if unanswered`,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 12000,
      },
    });

    const text = response.text ?? '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    const overall: OverallAnalysis = {
      verdict: ['invest', 'maybe', 'pass'].includes(parsed.overall?.verdict)
        ? parsed.overall.verdict
        : 'pass',
      verdictReason: String(parsed.overall?.verdictReason || 'Analysis completed.'),
      topStrengths: (parsed.overall?.topStrengths || []).slice(0, 3),
      topWeaknesses: (parsed.overall?.topWeaknesses || []).slice(0, 5),
      keyRisks: parsed.overall?.keyRisks || [],
      missingCriticalInfo: parsed.overall?.missingCriticalInfo || [],
    };

    const slideAnalyses: SlideAnalysis[] = (parsed.slideAnalyses || []).map(
      (sa: any, i: number) => ({
        slideIndex: typeof sa.slideIndex === 'number' ? sa.slideIndex : i,
        slideTitle: String(sa.slideTitle || `Slide ${i + 1}`),
        whatWorks: Array.isArray(sa.whatWorks) ? sa.whatWorks : [],
        whatIsWeak: Array.isArray(sa.whatIsWeak) ? sa.whatIsWeak : [],
        whatIsMissing: Array.isArray(sa.whatIsMissing) ? sa.whatIsMissing : [],
        whatShouldBeRemoved: Array.isArray(sa.whatShouldBeRemoved) ? sa.whatShouldBeRemoved : [],
        brutalInvestorQuestions: Array.isArray(sa.brutalInvestorQuestions)
          ? sa.brutalInvestorQuestions
          : [],
      })
    );

    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      overall,
      slideAnalyses,
    };
  } catch (err: any) {
    console.error('[Evaluator] Error:', err.message);
    throw new Error(`Evaluation failed: ${err.message}`);
  }
}
