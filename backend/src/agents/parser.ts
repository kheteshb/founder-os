import { GoogleGenAI } from '@google/genai';
import { Slide } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

export async function parseSlides(rawText: string): Promise<Slide[]> {
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Split this pitch deck text into individual slides. For each slide return: index (0-based), title, content.

Return a JSON array only. No markdown, no explanation.

Format:
[
  { "index": 0, "title": "Slide title", "content": "Slide content here" },
  ...
]

If you cannot identify clear slide breaks, create logical sections based on the content topics (e.g., Problem, Solution, Market, Traction, Team, etc.).

PITCH DECK TEXT:
${rawText}`,
      config: {
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text ?? '';
    const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!Array.isArray(parsed)) {
      throw new Error('Parser did not return an array');
    }

    return parsed.map((s: any, i: number) => ({
      index: typeof s.index === 'number' ? s.index : i,
      title: String(s.title || `Slide ${i + 1}`),
      content: String(s.content || ''),
    }));
  } catch (err: any) {
    console.error('[Parser] Error:', err.message);
    // Fallback: return the whole text as a single slide
    return [
      {
        index: 0,
        title: 'Pitch Deck',
        content: rawText,
      },
    ];
  }
}
