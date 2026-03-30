import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { runAnalysis } from '../agents/orchestrator';
import { saveAnalysis, getAnalysisById } from '../storage/store';
import { ContextAnswers, Objective } from '../types';

const router = express.Router();

const UPLOADS_DIR = path.join('/tmp', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'text/plain'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.pdf') || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are accepted'));
    }
  }
});

async function extractTextFromFile(filePath: string, mimetype: string): Promise<string> {
  if (mimetype === 'text/plain' || filePath.endsWith('.txt')) {
    return fs.readFileSync(filePath, 'utf-8');
  }

  // PDF parsing
  try {
    // Dynamic import to handle CommonJS module
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

// POST /api/analyze
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  let filePath: string | undefined;

  try {
    const {
      objective,
      stage,
      raised,
      targetInvestor,
      whyInvestor,
      keyMetric,
      biggestConcern,
      pastedText,
      groupId
    } = req.body;

    // Validate required fields
    if (!objective || !stage || !targetInvestor) {
      return res.status(400).json({ error: 'Missing required context fields' });
    }

    // Extract content
    let extractedContent: string;
    let filename: string;

    if (req.file) {
      filePath = req.file.path;
      filename = req.file.originalname;
      extractedContent = await extractTextFromFile(filePath, req.file.mimetype);
    } else if (pastedText && pastedText.trim().length > 50) {
      extractedContent = pastedText.trim();
      filename = 'Pasted Text';
    } else {
      return res.status(400).json({ error: 'Please upload a file or paste your content' });
    }

    const context: ContextAnswers = {
      stage,
      raised: raised || '',
      targetInvestor,
      whyInvestor: whyInvestor || '',
      keyMetric: keyMetric || '',
      biggestConcern: biggestConcern || '',
      objective: objective as Objective
    };

    const progressSteps: string[] = [];
    const onProgress = (step: string) => {
      progressSteps.push(step);
      console.log(`[Analysis] ${step}`);
    };

    const result = await runAnalysis(extractedContent, context, onProgress);

    // Determine version number for this group
    let version = 1;
    if (groupId) {
      const { getAnalysesByGroup } = require('../storage/store');
      const groupAnalyses = getAnalysesByGroup(groupId);
      version = groupAnalyses.length + 1;
    }

    const analysis = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      filename,
      objective: objective as Objective,
      context,
      extractedContent,
      result,
      version,
      groupId: groupId || uuidv4()
    };

    saveAnalysis(analysis);

    // Cleanup upload
    if (filePath) fs.unlinkSync(filePath);

    return res.json({ success: true, analysis });
  } catch (err: any) {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('[Analysis Error]', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// GET /api/analyze/:id
router.get('/:id', (req: Request, res: Response) => {
  const analysis = getAnalysisById(req.params.id);
  if (!analysis) return res.status(404).json({ error: 'Analysis not found' });
  return res.json(analysis);
});

export default router;
