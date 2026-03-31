import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { parseSlides } from '../agents/parser';
import { generateClarificationQuestions } from '../agents/questionGenerator';
import { evaluateDeck } from '../agents/evaluator';
import { compareVersions } from '../agents/comparator';
import { runSlideChat } from '../agents/chatAgent';
import {
  saveDeck,
  getDecks,
  getDeckById,
  saveVersion,
  getVersionById,
  getVersionsByDeckId,
  saveChat,
  getChatById,
} from '../storage/store';
import { ClarificationAnswer, Deck, DeckVersion, SlideChat, ChatMessage } from '../types';

const router = express.Router();

const UPLOADS_DIR = path.join('/tmp', 'founder-os-uploads');

// Lazy init — don't run at module load time (fails during Vercel build phase)
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith('.pdf') ||
      file.originalname.endsWith('.txt')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are accepted'));
    }
  },
});

async function extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === 'text/plain' || filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    if (!data.text || data.text.trim().length < 50) {
      throw new Error('PDF appears to be image-based or empty');
    }
    return data.text;
  } catch (err: any) {
    if (err.message.includes('image-based')) throw err;
    throw new Error('Failed to parse PDF. Try pasting the text directly instead.');
  }
}

// POST /api/decks/parse
// Body: FormData { file?: File, pastedText?: string, deckId?: string, deckName?: string }
router.post('/parse', upload.single('file'), async (req: Request, res: Response) => {
  ensureUploadsDir();
  let filePath: string | undefined;

  try {
    const { pastedText, deckId, deckName } = req.body;

    let rawText: string;
    let filename: string;

    if (req.file) {
      filePath = req.file.path;
      filename = req.file.originalname;
      rawText = await extractTextFromFile(filePath, req.file.mimetype);
    } else if (pastedText && pastedText.trim().length > 50) {
      rawText = pastedText.trim();
      filename = deckName || 'Pasted Text';
    } else {
      return res.status(400).json({ error: 'Please upload a file or paste your content' });
    }

    // Parse slides
    const slides = await parseSlides(rawText);

    // Determine deck and version
    let deck: Deck;
    let versionNumber: number;
    let previousVersion: DeckVersion | undefined;

    if (deckId) {
      // New version of existing deck
      const existingDeck = getDeckById(deckId);
      if (!existingDeck) {
        return res.status(404).json({ error: 'Deck not found' });
      }
      deck = existingDeck;
      const existingVersions = getVersionsByDeckId(deckId);
      versionNumber = existingVersions.length + 1;
      previousVersion = existingVersions[existingVersions.length - 1];
    } else {
      // New deck
      deck = {
        id: uuidv4(),
        name: deckName || filename,
        createdAt: new Date().toISOString(),
        versionIds: [],
      };
    }

    versionNumber = versionNumber! || 1;

    // Generate clarification questions
    const questions = await generateClarificationQuestions(slides, previousVersion);

    // Create the version (not yet analyzed)
    const version: DeckVersion = {
      id: uuidv4(),
      deckId: deck.id,
      versionNumber,
      uploadedAt: new Date().toISOString(),
      rawText,
      slides,
      clarificationQuestions: questions,
    };

    // Save version
    saveVersion(version);

    // Update deck with version id
    deck.versionIds = [...(deck.versionIds || []), version.id];
    saveDeck(deck);

    // Cleanup upload
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return res.json({
      deckId: deck.id,
      deckName: deck.name,
      versionId: version.id,
      versionNumber,
      slides,
      questions,
    });
  } catch (err: any) {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch {}
    }
    console.error('[Parse Error]', err);
    return res.status(500).json({ error: err.message || 'Parse failed' });
  }
});

// POST /api/decks/analyze
// Body: { versionId, answers: ClarificationAnswer[] }
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { versionId, answers } = req.body as {
      versionId: string;
      answers: ClarificationAnswer[];
    };

    if (!versionId) {
      return res.status(400).json({ error: 'versionId is required' });
    }

    const version = getVersionById(versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const safeAnswers: ClarificationAnswer[] = Array.isArray(answers) ? answers : [];

    // Store answers on version
    version.clarificationAnswers = safeAnswers;

    // Run evaluator
    const analysis = await evaluateDeck(version.slides, safeAnswers);

    // Check for previous version to compare
    const allVersions = getVersionsByDeckId(version.deckId);
    const previousVersions = allVersions.filter(v => v.versionNumber < version.versionNumber);

    if (previousVersions.length > 0) {
      const prevVersion = previousVersions[previousVersions.length - 1];
      if (prevVersion.analysis) {
        const progress = await compareVersions(prevVersion.analysis, analysis, prevVersion);
        analysis.progressVsPrevious = progress;
      }
    }

    // Save analysis on version
    version.analysis = analysis;
    saveVersion(version);

    return res.json({ analysis });
  } catch (err: any) {
    console.error('[Analyze Error]', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// GET /api/decks
router.get('/', (_req: Request, res: Response) => {
  const decks = getDecks();
  const result = decks.map(deck => {
    const versions = getVersionsByDeckId(deck.id);
    const latestVersion = versions[versions.length - 1];
    return {
      ...deck,
      versionCount: versions.length,
      latestVersionId: latestVersion?.id,
      latestVerdict: latestVersion?.analysis?.overall?.verdict,
      latestAnalysisDate: latestVersion?.analysis?.createdAt,
    };
  });
  return res.json(result);
});

// GET /api/decks/:deckId
router.get('/:deckId', (req: Request, res: Response) => {
  const deck = getDeckById(req.params.deckId);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const versions = getVersionsByDeckId(deck.id);
  return res.json({ ...deck, versions });
});

// GET /api/decks/:deckId/versions/:versionId
router.get('/:deckId/versions/:versionId', (req: Request, res: Response) => {
  const version = getVersionById(req.params.versionId);
  if (!version || version.deckId !== req.params.deckId) {
    return res.status(404).json({ error: 'Version not found' });
  }
  return res.json(version);
});

// POST /api/decks/:deckId/versions/:versionId/chat
// Body: { slideIndex: number, message: string, chatId?: string }
router.post('/:deckId/versions/:versionId/chat', async (req: Request, res: Response) => {
  try {
    const { deckId, versionId } = req.params;
    const { slideIndex, message, chatId } = req.body as {
      slideIndex: number;
      message: string;
      chatId?: string;
    };

    if (typeof slideIndex !== 'number' || !message) {
      return res.status(400).json({ error: 'slideIndex and message are required' });
    }

    const version = getVersionById(versionId);
    if (!version || version.deckId !== deckId) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (!version.analysis) {
      return res.status(400).json({ error: 'This version has not been analyzed yet' });
    }

    const slide = version.slides.find(s => s.index === slideIndex);
    if (!slide) {
      return res.status(404).json({ error: 'Slide not found' });
    }

    const slideAnalysis = version.analysis.slideAnalyses.find(
      sa => sa.slideIndex === slideIndex
    );
    if (!slideAnalysis) {
      return res.status(404).json({ error: 'Slide analysis not found' });
    }

    // Load or create chat
    let chat: SlideChat;
    if (chatId) {
      const existing = getChatById(chatId);
      if (existing) {
        chat = existing;
      } else {
        chat = {
          id: chatId,
          versionId,
          slideIndex,
          messages: [],
        };
      }
    } else {
      chat = {
        id: uuidv4(),
        versionId,
        slideIndex,
        messages: [],
      };
    }

    // Build deck context from overall analysis
    const deckContext = `Deck: ${getDeckById(deckId)?.name || 'Unknown'}
Verdict: ${version.analysis.overall.verdict}
Verdict Reason: ${version.analysis.overall.verdictReason}
Top Strengths: ${version.analysis.overall.topStrengths.join(', ')}
Top Weaknesses: ${version.analysis.overall.topWeaknesses.join(', ')}`;

    // Run chat agent
    const reply = await runSlideChat(
      slide,
      slideAnalysis,
      chat.messages,
      message,
      deckContext
    );

    const now = new Date().toISOString();

    // Append messages
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: now };
    const assistantMsg: ChatMessage = { role: 'assistant', content: reply, timestamp: now };
    chat.messages.push(userMsg, assistantMsg);

    saveChat(chat);

    return res.json({ chatId: chat.id, reply });
  } catch (err: any) {
    console.error('[Chat Error]', err);
    return res.status(500).json({ error: err.message || 'Chat failed' });
  }
});

export default router;
