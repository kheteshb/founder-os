import express from 'express';
import cors from 'cors';
import decksRouter from '../backend/src/routes/decks';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/decks', decksRouter);
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
