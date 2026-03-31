import { GoogleGenAI } from '@google/genai';
import { FullAnalysis, DeckVersion, ProgressComparison } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

export async function compareVersions(
  previousAnalysis: FullAnalysis,
  currentAnalysis: FullAnalysis,
  previousVersion: DeckVersion
): Promise<ProgressComparison> {
  try {
    const prevSummary = {
      verdict: previousAnalysis.overall.verdict,
      topStrengths: previousAnalysis.overall.topStrengths,
      topWeaknesses: previousAnalysis.overall.topWeaknesses,
      keyRisks: previousAnalysis.overall.keyRisks,
      missingCriticalInfo: previousAnalysis.overall.missingCriticalInfo,
      slideCount: previousVersion.slides.length,
    };

    const currSummary = {
      verdict: currentAnalysis.overall.verdict,
      topStrengths: currentAnalysis.overall.topStrengths,
      topWeaknesses: currentAnalysis.overall.topWeaknesses,
      keyRisks: currentAnalysis.overall.keyRisks,
      missingCriticalInfo: currentAnalysis.overall.missingCriticalInfo,
    };

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Compare these two pitch deck analyses and identify what changed. Be specific — reference actual content.

PREVIOUS VERSION (v${previousVersion.versionNumber}) ANALYSIS:
${JSON.stringify(prevSummary, null, 2)}

CURRENT VERSION ANALYSIS:
${JSON.stringify(currSummary, null, 2)}

Return a JSON object only. No markdown, no explanation.

{
  "improved": ["specific thing that genuinely got better with detail"],
  "stayedSame": ["specific thing that did not change"],
  "regressed": ["specific thing that got worse"],
  "remainingGaps": ["critical gap that still has not been addressed"],
  "verdictShift": "e.g. pass → maybe, or same: maybe → maybe"
}

Rules:
- Be specific. Reference actual content from the analyses.
- "improved" means something was concretely fixed, not just rephrased
- "regressed" means something got worse or a new problem was introduced
- verdictShift format: "previous → current"`,
      config: {
        maxOutputTokens: 3000,
      },
    });

    const text = response.text ?? '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      improved: Array.isArray(parsed.improved) ? parsed.improved : [],
      stayedSame: Array.isArray(parsed.stayedSame) ? parsed.stayedSame : [],
      regressed: Array.isArray(parsed.regressed) ? parsed.regressed : [],
      remainingGaps: Array.isArray(parsed.remainingGaps) ? parsed.remainingGaps : [],
      verdictShift: String(
        parsed.verdictShift ||
          `${previousAnalysis.overall.verdict} → ${currentAnalysis.overall.verdict}`
      ),
    };
  } catch (err: any) {
    console.error('[Comparator] Error:', err.message);
    return {
      improved: [],
      stayedSame: [],
      regressed: [],
      remainingGaps: [],
      verdictShift: `${previousAnalysis.overall.verdict} → ${currentAnalysis.overall.verdict}`,
    };
  }
}
