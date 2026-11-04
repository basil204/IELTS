export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface WordExample {
  en: string;
  vi: string | null;
}

export interface WordAtlasEntry {
  id: string;
  w: string;
  uk: string;
  us: string;
  pos: string;
  en: string;
  vi: string | null;
  ex: WordExample[];
  col: string[];
  fam: string[];
  syn: string[];
  ant: string[];
  tip: string | null;
  cefr: CefrLevel;
  topic: string;
  imgUrl: string;
  audioUkUrl: string;
  audioUsUrl: string;
  audioExUrl: string;
}

export interface TopicStat {
  id: string;
  vi: string;
  en: string;
  code: string;
  cefrFocus: string;
  total: number;
  byCefr: Record<CefrLevel, number>;
  sampleWords: string[];
}

export interface Listening179Item {
  index: number;
  word: string;
  type: string;
  enDefinition: string;
  viMeaning: string | null;
  replace: string[];
}

export interface Reading538Word {
  no: number;
  word: string;
  pos: string;
  enDefinition: string;
  viMeaning: string | null;
  synonyms: string[];
}

export interface Reading538Tier {
  tier: number;
  titleVi: string;
  probability: string;
  badge: string;
  count: number;
  words: Reading538Word[];
}

export interface Writing100Item {
  no: number;
  category: string;
  standardBand65: string;
  advancedBand75: string;
}

export interface MyIeltsChapterWord {
  id: number;
  word: string;
  variants: string[];
  pos: string;
  enDefinition: string;
  viMeaning: string | null;
  example: string;
  audioUrl: string;
}

export interface MyIeltsChapter {
  key: string;
  code: string;
  titleVi: string;
  titleEn: string;
  groupCount: number;
  wordCount: number;
  totalWordsInChapter: number;
  words: MyIeltsChapterWord[];
}

export interface FsrsCardRecord {
  wordId: string;
  state: 'New' | 'Learning' | 'Review' | 'Relearning';
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  last_review?: string;
}
