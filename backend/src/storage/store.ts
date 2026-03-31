import fs from 'fs';
import path from 'path';
import { Deck, DeckVersion, SlideChat, FounderStore } from '../types';

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
    return { decks: [], versions: [], chats: [] };
  }
  try {
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    // Ensure all fields exist (migration safety)
    return {
      decks: parsed.decks || [],
      versions: parsed.versions || [],
      chats: parsed.chats || [],
    };
  } catch {
    return { decks: [], versions: [], chats: [] };
  }
}

function writeStore(store: FounderStore): void {
  ensureDataDir();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// ── Deck operations ──────────────────────────────────────────────────────────

export function saveDeck(deck: Deck): void {
  const store = readStore();
  const idx = store.decks.findIndex(d => d.id === deck.id);
  if (idx >= 0) {
    store.decks[idx] = deck;
  } else {
    store.decks.unshift(deck);
  }
  writeStore(store);
}

export function getDecks(): Deck[] {
  return readStore().decks;
}

export function getDeckById(id: string): Deck | undefined {
  return readStore().decks.find(d => d.id === id);
}

// ── Version operations ───────────────────────────────────────────────────────

export function saveVersion(version: DeckVersion): void {
  const store = readStore();
  const idx = store.versions.findIndex(v => v.id === version.id);
  if (idx >= 0) {
    store.versions[idx] = version;
  } else {
    store.versions.push(version);
  }
  writeStore(store);
}

export function getVersionById(id: string): DeckVersion | undefined {
  return readStore().versions.find(v => v.id === id);
}

export function getVersionsByDeckId(deckId: string): DeckVersion[] {
  return readStore().versions
    .filter(v => v.deckId === deckId)
    .sort((a, b) => a.versionNumber - b.versionNumber);
}

// ── Chat operations ──────────────────────────────────────────────────────────

export function saveChat(chat: SlideChat): void {
  const store = readStore();
  const idx = store.chats.findIndex(c => c.id === chat.id);
  if (idx >= 0) {
    store.chats[idx] = chat;
  } else {
    store.chats.push(chat);
  }
  writeStore(store);
}

export function getChatById(id: string): SlideChat | undefined {
  return readStore().chats.find(c => c.id === id);
}

export function getChatsByVersionAndSlide(versionId: string, slideIndex: number): SlideChat[] {
  return readStore().chats.filter(
    c => c.versionId === versionId && c.slideIndex === slideIndex
  );
}
