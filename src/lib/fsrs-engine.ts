import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card } from 'ts-fsrs';
import type { FsrsCardRecord } from '@/types/atlas';

const params = generatorParameters({
  enable_fuzz: false,
  enable_short_term: true,
  request_retention: 0.9,
  maximum_interval: 365
});

const scheduler = fsrs(params);

const stateNames: Record<State, FsrsCardRecord['state']> = {
  [State.New]: 'New',
  [State.Learning]: 'Learning',
  [State.Review]: 'Review',
  [State.Relearning]: 'Relearning'
};

const nameToState: Record<FsrsCardRecord['state'], State> = {
  New: State.New,
  Learning: State.Learning,
  Review: State.Review,
  Relearning: State.Relearning
};

export function toTsFsrsCard(record?: FsrsCardRecord): Card {
  if (!record) {
    return createEmptyCard(new Date());
  }
  return {
    due: new Date(record.due),
    stability: record.stability,
    difficulty: record.difficulty,
    elapsed_days: record.elapsed_days,
    scheduled_days: record.scheduled_days,
    reps: record.reps,
    lapses: record.lapses,
    state: nameToState[record.state] ?? State.New,
    last_review: record.last_review ? new Date(record.last_review) : undefined
  };
}

export function formatIntervalDiff(now: Date, due: Date): string {
  const diffMs = Math.max(0, due.getTime() - now.getTime());
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return '1m';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.max(1, Math.round(diffHours / 24));
  return `${diffDays}d`;
}

export function getIntervalPreviews(record?: FsrsCardRecord): {
  again: string;
  hard: string;
  good: string;
  easy: string;
} {
  const now = new Date();
  const card = toTsFsrsCard(record);
  const preview = scheduler.repeat(card, now);

  return {
    again: formatIntervalDiff(now, preview[Rating.Again].card.due),
    hard: formatIntervalDiff(now, preview[Rating.Hard].card.due),
    good: formatIntervalDiff(now, preview[Rating.Good].card.due),
    easy: formatIntervalDiff(now, preview[Rating.Easy].card.due)
  };
}

export function gradeFsrsCard(
  wordId: string,
  ratingKey: 'again' | 'hard' | 'good' | 'easy',
  existing?: FsrsCardRecord
): FsrsCardRecord {
  const now = new Date();
  const card = toTsFsrsCard(existing);
  const ratingMap = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy
  } as const;

  const result = scheduler.repeat(card, now)[ratingMap[ratingKey]].card;

  return {
    wordId,
    state: stateNames[result.state] || 'Review',
    due: result.due.toISOString(),
    stability: Number(result.stability.toFixed(2)),
    difficulty: Number(result.difficulty.toFixed(2)),
    elapsed_days: result.elapsed_days,
    scheduled_days: result.scheduled_days,
    reps: result.reps,
    lapses: result.lapses,
    last_review: now.toISOString()
  };
}

export function playPronunciation(audioUrl: string, fallbackText: string, lang: 'en-GB' | 'en-US' = 'en-GB') {
  if (typeof window === 'undefined') return;
  const audio = new Audio(audioUrl);
  audio.play().catch(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.lang = lang;
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  });
}
