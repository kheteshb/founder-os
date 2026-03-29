import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from '../backend/src/routes/analyze';
import historyRouter from '../backend/src/routes/history';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
