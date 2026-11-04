'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookmarkCheck,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Globe,
  LogIn,
  Map,
  Search,
  Settings,
  Shield,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
  Volume2
} from 'lucide-react';
import type {
  CefrLevel,
  FsrsCardRecord,
  Listening179Item,
  MyIeltsChapter,
  Reading538Tier,
  TopicStat,
  WordAtlasEntry,
  Writing100Item
} from '@/types/atlas';
import {
  getIntervalPreviews,
  gradeFsrsCard,
  playPronunciation
} from '@/lib/fsrs-engine';
import WordAtlasConstellation from './WordAtlasConstellation';
import MyIeltsBigDataHub from './MyIeltsBigDataHub';
import SplitScreenExamPreview from './SplitScreenExamPreview';

interface Props {
  initialPriorityWords: WordAtlasEntry[];
  topics: TopicStat[];
  chapters: MyIeltsChapter[];
  readingTiers: Reading538Tier[];
  listening179: Listening179Item[];
  writing100: Writing100Item[];
}

interface NotebookItem {
  word: string;
  meaning: string;
  ipa: string;
  cefr: string;
  savedAt: string;
}

const CEFR_BADGE_STYLE: Record<CefrLevel, string> = {
  A1: 'bg-[#E0F2FE] text-[#0284C7]',
  A2: 'bg-[#CCFBF1] text-[#0F766E]',
  B1: 'bg-[#DCFCE7] text-[#15803D]',
  B2: 'bg-[#E0F2FE] text-[#0369A1]',
  C1: 'bg-[#0284C7] text-[#FFFFFF]',
  C2: 'bg-[#0F172A] text-[#FFFFFF]'
};

const STORAGE_KEY_FSRS = 'tid_word_atlas_fsrs_v1';
const STORAGE_KEY_XP = 'tid_word_atlas_xp_v1';
const STORAGE_KEY_NOTEBOOK = 'tid_vocab_notebook_v1';

const DEFAULT_NOTEBOOK: NotebookItem[] = [
  {
    word: 'ubiquitous',
    meaning: 'hiện diện khắp mọi nơi, phổ biến toàn diện',
    ipa: '/juːˈbɪkwɪtəs/',
    cefr: 'C1',
    savedAt: 'Hôm nay'
  },
  {
    word: 'mitigate',
    meaning: 'giảm thiểu, làm dịu bớt tác động tiêu cực',
    ipa: '/ˈmɪtɪɡeɪt/',
    cefr: 'C1',
    savedAt: 'Hôm nay'
  },
  {
    word: 'paradigm',
    meaning: 'mô hình tư duy, hệ quy chiếu chuẩn mực',
    ipa: '/ˈpærədaɪm/',
    cefr: 'C2',
    savedAt: 'Hôm nay'
  }
];

function UkFlagSvg() {
  return (
    <svg className="w-4 h-4 rounded-full shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="12" fill="#1E3A8A" />
      <path d="M0 0L24 24M24 0L0 24" stroke="#FFFFFF" strokeWidth="4" />
      <path d="M0 0L24 24M24 0L0 24" stroke="#DC2626" strokeWidth="2" />
      <path d="M12 0V24M0 12H24" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M12 0V24M0 12H24" stroke="#DC2626" strokeWidth="3.5" />
    </svg>
  );
}

function UsFlagSvg() {
  return (
    <svg className="w-4 h-4 rounded-full shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="24" height="24" rx="12" fill="#B91C1C" />
      <path d="M0 4H24M0 8H24M0 12H24M0 16H24M0 20H24" stroke="#FFFFFF" strokeWidth="2" />
      <rect width="12" height="12" fill="#1E3A8A" />
      <circle cx="4" cy="4" r="1" fill="#FFFFFF" />
      <circle cx="8" cy="4" r="1" fill="#FFFFFF" />
      <circle cx="6" cy="7" r="1" fill="#FFFFFF" />
      <circle cx="4" cy="9.5" r="1" fill="#FFFFFF" />
      <circle cx="8" cy="9.5" r="1" fill="#FFFFFF" />
    </svg>
  );
}

function WaveformSvg({ active }: { active?: boolean }) {
  return (
    <svg
      className={`w-12 h-4 ${active ? 'text-[#0284C7]' : 'text-[#0284C7]/70'}`}
      viewBox="0 0 48 16"
      fill="none"
      aria-hidden="true"
    >
      <rect x="2" y="6" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="6" y="3" width="2" height="10" rx="1" fill="currentColor" />
      <rect x="10" y="1" width="2" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="2" height="8" rx="1" fill="currentColor" />
      <rect x="18" y="2" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="22" y="5" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="26" y="3" width="2" height="10" rx="1" fill="currentColor" />
      <rect x="30" y="6" width="2" height="4" rx="1" fill="currentColor" />
      <rect x="34" y="2" width="2" height="12" rx="1" fill="currentColor" />
      <rect x="38" y="5" width="2" height="6" rx="1" fill="currentColor" />
      <rect x="42" y="7" width="2" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

export default function IeltsConcourseClient({
  initialPriorityWords,
  topics,
  chapters,
  readingTiers,
  listening179,
  writing100
}: Props) {
  const [queueWords, setQueueWords] = useState<WordAtlasEntry[]>(initialPriorityWords);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fsrsRecords, setFsrsRecords] = useState<Record<string, FsrsCardRecord>>({});
  const [userXp, setUserXp] = useState<number>(1420);
  const [streakDays] = useState<number>(14);
  const [targetBand, setTargetBand] = useState<string>('7.5');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeUser, setActiveUser] = useState<{
    name: string;
    email: string;
    role: string;
    plan: string;
  } | null>(null);

  // Personal Vocabulary Notebook (YouPass 4.0 Feature)
  const [notebookWords, setNotebookWords] = useState<NotebookItem[]>(DEFAULT_NOTEBOOK);

  // Interactive Modes inside Station 02
  const [practiceMode, setPracticeMode] = useState<
    'see' | 'quiz' | 'cloze' | 'dictation'
  >('see');
  const [clozeInput, setClozeInput] = useState<string>('');
  const [clozeSolved, setClozeSolved] = useState<boolean>(false);
  const [quizSelectedId, setQuizSelectedId] = useState<string | null>(null);
  const [playingVoice, setPlayingVoice] = useState<'uk' | 'us' | 'ex' | null>(null);
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});
  const [stationCefrFilter, setStationCefrFilter] = useState<string>('ALL');

  // Section 2: 19 IELTS Topics Explorer & Full 7,298-word Browser
  const [activeTopic, setActiveTopic] = useState<string>('technology');
  const [activeCefr, setActiveCefr] = useState<string>('all');
  const [atlasQuery, setAtlasQuery] = useState<string>('');
  const [explorerWords, setExplorerWords] = useState<WordAtlasEntry[]>(
    initialPriorityWords.slice(0, 12)
  );
  const [explorerTotal, setExplorerTotal] = useState<number>(7298);
  const [explorerPage, setExplorerPage] = useState<number>(1);
  const [loadingExplorer, setLoadingExplorer] = useState<boolean>(false);

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedFsrs = localStorage.getItem(STORAGE_KEY_FSRS);
      if (savedFsrs) setFsrsRecords(JSON.parse(savedFsrs));

      const savedXp = localStorage.getItem(STORAGE_KEY_XP);
      if (savedXp) setUserXp(Number(savedXp) || 1420);

      const savedUser = localStorage.getItem('tid_active_user_v1');
      if (savedUser) setActiveUser(JSON.parse(savedUser));

      const savedLang = localStorage.getItem('tid_lang_v1');
      if (savedLang === 'en' || savedLang === 'vi') setLang(savedLang);

      const savedNotebook = localStorage.getItem(STORAGE_KEY_NOTEBOOK);
      if (savedNotebook) setNotebookWords(JSON.parse(savedNotebook));
    } catch {
      // ignore storage errors
    }
  }, []);

  const currentWord = queueWords[currentIndex] || queueWords[0];
  const currentRecord = currentWord ? fsrsRecords[currentWord.id] : undefined;
  const intervals = useMemo(() => getIntervalPreviews(currentRecord), [currentRecord]);

  const reviewedCount = Object.keys(fsrsRecords).length;
  const dueQueueCount = Math.max(1, 28 - (reviewedCount % 28));

  const isCurrentInNotebook = useMemo(
    () =>
      currentWord
        ? notebookWords.some(
            (n) => n.word.toLowerCase() === currentWord.w.toLowerCase()
          )
        : false,
    [currentWord, notebookWords]
  );

  const handleSaveToNotebook = useCallback(
    (word: string, meaning: string, ipa: string, cefr: string) => {
      setNotebookWords((prev) => {
        if (prev.some((x) => x.word.toLowerCase() === word.toLowerCase())) {
          return prev;
        }
        const next: NotebookItem[] = [
          { word, meaning, ipa, cefr, savedAt: 'Vừa lưu' },
          ...prev
        ];
        try {
          localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const handleRemoveFromNotebook = (word: string) => {
    setNotebookWords((prev) => {
      const next = prev.filter(
        (x) => x.word.toLowerCase() !== word.toLowerCase()
      );
      try {
        localStorage.setItem(STORAGE_KEY_NOTEBOOK, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Fetch filtered words from /api/atlas across all 7,298 entries
  const fetchAtlasWords = useCallback(
    async (topic: string, cefr: string, q: string, page: number) => {
      setLoadingExplorer(true);
      try {
        const params = new URLSearchParams({
          topic,
          cefr,
          q,
          page: String(page),
          limit: '12'
        });
        const res = await fetch(`/api/atlas?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setExplorerWords(data.items || []);
          setExplorerTotal(data.total ?? 7298);
        }
      } catch {
        // fallback
      } finally {
        setLoadingExplorer(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchAtlasWords(activeTopic, activeCefr, atlasQuery, explorerPage);
  }, [activeTopic, activeCefr, atlasQuery, explorerPage, fetchAtlasWords]);

  const handleGradeCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentWord) return;
    const updated = gradeFsrsCard(currentWord.id, rating, currentRecord);
    const nextMap = { ...fsrsRecords, [currentWord.id]: updated };
    setFsrsRecords(nextMap);

    const xpGain =
      rating === 'easy' ? 25 : rating === 'good' ? 20 : rating === 'hard' ? 10 : 5;
    const nextXp = userXp + xpGain;
    setUserXp(nextXp);

    try {
      localStorage.setItem(STORAGE_KEY_FSRS, JSON.stringify(nextMap));
      localStorage.setItem(STORAGE_KEY_XP, String(nextXp));
    } catch {
      // ignore
    }

    setClozeInput('');
    setClozeSolved(false);
    setQuizSelectedId(null);
    setCurrentIndex((prev) => (prev + 1) % queueWords.length);
  };

  const quizOptions = useMemo(() => {
    if (!currentWord) return [];
    const distractors = queueWords
      .filter((w) => w.id !== currentWord.id && (w.vi || w.en))
      .slice(0, 12);
    const picked: WordAtlasEntry[] = [];
    for (let i = 0; i < distractors.length && picked.length < 3; i++) {
      const idx = (currentIndex * 3 + i * 5) % distractors.length;
      const cand = distractors[idx];
      if (cand && !picked.some((p) => p.id === cand.id)) {
        picked.push(cand);
      }
    }
    return [currentWord, ...picked].sort((a, b) => a.id.localeCompare(b.id));
  }, [currentWord, queueWords, currentIndex]);

  const handleLoadExplorerIntoStation = () => {
    if (explorerWords.length > 0) {
      setQueueWords(explorerWords);
      setCurrentIndex(0);
      setClozeInput('');
      setClozeSolved(false);
      setQuizSelectedId(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterStationByCefr = (lvl: string) => {
    setStationCefrFilter(lvl);
    if (lvl === 'ALL') {
      setQueueWords(initialPriorityWords);
      setCurrentIndex(0);
      return;
    }
    const filtered = initialPriorityWords.filter((w) => w.cefr === lvl);
    if (filtered.length > 0) {
      setQueueWords(filtered);
      setCurrentIndex(0);
      setClozeInput('');
      setClozeSolved(false);
      setQuizSelectedId(null);
    }
  };

  const handleAudioTrigger = (type: 'uk' | 'us' | 'ex') => {
    if (!currentWord) return;
    setPlayingVoice(type);
    if (type === 'uk') {
      playPronunciation(currentWord.audioUkUrl, currentWord.w, 'en-GB');
    } else if (type === 'us') {
      playPronunciation(currentWord.audioUsUrl, currentWord.w, 'en-US');
    } else {
      const sentence = currentWord.ex[0]?.en || currentWord.w;
      playPronunciation(currentWord.audioExUrl, sentence, 'en-GB');
    }
    setTimeout(() => setPlayingVoice(null), 1200);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '1') {
        e.preventDefault();
        handleGradeCard('again');
      } else if (e.key === '2') {
        e.preventDefault();
        handleGradeCard('hard');
      } else if (e.key === '3') {
        e.preventDefault();
        handleGradeCard('good');
      } else if (e.key === '4') {
        e.preventDefault();
        handleGradeCard('easy');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handleSelectWordForStation = useCallback(
    async (wordOrEntry: WordAtlasEntry | string) => {
      if (typeof wordOrEntry !== 'string') {
        const idx = queueWords.findIndex((w) => w.id === wordOrEntry.id);
        if (idx >= 0) {
          setCurrentIndex(idx);
        } else {
          setQueueWords((prev) => [wordOrEntry, ...prev]);
          setCurrentIndex(0);
        }
        setClozeInput('');
        setClozeSolved(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const existingIdx = queueWords.findIndex(
        (w) => w.w.toLowerCase() === wordOrEntry.toLowerCase()
      );
      if (existingIdx >= 0) {
        setCurrentIndex(existingIdx);
        setClozeInput('');
        setClozeSolved(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      try {
        const res = await fetch(
          `/api/atlas?q=${encodeURIComponent(wordOrEntry)}&limit=5`
        );
        if (res.ok) {
          const data = await res.json();
          const match =
            (data.items || []).find(
              (x: WordAtlasEntry) =>
                x.w.toLowerCase() === wordOrEntry.toLowerCase()
            ) || data.items?.[0];
          if (match) {
            setQueueWords((prev) => [match, ...prev]);
            setCurrentIndex(0);
            setClozeInput('');
            setClozeSolved(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      } catch {
        // ignore
      }
    },
    [queueWords]
  );

  const clozeSentenceParts = useMemo(() => {
    if (!currentWord) return { before: '', after: '', full: '' };
    const rawSentence =
      currentWord.ex[0]?.en ||
      `Smartphones have become ${currentWord.w} in modern daily life.`;
    const regex = new RegExp(`\\b${currentWord.w}[a-z]*\\b`, 'i');
    const match = rawSentence.match(regex);
    if (!match || match.index === undefined) {
      return {
        before: rawSentence + ' (',
        after: ')',
        full: rawSentence
      };
    }
    return {
      before: rawSentence.slice(0, match.index),
      after: rawSentence.slice(match.index + match[0].length),
      full: rawSentence
    };
  }, [currentWord]);

  const handleClozeChange = (val: string) => {
    setClozeInput(val);
    if (
      currentWord &&
      val.trim().toLowerCase() === currentWord.w.toLowerCase() &&
      !clozeSolved
    ) {
      setClozeSolved(true);
      setUserXp((xp) => xp + 15);
    }
  };

  const handleExportProgress = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      xp: userXp,
      streakDays,
      notebookWords,
      fsrsRecords
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'youpass-word-atlas-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const streakDigits = String(streakDays).padStart(2, '0').split('');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7">
      {/* TOP COMMERCIAL 4.0 HEADER (PURE WHITE & SKY CERULEAN) */}
      <header className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 sm:py-4 border border-[#DCEBFA] shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#0F172A] leading-none">
              YOUPASS <span className="text-[#0284C7]">× WORD ATLAS 4.0</span>
            </h1>

            <button
              type="button"
              onClick={() => {
                const nextLang = lang === 'vi' ? 'en' : 'vi';
                setLang(nextLang);
                try {
                  localStorage.setItem('tid_lang_v1', nextLang);
                } catch {
                  // ignore
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold border border-[#BAE6FD] cursor-pointer"
              title="Chuyển đổi ngôn ngữ Tiếng Việt / English"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'VI • EN' : 'EN • VI'}</span>
            </button>

            <span className="font-mono-data text-xs px-2.5 py-1 rounded-lg bg-[#F0F7FF] text-[#0284C7] border border-[#DCEBFA] font-bold">
              {lang === 'vi'
                ? `Sổ Từ Vựng: ${notebookWords.length} từ`
                : `Notebook: ${notebookWords.length} words`}
            </span>
          </div>

          <nav
            aria-label="Điều hướng phân khu chính"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm"
          >
            <Link
              href="/roadmap"
              className="font-semibold text-[#0284C7] border-b-2 border-[#0284C7] pb-1 inline-flex items-center gap-1"
            >
              <strong className="font-mono-data">01</strong>
              <span>{lang === 'vi' ? 'Lộ Trình 12 Tuần' : '12-Week Roadmap'}</span>
            </Link>
            <a
              href="#station-02"
              className="font-medium text-[#334155] hover:text-[#0284C7] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#0284C7]">02</strong>
              {lang === 'vi' ? 'Trạm FSRS Hôm Nay' : 'Today FSRS'}
            </a>
            <a
              href="#topics-explorer"
              className="font-medium text-[#334155] hover:text-[#0284C7] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#0284C7]">03</strong>
              {lang === 'vi' ? 'Word Atlas (7,298 Từ)' : 'Word Atlas (7,298)'}
            </a>
            <Link
              href="/pricing"
              className="font-medium text-[#059669] hover:text-[#0284C7] pb-1 transition-colors inline-flex items-center gap-1"
            >
              <strong className="font-mono-data text-[#0284C7]">04</strong>
              <span>{lang === 'vi' ? 'Nâng Cấp PRO (VietQR)' : 'PRO Upgrade'}</span>
            </Link>
            <a
              href="#my-ielts-hub"
              className="font-medium text-[#334155] hover:text-[#0284C7] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#0284C7]">05</strong>
              {lang === 'vi' ? 'Kho My-IELTS (3,674 Từ)' : 'My-IELTS Corpus'}
            </a>
            <a
              href="#exam-room"
              className="font-medium text-[#334155] hover:text-[#0284C7] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#0284C7]">06</strong>
              {lang === 'vi' ? 'Phòng Thi 4 Kỹ Năng' : '4-Skill Exam Room'}
            </a>
            <Link
              href="/admin"
              className="font-mono-data text-xs font-bold px-2.5 py-1 rounded-lg bg-[#F0F7FF] text-[#0284C7] border border-[#BAE6FD] hover:bg-[#0284C7] hover:text-[#FFFFFF] transition-colors inline-flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ADMIN CMS</span>
            </Link>
          </nav>
        </div>

        {/* Streak Counter, User Auth & Primary CTA */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div
            className="bg-[#F0F7FF] text-[#0F172A] px-3 py-2 rounded-xl flex items-center gap-2.5 border border-[#BAE6FD]"
            title="Chuỗi ngày học liên tiếp (Daily Streak)"
          >
            <div className="flex items-center gap-1">
              {streakDigits.map((d, idx) => (
                <span key={idx} className="split-flap-digit w-7 h-9 text-xl">
                  {d}
                </span>
              ))}
            </div>
            <div className="font-display text-xs font-extrabold leading-tight text-[#0284C7] tracking-wide">
              <div>DAYS</div>
              <div>STREAK</div>
            </div>
          </div>

          {activeUser ? (
            <Link
              href={activeUser.role === 'admin' ? '/admin' : '/roadmap'}
              className="bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0F172A] border border-[#BAE6FD] font-display font-bold text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#059669]" />
              <span>{activeUser.name}</span>
              <span className="font-mono-data text-xs px-1.5 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF] font-bold">
                {activeUser.plan}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] font-display font-bold text-xs sm:text-sm px-4 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#0284C7]" />
              <span>{lang === 'vi' ? 'Đăng Nhập / Google' : 'Sign In / Google'}</span>
            </Link>
          )}

          <a
            href="#station-02"
            onClick={() => handleAudioTrigger('uk')}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-bold text-sm sm:text-base px-5 py-3 rounded-xl transition-colors shadow-sm"
          >
            {lang === 'vi' ? 'Bắt Đầu Học Ngay' : 'Start Learning'}
          </a>
        </div>
      </header>

      {/* FIRST VIEWPORT: 12-COLUMN YOUPASS 4.0 × WORD ATLAS STUDIO GRID */}
      <main
        id="bento-concourse"
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* COLUMN 1 (3 cols): 01 / LỘ TRÌNH & SỔ TỪ VỰNG CÁ NHÂN */}
        <section
          aria-label="01 Lộ trình và Sổ từ vựng cá nhân"
          className="lg:col-span-3 bg-[#FFFFFF] rounded-2xl p-5 flex flex-col justify-between border border-[#DCEBFA] shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#DCEBFA]">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-[#0F172A]">
                {lang === 'vi'
                  ? '01 / LỘ TRÌNH & SỔ TỪ VỰNG'
                  : '01 / STUDY PLAN & NOTEBOOK'}
              </h2>
              <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                4.0 AI
              </span>
            </div>

            {/* Departure Band -> Destination Band */}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="bg-[#F0F7FF] border border-[#BAE6FD] text-[#0F172A] rounded-xl px-3.5 py-2.5 text-center min-w-[74px]">
                <div className="text-xs font-bold text-[#64748B]">Start</div>
                <div className="font-display text-2xl font-black leading-none mt-0.5 tabular-nums text-[#0F172A]">
                  5.0
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center text-[#0284C7]">
                <div className="w-full border-t-2 border-dashed border-[#38BDF8]" />
                <ArrowRight className="w-5 h-5 -ml-1 shrink-0 text-[#0284C7]" />
              </div>

              <button
                type="button"
                onClick={() =>
                  setTargetBand((prev) =>
                    prev === '7.5' ? '8.0' : prev === '8.0' ? '6.5' : '7.5'
                  )
                }
                title="Nhấp để đổi mục tiêu Band điểm"
                className="bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] rounded-xl px-3.5 py-2.5 text-center min-w-[74px] transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold text-[#E0F2FE]">Target</div>
                <div className="font-display text-2xl font-black leading-none mt-0.5 tabular-nums">
                  {targetBand}
                </div>
              </button>
            </div>

            {/* Milestone Progress Section */}
            <div className="mt-5 pt-4 border-t border-[#DCEBFA]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A] mb-2">
                <span>Tiến độ Lộ trình Logical Framework</span>
                <span className="font-mono-data text-[#0284C7] font-bold">68%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-[#EBF5FF] overflow-hidden">
                <div className="h-full w-[68%] rounded-full bg-[#0284C7]" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-mono-data text-[#64748B]">
                <span>Độ nhớ FSRS: 94.2%</span>
                <span className="text-[#059669] font-bold">
                  +{35 + reviewedCount} từ hôm nay
                </span>
              </div>
            </div>

            {/* Personal Vocabulary Notebook (YouPass 4.0 Signature) */}
            <div className="mt-5 pt-4 border-t border-[#DCEBFA]">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-display font-extrabold text-[#0F172A]">
                  {lang === 'vi'
                    ? `SỔ TỪ VỰNG CÁ NHÂN (${notebookWords.length})`
                    : `PERSONAL VOCAB NOTEBOOK (${notebookWords.length})`}
                </div>
                <span className="font-mono-data text-xs text-[#0284C7]">
                  Lưu tự động
                </span>
              </div>

              <div className="max-h-[168px] overflow-y-auto divide-y divide-[#EBF5FF] border border-[#DCEBFA] rounded-xl bg-[#F8FBFF]">
                {notebookWords.map((item) => (
                  <div
                    key={item.word}
                    className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-[#EBF5FF] transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectWordForStation(item.word)}
                      className="text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-extrabold text-[#0284C7] truncate">
                          {item.word}
                        </span>
                        <span className="font-mono-data text-xs px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                          {item.cefr}
                        </span>
                      </div>
                      <div className="text-[#334155] truncate">{item.meaning}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromNotebook(item.word)}
                      className="p-1 text-[#64748B] hover:text-[#E11D48] cursor-pointer"
                      aria-label={`Xóa ${item.word} khỏi sổ từ vựng`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Open 12-Week Roadmap Button */}
          <div className="mt-5 pt-4 border-t border-[#DCEBFA]">
            <Link
              href="/roadmap"
              className="w-full py-2.5 px-3.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display font-bold text-xs flex items-center justify-between transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5" />
                <span>
                  {lang === 'vi'
                    ? 'Mở Lộ Trình 12 Tuần & Placement Test'
                    : 'Open 12-Week Study Plan & Test'}
                </span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* COLUMN 2 (6 cols): 02 / TRẠM HỌC TỪ VỰNG ĐA GIÁC QUAN FSRS 4.0 */}
        <section
          id="station-02"
          aria-label="02 Trạm học từ vựng FSRS 4.0"
          className="lg:col-span-6 bg-[#E0F2FE] rounded-2xl p-4 sm:p-5 flex flex-col justify-between border-2 border-[#0284C7] shadow-sm"
        >
          {/* Sky-Cerulean Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-black tracking-tight text-[#0F172A]">
                {lang === 'vi'
                  ? `02 / HÔM NAY HỌC GÌ (FSRS QUEUE: ${dueQueueCount} TỪ)`
                  : `02 / TODAY FSRS QUEUE (${dueQueueCount} DUE)`}
              </h2>
              <div className="flex items-center gap-1 bg-[#FFFFFF] p-0.5 rounded-lg border border-[#BAE6FD]">
                {(['ALL', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleFilterStationByCefr(lvl)}
                    className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold cursor-pointer transition-colors ${
                      stationCefrFilter === lvl
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'text-[#334155] hover:bg-[#E0F2FE]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPracticeMode('see')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'see'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F0F7FF]'
                }`}
              >
                See & Hear
              </button>
              <button
                type="button"
                onClick={() => {
                  setPracticeMode('quiz');
                  setQuizSelectedId(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'quiz'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F0F7FF]'
                }`}
              >
                {lang === 'vi' ? 'Quiz 4 Đáp Án' : '4-Option Quiz'}
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('cloze')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'cloze'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F0F7FF]'
                }`}
              >
                Recall Cloze
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('dictation')}
                className={`px-2.5 py-1 rounded-lg text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'dictation'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F0F7FF]'
                }`}
              >
                Dictation
              </button>
            </div>
          </div>

          {/* Inner Pure Porcelain White Lexical Stage */}
          {currentWord && (
            <div className="bg-[#FFFFFF] text-[#0F172A] rounded-xl p-5 flex-1 flex flex-col justify-between border border-[#BAE6FD]">
              {/* Top Half: Word + Phonetics + Audio + Visual Scene */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#0F172A] leading-none">
                      {practiceMode === 'dictation' && !clozeSolved
                        ? `${currentWord.w[0]}${'•'.repeat(
                            Math.max(3, currentWord.w.length - 1)
                          )}`
                        : currentWord.w}
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        handleSaveToNotebook(
                          currentWord.w,
                          currentWord.vi || currentWord.en,
                          currentWord.uk || currentWord.us,
                          currentWord.cefr
                        )
                      }
                      className={`px-2.5 py-1 rounded-lg font-display text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer border ${
                        isCurrentInNotebook
                          ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                          : 'bg-[#F0F7FF] text-[#0284C7] border-[#BAE6FD] hover:bg-[#0284C7] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {isCurrentInNotebook ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5" />
                          <span>Đã lưu Sổ Từ</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>+ Lưu Sổ Từ</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="font-mono-data text-base text-[#334155]">
                    {currentWord.uk || currentWord.us || `/ˈ${currentWord.w}/`}{' '}
                    <span className="text-[#0284C7] font-bold ml-1">
                      {currentWord.pos}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-mono-data text-xs font-bold ${
                        CEFR_BADGE_STYLE[currentWord.cefr] ||
                        'bg-[#0284C7] text-[#FFFFFF]'
                      }`}
                    >
                      {currentWord.cefr} •{' '}
                      {currentWord.topic.charAt(0).toUpperCase() +
                        currentWord.topic.slice(1)}
                    </span>
                    {currentRecord && (
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] font-mono-data text-xs font-bold">
                        Stability: {currentRecord.stability}d
                      </span>
                    )}
                  </div>

                  {practiceMode === 'quiz' ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="font-mono-data text-xs text-[#0284C7] font-bold">
                        CHỌN NGHĨA ĐÚNG CỦA TỪ (+20 XP):
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {quizOptions.map((opt) => {
                          const isSelected = quizSelectedId === opt.id;
                          const isRight = opt.id === currentWord.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setQuizSelectedId(opt.id);
                                if (isRight) setUserXp((x) => x + 20);
                              }}
                              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? isRight
                                    ? 'bg-[#ECFDF5] border-[#059669] text-[#0F172A] font-bold'
                                    : 'bg-[#FFF1F2] border-[#E11D48] text-[#0F172A]'
                                  : 'bg-[#F8FBFF] border-[#DCEBFA] text-[#0F172A] hover:border-[#0284C7]'
                              }`}
                            >
                              {opt.vi || opt.en}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-base sm:text-lg font-semibold text-[#0F172A] leading-snug">
                        {currentWord.vi || currentWord.en}
                      </p>
                      {currentWord.vi && (
                        <p className="text-xs text-[#334155] leading-relaxed">
                          {currentWord.en}
                        </p>
                      )}
                    </>
                  )}

                  {/* UK / US Pronunciation Waveform Buttons */}
                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleAudioTrigger('uk')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono-data text-[#0F172A] transition-colors cursor-pointer"
                    >
                      <UkFlagSvg />
                      <span className="font-bold">UK</span>
                      <WaveformSvg active={playingVoice === 'uk'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAudioTrigger('us')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-xs font-mono-data text-[#0F172A] transition-colors cursor-pointer"
                    >
                      <UsFlagSvg />
                      <span className="font-bold">US</span>
                      <WaveformSvg active={playingVoice === 'us'} />
                    </button>
                  </div>
                </div>

                {/* Right Side: Contextual Word-Atlas Illustration */}
                <div className="sm:col-span-5">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#F0F7FF] border border-[#BAE6FD]">
                    {!imgErrorMap[currentWord.id] ? (
                      <img
                        src={currentWord.imgUrl}
                        alt={`Minh họa ngữ cảnh cho từ ${currentWord.w}`}
                        onError={() =>
                          setImgErrorMap((prev) => ({
                            ...prev,
                            [currentWord.id]: true
                          }))
                        }
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-[#F0F7FF] text-[#0F172A]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono-data text-xs text-[#0284C7] font-bold">
                            LEXICAL BLUEPRINT • {currentWord.topic.toUpperCase()}
                          </span>
                          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF] font-bold">
                            {currentWord.cefr}
                          </span>
                        </div>
                        <div className="my-auto py-2 border-y border-[#DCEBFA]">
                          <div className="font-display text-2xl font-black text-[#0F172A]">
                            {currentWord.w}
                          </div>
                          <div className="font-mono-data text-xs text-[#0284C7] mt-1">
                            {currentWord.uk || currentWord.us} • {currentWord.pos}
                          </div>
                        </div>
                        <span className="text-xs text-[#334155] line-clamp-2">
                          {currentWord.col.join(' • ') || currentWord.en}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAudioTrigger('ex')}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#FFFFFF]/95 text-[#0284C7] hover:bg-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-mono-data text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{lang === 'vi' ? 'Nghe câu ví dụ' : 'Example Audio'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collocations Strip */}
              {currentWord.col && currentWord.col.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#DCEBFA] flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-data text-xs text-[#0284C7] font-bold mr-1">
                    COLLOCATIONS:
                  </span>
                  {currentWord.col.slice(0, 3).map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA] text-xs font-mono-data"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Half: Interactive Cloze / Dictation Sentence Bar */}
              <div className="mt-4 pt-4 border-t border-[#DCEBFA]">
                <div className="text-sm sm:text-base text-[#0F172A] leading-relaxed">
                  <span>{clozeSentenceParts.before}</span>
                  <input
                    type="text"
                    value={clozeInput}
                    onChange={(e) => handleClozeChange(e.target.value)}
                    placeholder={
                      practiceMode === 'see'
                        ? currentWord.w
                        : 'gõ từ vựng vào đây...'
                    }
                    aria-label="Điền từ vựng IELTS vào câu khuyết"
                    className={`mx-1.5 px-2.5 py-0.5 rounded-md border bg-[#F0F7FF] font-mono-data text-sm font-bold w-36 sm:w-44 focus:outline-none ${
                      clozeSolved
                        ? 'border-[#059669] text-[#059669] bg-[#ECFDF5]'
                        : 'border-[#0284C7] text-[#0284C7]'
                    }`}
                  />
                  <span>{clozeSentenceParts.after}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#334155]">
                  <span>
                    {currentWord.ex[0]?.vi ||
                      'Điền lại từ vựng vào chỗ trống để kích hoạt trí nhớ chủ động (Active Recall +15 XP).'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex(
                          (prev) => (prev - 1 + queueWords.length) % queueWords.length
                        )
                      }
                      className="p-1 rounded bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#DCEBFA]"
                      aria-label="Thẻ từ trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono-data font-bold text-[#0F172A]">
                      {currentIndex + 1}/{queueWords.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev + 1) % queueWords.length)
                      }
                      className="p-1 rounded bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#DCEBFA]"
                      aria-label="Thẻ từ tiếp theo"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4 FSRS Spaced Repetition Rating Buttons */}
          <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => handleGradeCard('again')}
              className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [1] Again {intervals.again}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('hard')}
              className="py-2.5 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [2] Hard {intervals.hard}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('good')}
              className="py-2.5 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [3] Good {intervals.good}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('easy')}
              className="py-2.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [4] Easy {intervals.easy}
            </button>
          </div>
        </section>

        {/* COLUMN 3 (3 cols): 03 / WORD ATLAS & 04 / ĐUA TOP HỌC VIÊN PRO */}
        <div className="lg:col-span-3 flex flex-col gap-5 justify-between">
          {/* 03 / WORD ATLAS CONSTELLATION */}
          <section
            aria-label="03 Word Atlas Constellation"
            className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCEBFA] shadow-sm"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEBFA]">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-[#0F172A]">
                03 / WORD ATLAS RADAR
              </h2>
              <a
                href="#topics-explorer"
                className="font-mono-data text-xs font-bold text-[#0284C7] hover:underline"
              >
                7,298 TỪ
              </a>
            </div>

            <WordAtlasConstellation
              topics={topics}
              activeTopic={activeTopic}
              onSelectTopic={(topicId) => {
                setActiveTopic(topicId);
                setExplorerPage(1);
              }}
            />
          </section>

          {/* 04 / ĐUA TOP HỌC VIÊN PRO */}
          <section
            id="leaderboard-04"
            aria-label="04 Đua Top Học Viên PRO"
            className="bg-[#FFFFFF] rounded-2xl p-5 flex-1 flex flex-col justify-between border border-[#DCEBFA] shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#DCEBFA]">
                <h2 className="font-display text-sm font-extrabold tracking-wide text-[#0F172A]">
                  04 / ĐUA TOP SĂN PRO
                </h2>
                <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#F0F7FF] text-[#0284C7] font-bold">
                  Weekly • Demo
                </span>
              </div>

              {/* 3 Podium Columns */}
              <div className="mt-4 grid grid-cols-3 gap-2 items-end text-center">
                <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                  <Award className="w-5 h-5 mx-auto text-[#0284C7]" />
                  <div className="font-display text-xs font-bold text-[#0F172A] mt-1.5">
                    Hạng 2
                  </div>
                  <div className="font-mono-data text-xs text-[#64748B]">
                    2,180 XP
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#E0F2FE] border border-[#0284C7]">
                  <Trophy className="w-6 h-6 mx-auto text-[#0284C7]" />
                  <div className="font-display text-xs font-extrabold text-[#0284C7] mt-1.5">
                    Hạng 1 PRO
                  </div>
                  <div className="font-mono-data text-xs font-bold text-[#0F172A]">
                    2,490 XP
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                  <Shield className="w-5 h-5 mx-auto text-[#059669]" />
                  <div className="font-display text-xs font-bold text-[#0F172A] mt-1.5">
                    Hạng 3
                  </div>
                  <div className="font-mono-data text-xs text-[#64748B]">
                    1,890 XP
                  </div>
                </div>
              </div>
            </div>

            {/* Live Learner XP Rows */}
            <div className="mt-4 pt-3 border-t border-[#DCEBFA] divide-y divide-[#EBF5FF] text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="font-medium text-[#0F172A]">
                  1. Minh Anh (Band 7.5 Route)
                </span>
                <span className="font-mono-data text-[#0284C7] font-bold">
                  2,490 XP
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-medium text-[#059669]">
                  • Bạn (Phiên FSRS hiện tại)
                </span>
                <span className="font-mono-data text-[#059669] font-bold">
                  {userXp.toLocaleString()} XP
                </span>
              </div>
              <div className="pt-2.5">
                <Link
                  href="/pricing"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'vi'
                        ? 'Mở Khóa Gói PRO Qua VietQR'
                        : 'Unlock PRO via VietQR'}
                    </span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* SECTION 2: 19 IELTS TOPICS EXPLORER & FULL 7,298 WORD ATLAS BROWSER */}
      <section
        id="topics-explorer"
        className="mt-8 bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] shadow-sm"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-[#DCEBFA]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg sm:text-xl font-black tracking-wide text-[#0F172A]">
              03 / KHO TỪ VỰNG 19 CHỦ ĐỀ WORD-ATLAS ({explorerTotal.toLocaleString()} TỪ KHỚP BỘ LỌC)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={atlasQuery}
                onChange={(e) => {
                  setAtlasQuery(e.target.value);
                  setExplorerPage(1);
                }}
                placeholder="Tìm trong 7,298 từ IELTS..."
                className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#0F172A] placeholder:text-[#64748B]"
              />
            </div>

            <button
              type="button"
              onClick={handleLoadExplorerIntoStation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0284C7] text-[#FFFFFF] hover:bg-[#0369A1] font-display text-xs font-extrabold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {lang === 'vi'
                  ? 'Nạp Chủ Đề Này Lên Trạm 02'
                  : 'Load Topic into Station 02'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleExportProgress}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#F0F7FF] text-[#0284C7] hover:bg-[#E0F2FE] border border-[#BAE6FD] font-display text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup Tiến Độ FSRS</span>
            </button>
          </div>
        </div>

        {/* 19 Topic Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => {
              setActiveTopic('all');
              setExplorerPage(1);
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-display font-bold shrink-0 transition-colors cursor-pointer border ${
              activeTopic === 'all'
                ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                : 'bg-[#F8FBFF] text-[#334155] border-[#DCEBFA] hover:bg-[#E0F2FE]'
            }`}
          >
            Tất cả 19 Chủ đề (7,298)
          </button>

          {topics.map((t) => {
            const isSelected = activeTopic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTopic(t.id);
                  setExplorerPage(1);
                }}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7] font-bold'
                    : 'bg-[#F8FBFF] text-[#0F172A] border-[#DCEBFA] hover:bg-[#E0F2FE]'
                }`}
              >
                <span>{t.vi}</span>
                <span className="font-mono-data ml-1.5 opacity-80">({t.total})</span>
              </button>
            );
          })}
        </div>

        {/* CEFR Filter Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono-data text-xs text-[#64748B] font-bold mr-2">
              CẤP ĐỘ CEFR:
            </span>
            {(['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setActiveCefr(lvl);
                  setExplorerPage(1);
                }}
                className={`px-2.5 py-1 rounded-md font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                  activeCefr === lvl
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#F0F7FF] text-[#334155] hover:bg-[#E0F2FE]'
                }`}
              >
                {lvl === 'all' ? 'TẤT CẢ (A1–C2)' : lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono-data text-xs text-[#334155]">
            <button
              type="button"
              disabled={explorerPage <= 1}
              onClick={() => setExplorerPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-[#F0F7FF] text-[#0284C7] font-bold disabled:opacity-40 cursor-pointer"
            >
              Trang trước
            </button>
            <span>Trang {explorerPage}</span>
            <button
              type="button"
              onClick={() => setExplorerPage((p) => p + 1)}
              className="px-2.5 py-1 rounded bg-[#F0F7FF] text-[#0284C7] font-bold cursor-pointer"
            >
              Trang tiếp
            </button>
          </div>
        </div>

        {/* Word Grid (Flush Architectural White/Sky Cells, No Nested Boxed Cards) */}
        <div
          className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#DCEBFA] rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#DCEBFA] ${
            loadingExplorer ? 'opacity-60' : ''
          }`}
        >
          {explorerWords.map((item) => {
            const isReviewed = !!fsrsRecords[item.id];
            return (
              <div
                key={item.id}
                className="p-4 bg-[#FFFFFF] hover:bg-[#F8FBFF] transition-colors flex flex-col justify-between gap-3 border-b border-[#DCEBFA]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectWordForStation(item)}
                      className="font-display text-lg font-extrabold text-[#0F172A] hover:text-[#0284C7] text-left transition-colors cursor-pointer"
                    >
                      {item.w}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold ${
                        CEFR_BADGE_STYLE[item.cefr] || 'bg-[#0284C7] text-[#FFFFFF]'
                      }`}
                    >
                      {item.cefr}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 font-mono-data text-xs text-[#64748B]">
                    <span>{item.uk || item.us}</span>
                    <span className="text-[#0284C7] font-bold">{item.pos}</span>
                  </div>

                  <p className="mt-2 text-xs text-[#334155] line-clamp-2">
                    {item.vi || item.en}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#EBF5FF] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        playPronunciation(item.audioUkUrl, item.w, 'en-GB')
                      }
                      className="px-2 py-1 rounded bg-[#F0F7FF] hover:bg-[#0284C7] text-xs font-mono-data font-bold text-[#0284C7] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                    >
                      UK
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSaveToNotebook(
                          item.w,
                          item.vi || item.en,
                          item.uk || item.us,
                          item.cefr
                        )
                      }
                      className="px-2 py-1 rounded bg-[#F0F7FF] hover:bg-[#0284C7] text-xs font-mono-data font-bold text-[#0284C7] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                      title="Lưu vào Sổ Từ Vựng Cá Nhân"
                    >
                      + Sổ Từ
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectWordForStation(item)}
                    className={`px-2.5 py-1 rounded-md font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      isReviewed
                        ? 'bg-[#059669] text-[#FFFFFF]'
                        : 'bg-[#0284C7] text-[#FFFFFF] hover:bg-[#0369A1]'
                    }`}
                  >
                    {isReviewed ? 'Đã ôn FSRS' : 'Học ở Trạm 02'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: MY-IELTS BIG DATA HUB */}
      <MyIeltsBigDataHub
        chapters={chapters}
        readingTiers={readingTiers}
        listening179={listening179}
        writing100={writing100}
        onSendWordToFsrs={(wordText) => handleSelectWordForStation(wordText)}
        lang={lang}
      />

      {/* SECTION 4: SPLIT-SCREEN EXAM ROOM & LEAD GEN FOOTER */}
      <SplitScreenExamPreview
        onSelectVocabFromPassage={(wordText) => handleSelectWordForStation(wordText)}
        onSaveToNotebook={handleSaveToNotebook}
        lang={lang}
      />
    </div>
  );
}
