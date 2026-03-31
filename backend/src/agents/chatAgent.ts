import { GoogleGenAI } from '@google/genai';
import { Slide, SlideAnalysis, ChatMessage } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });
const MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a VC partner doing a focused review session on ONE slide of a pitch deck.
Stay scoped to this slide. Do not give generic startup advice.
Be direct. Help the founder make this slide investor-ready.
If asked to rewrite content, do it concisely and with impact.`;

export async function runSlideChat(
  slide: Slide,
  slideAnalysis: SlideAnalysis,
  chatHistory: ChatMessage[],
  userMessage: string,
  deckContext: string
): Promise<string> {
  const slideContext = `SLIDE: "${slide.title}" (Slide ${slide.index + 1})

SLIDE CONTENT:
${slide.content}

ANALYSIS OF THIS SLIDE:
What works: ${slideAnalysis.whatWorks.join('; ') || 'Nothing notable'}
What is weak: ${slideAnalysis.whatIsWeak.join('; ') || 'None identified'}
What is missing: ${slideAnalysis.whatIsMissing.join('; ') || 'None identified'}
What should be removed: ${slideAnalysis.whatShouldBeRemoved.join('; ') || 'None'}
Investor questions this slide must answer: ${slideAnalysis.brutalInvestorQuestions.join('; ')}

OVERALL DECK CONTEXT:
${deckContext}`;

  const historyText =
    chatHistory.length > 0
      ? chatHistory
          .map(m => `${m.role === 'user' ? 'Founder' : 'VC'}: ${m.content}`)
          .join('\n\n')
      : '';

  const fullPrompt = `${slideContext}

${historyText ? `CONVERSATION SO FAR:\n${historyText}\n\n` : ''}Founder: ${userMessage}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    return response.text ?? 'No response generated.';
  } catch (err: any) {
    console.error('[ChatAgent] Error:', err.message);
    throw new Error(`Chat failed: ${err.message}`);
  }
}
