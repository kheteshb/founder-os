import fs from 'fs';
import path from 'path';
import { Analysis, FounderStore } from '../types';

// Vercel's filesystem is read-only — use /tmp on serverless, local data/ dir otherwise
const DATA_DIR = process.env.VERCEL
  ? '/tmp/founder-os-data'
  : path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readStore(): FounderStore {
  ensureDataDir();
  if (!fs.existsSync(STORE_FILE)) {
    return { analyses: [] };
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { analyses: [] };
  }
}

function writeStore(store: FounderStore): void {
  ensureDataDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function saveAnalysis(analysis: Analysis): void {
  const store = readStore();
  store.analyses.unshift(analysis);
  writeStore(store);
}

export function getAnalyses(): Analysis[] {
  return readStore().analyses;
}

export function getAnalysisById(id: string): Analysis | undefined {
  return readStore().analyses.find(a => a.id === id);
}

export function getAnalysesByGroup(groupId: string): Analysis[] {
  return readStore().analyses
    .filter(a => a.groupId === groupId)
    .sort((a, b) => a.version - b.version);
}
