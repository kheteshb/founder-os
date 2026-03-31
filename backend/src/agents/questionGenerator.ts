import { GoogleGenAI } from '@google/genai';
import { Slide, ClarificationQuestion, DeckVersion } from '../types';
import { v4 as uuidv4 } from 'uuid';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

export async function generateClarificationQuestions(
  slides: Slide[],
  previousVersion?: DeckVersion
): Promise<ClarificationQuestion[]> {
  try {
    const slidesSummary = slides
      .map(s => `[Slide ${s.index + 1}: ${s.title}]\n${s.content}`)
      .join('\n\n');

    const previousContext = previousVersion
      ? `\nPREVIOUS VERSION CONTEXT (already answered questions — do not repeat them):\n${
          previousVersion.clarificationAnswers
            ?.map(a => `Q: ${a.question}\nA: ${a.answer}`)
            .join('\n\n') || 'None'
        }`
      : '';

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are a VC analyst reviewing a pitch deck. Generate 5-7 dynamic clarification questions based on gaps detected in this deck.

RULES:
- If no traction mentioned → ask about usage/revenue
- If weak market sizing → ask about calculation method
- If vague GTM → ask about first 100 customers
- If team slide weak → ask about domain expertise
- No generic questions — every question must reference something specific in the deck
- Max 7, min 3 questions
- Each question must have a "reason" explaining what specific gap in the deck it addresses
- Do NOT ask about things that are clearly and specifically answered in the deck${previousContext}

PITCH DECK:
${slidesSummary}

Return a JSON array only. No markdown, no explanation.

Format:
[
  {
    "question": "Specific question here",
    "reason": "Why this question — what gap in the deck does it address"
  },
  ...
]`,
      config: {
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text ?? '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) {
      throw new Error('Question generator did not return an array');
    }

    return parsed.slice(0, 7).map((q: any) => ({
      id: uuidv4(),
      question: String(q.question || ''),
      reason: String(q.reason || ''),
    }));
  } catch (err: any) {
    console.error('[QuestionGenerator] Error:', err.message);
    return [];
  }
}
