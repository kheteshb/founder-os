import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import analyzeRouter from './routes/analyze';
import historyRouter from './routes/history';

const app = express();
const PORT = process.env.PORT || 3001;

if (!process.env.GOOGLE_API_KEY) {
  console.error('\n❌ GOOGLE_API_KEY is not set.');
  console.error('   Create a .env file in the backend directory with:');
  console.error('   GOOGLE_API_KEY=your_key_here\n');
  process.exit(1);
}

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/analyze', analyzeRouter);
app.use('/api/history', historyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`\n✓ Founder OS backend running on http://localhost:${PORT}`);
  console.log('  Ready to analyze pitches.\n');
});
