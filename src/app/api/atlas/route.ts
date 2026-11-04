import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { WordAtlasEntry } from '@/types/atlas';

let cachedWords: WordAtlasEntry[] | null = null;

async function getAtlasWords(request: NextRequest): Promise<WordAtlasEntry[]> {
  if (!cachedWords) {
    try {
      const filePath = path.join(process.cwd(), 'public/data/word-atlas-full.json');
      if (fs.existsSync(filePath)) {
        cachedWords = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return cachedWords!;
      }
    } catch {
      // ignore
    }

    try {
      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/data/word-atlas-full.json`);
      if (res.ok) {
        cachedWords = (await res.json()) as WordAtlasEntry[];
      }
    } catch {
      // fallback
    }
  }
  return cachedWords || [];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic') || 'all';
  const cefr = searchParams.get('cefr') || 'all';
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(7500, Math.max(1, parseInt(searchParams.get('limit') || '60', 10)));

  const allWords = await getAtlasWords(request);

  const filtered = allWords.filter((item) => {
    if (topic !== 'all' && item.topic !== topic) return false;
    if (cefr !== 'all' && item.cefr !== cefr) return false;
    if (q) {
      const matchWord = item.w.toLowerCase().includes(q);
      const matchEn = item.en.toLowerCase().includes(q);
      const matchVi = item.vi ? item.vi.toLowerCase().includes(q) : false;
      if (!matchWord && !matchEn && !matchVi) return false;
    }
    return true;
  });

  // Sort curated Vietnamese entries first when browsing without specific query
  const sorted = q
    ? filtered
    : [...filtered].sort((a, b) => (b.vi ? 1 : 0) - (a.vi ? 1 : 0));

  const start = (page - 1) * limit;
  const items = sorted.slice(start, start + limit);

  return NextResponse.json({
    total: filtered.length,
    page,
    limit,
    totalPages: Math.ceil(filtered.length / limit),
    items
  });
}
