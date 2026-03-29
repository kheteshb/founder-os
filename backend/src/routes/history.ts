import express, { Request, Response } from 'express';
import { getAnalyses, getAnalysesByGroup } from '../storage/store';

const router = express.Router();

// GET /api/history - all analyses
router.get('/', (_req: Request, res: Response) => {
  const analyses = getAnalyses();
  // Return summaries (without full extracted content for performance)
  const summaries = analyses.map(a => ({
    id: a.id,
    timestamp: a.timestamp,
    filename: a.filename,
    objective: a.objective,
    version: a.version,
    groupId: a.groupId,
    overall: a.result.overall,
    context: {
      stage: a.context.stage,
      targetInvestor: a.context.targetInvestor
    }
  }));
  return res.json(summaries);
});

// GET /api/history/group/:groupId - versions of same doc
router.get('/group/:groupId', (req: Request, res: Response) => {
  const analyses = getAnalysesByGroup(req.params.groupId);
  return res.json(analyses);
});

export default router;
