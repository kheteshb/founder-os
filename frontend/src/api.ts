import axios from 'axios';
import {
  ClarificationAnswer,
  DeckSummary,
  DeckWithVersions,
  DeckVersion,
  FullAnalysis,
} from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 180000,
});

export interface ParseResult {
  deckId: string;
  deckName: string;
  versionId: string;
  versionNumber: number;
  slides: { index: number; title: string; content: string }[];
  questions: { id: string; question: string; reason: string }[];
}

export interface AnalyzeResult {
  analysis: FullAnalysis;
}

export interface ChatResult {
  chatId: string;
  reply: string;
}

// Parse deck (step 1) - returns versionId, slides, questions
export async function parseDeck(formData: FormData): Promise<ParseResult> {
  const res = await api.post('/decks/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

// Run analysis (step 2)
export async function analyzeVersion(
  versionId: string,
  answers: ClarificationAnswer[]
): Promise<AnalyzeResult> {
  const res = await api.post('/decks/analyze', { versionId, answers });
  return res.data;
}

// Get all decks
export async function getDecks(): Promise<DeckSummary[]> {
  const res = await api.get('/decks');
  return res.data;
}

// Get deck with versions
export async function getDeck(deckId: string): Promise<DeckWithVersions> {
  const res = await api.get(`/decks/${deckId}`);
  return res.data;
}

// Get specific version
export async function getVersion(deckId: string, versionId: string): Promise<DeckVersion> {
  const res = await api.get(`/decks/${deckId}/versions/${versionId}`);
  return res.data;
}

// Send chat message
export async function sendChatMessage(
  deckId: string,
  versionId: string,
  slideIndex: number,
  message: string,
  chatId?: string
): Promise<ChatResult> {
  const res = await api.post(`/decks/${deckId}/versions/${versionId}/chat`, {
    slideIndex,
    message,
    chatId,
  });
  return res.data;
}
