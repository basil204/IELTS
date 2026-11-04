'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Globe,
  Headphones,
  LogIn,
  Map,
  MoreHorizontal,
  RotateCcw,
  Search,
  Settings,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trophy,
  Upload,
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

const CEFR_BADGE_STYLE: Record<CefrLevel, string> = {
  A1: 'bg-[#38BDF8] text-[#16181D]',
  A2: 'bg-[#2DD4BF] text-[#16181D]',
  B1: 'bg-[#A3E635] text-[#16181D]',
  B2: 'bg-[#FACC15] text-[#16181D]',
  C1: 'bg-[#FACC15] text-[#16181D]',
  C2: 'bg-[#EA580C] text-[#F4F1EA]'
};

const STORAGE_KEY_FSRS = 'tid_word_atlas_fsrs_v1';
const STORAGE_KEY_XP = 'tid_word_atlas_xp_v1';

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
      className={`w-12 h-4 ${active ? 'text-[#FACC15]' : 'text-[#FACC15]/80'}`}
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
  // FSRS Queue & Card State
  const [queueWords, setQueueWords] = useState<WordAtlasEntry[]>(initialPriorityWords);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [fsrsRecords, setFsrsRecords] = useState<Record<string, FsrsCardRecord>>({});
  const [userXp, setUserXp] = useState<number>(1420);
  const [streakDays, setStreakDays] = useState<number>(14);
  const [targetBand, setTargetBand] = useState<string>('7.5');
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeUser, setActiveUser] = useState<{
    name: string;
    email: string;
    role: string;
    plan: string;
  } | null>(null);

  // Interactive Cloze / Dictation / Quiz inside Hero 02
  const [practiceMode, setPracticeMode] = useState<'see' | 'quiz' | 'cloze' | 'dictation'>('see');
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

  // Load saved FSRS records from localStorage
  useEffect(() => {
    try {
      const savedFsrs = localStorage.getItem(STORAGE_KEY_FSRS);
      if (savedFsrs) {
        setFsrsRecords(JSON.parse(savedFsrs));
      }
      const savedXp = localStorage.getItem(STORAGE_KEY_XP);
      if (savedXp) {
        setUserXp(Number(savedXp) || 1420);
      }
      const savedUser = localStorage.getItem('tid_active_user_v1');
      if (savedUser) {
        setActiveUser(JSON.parse(savedUser));
      }
      const savedLang = localStorage.getItem('tid_lang_v1');
      if (savedLang === 'en' || savedLang === 'vi') {
        setLang(savedLang);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const currentWord = queueWords[currentIndex] || queueWords[0];
  const currentRecord = currentWord ? fsrsRecords[currentWord.id] : undefined;
  const intervals = useMemo(() => getIntervalPreviews(currentRecord), [currentRecord]);

  const reviewedCount = Object.keys(fsrsRecords).length;
  const dueQueueCount = Math.max(1, 28 - (reviewedCount % 28));

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
        // fallback to local filtering
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

    const xpGain = rating === 'easy' ? 25 : rating === 'good' ? 20 : rating === 'hard' ? 10 : 5;
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

  // Generate 4 Multiple Choice Quiz options for currentWord
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
    const combined = [currentWord, ...picked];
    return combined.sort((a, b) => a.id.localeCompare(b.id));
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

      // Query API for exact word if string passed
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
              (x: WordAtlasEntry) => x.w.toLowerCase() === wordOrEntry.toLowerCase()
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

  // Build masked Cloze sentence for currentWord
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
      fsrsRecords
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tid-word-atlas-fsrs-backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const streakDigits = String(streakDays).padStart(2, '0').split('');

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-7">
      {/* TOP CONCOURSE WAYFINDING HEADER */}
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-[#16181D]/15">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-[#16181D] leading-none">
              THE IELTS DICTIONARY × WORD ATLAS
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16181D] text-[#FACC15] font-mono-data text-xs font-bold border border-[#2E3340] cursor-pointer"
              title="Switch Interface Language (Tiếng Việt / English)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'VI • EN' : 'EN • VI'}</span>
            </button>
          </div>

          <nav aria-label="Điều hướng phân khu chính" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link
              href="/roadmap"
              className="font-semibold text-[#16181D] border-b-2 border-[#16181D] pb-1 inline-flex items-center gap-1"
            >
              <strong className="font-mono-data">01</strong>
              <span>{lang === 'vi' ? 'Lộ Trình 12 Tuần' : '12-Week Roadmap'}</span>
            </Link>
            <a
              href="#station-02"
              className="font-medium text-[#4A4740] hover:text-[#16181D] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#16181D]">02</strong>
              {lang === 'vi' ? 'Hôm Nay Học Gì' : 'Today FSRS'}
            </a>
            <a
              href="#topics-explorer"
              className="font-medium text-[#4A4740] hover:text-[#16181D] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#16181D]">03</strong>
              {lang === 'vi' ? 'Word Atlas (7,298 Từ)' : 'Word Atlas (7,298 Words)'}
            </a>
            <Link
              href="/pricing"
              className="font-medium text-[#065F46] hover:text-[#16181D] pb-1 transition-colors inline-flex items-center gap-1"
            >
              <strong className="font-mono-data text-[#16181D]">04</strong>
              <span>{lang === 'vi' ? 'Nâng Cấp VIP (VietQR)' : 'VIP Upgrade (VietQR)'}</span>
            </Link>
            <a
              href="#my-ielts-hub"
              className="font-medium text-[#4A4740] hover:text-[#16181D] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#16181D]">05</strong>
              {lang === 'vi' ? 'Kho My-IELTS (3,674 Từ)' : 'My-IELTS Corpus (3,674 Words)'}
            </a>
            <a
              href="#exam-room"
              className="font-medium text-[#4A4740] hover:text-[#16181D] pb-1 transition-colors"
            >
              <strong className="font-mono-data mr-1 text-[#16181D]">06</strong>
              {lang === 'vi' ? 'Phòng Thi Máy Tính' : 'Computer Exam Room'}
            </a>
            <Link
              href="/admin"
              className="font-mono-data text-xs font-bold px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] hover:bg-[#252934] transition-colors inline-flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ADMIN CMS</span>
            </Link>
          </nav>
        </div>

        {/* Mechanical Split-Flap Streak Counter, User Auth & Primary CTA */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <div
            className="bg-[#16181D] text-[#F4F1EA] px-3 py-2 rounded-xl flex items-center gap-2.5 border border-[#2E3340] shadow-sm"
            title="Chuỗi ngày học liên tiếp (Split-Flap Streak)"
          >
            <div className="flex items-center gap-1">
              {streakDigits.map((d, idx) => (
                <span
                  key={idx}
                  className="split-flap-digit w-7 h-9 text-xl bg-[#FACC15] text-[#16181D]"
                  style={{ backgroundColor: '#FACC15', color: '#16181D' }}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="font-display text-xs font-extrabold leading-tight text-[#FACC15] tracking-wide">
              <div>DAYS</div>
              <div>STREAK</div>
            </div>
          </div>

          {activeUser ? (
            <Link
              href={activeUser.role === 'admin' ? '/admin' : '/roadmap'}
              className="bg-[#16181D] hover:bg-[#232732] text-[#F4F1EA] border border-[#2E3340] font-display font-bold text-xs sm:text-sm px-3.5 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-[#10B981]" />
              <span>{activeUser.name}</span>
              <span className="font-mono-data text-xs px-1.5 py-0.5 rounded bg-[#FACC15] text-[#16181D] font-bold">
                {activeUser.plan}
              </span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-[#16181D] hover:bg-[#232732] text-[#F4F1EA] border border-[#2E3340] font-display font-bold text-xs sm:text-sm px-4 py-3 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4 text-[#FACC15]" />
              <span>{lang === 'vi' ? 'Đăng Nhập / Google' : 'Sign In / Google'}</span>
            </Link>
          )}

          <a
            href="#station-02"
            onClick={() => handleAudioTrigger('uk')}
            className="bg-[#065F46] hover:bg-[#047857] text-[#F4F1EA] font-display font-bold text-sm sm:text-base px-5 py-3 rounded-xl transition-colors shadow-sm"
          >
            {lang === 'vi' ? 'Bắt Đầu Học Ngay' : 'Start Learning Now'}
          </a>
        </div>
      </header>

      {/* FIRST VIEWPORT: ASYMMETRIC 3-COLUMN CONCOURSE BENTO GRID */}
      <main
        id="bento-concourse"
        className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
      >
        {/* COLUMN 1 (3 cols): 01 / LỘ TRÌNH ADAPTIVE */}
        <section
          aria-label="01 Lộ trình Adaptive"
          className="lg:col-span-3 concourse-panel rounded-2xl p-5 flex flex-col justify-between border border-[#2E3340]"
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2E3340]">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-[#F4F1EA]">
                01 / LỘ TRÌNH ADAPTIVE
              </h2>
              <MoreHorizontal className="w-4 h-4 text-[#B8B2A6]" />
            </div>

            {/* Departure Band -> Destination Band */}
            <div className="mt-5 flex items-center justify-between gap-2">
              <div className="bg-[#EA580C] text-[#16181D] rounded-xl px-3.5 py-2.5 text-center min-w-[74px]">
                <div className="text-xs font-bold">Band</div>
                <div className="font-display text-2xl font-black leading-none mt-0.5 tabular-nums">
                  5.0
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center text-[#FACC15]">
                <div className="w-full border-t-2 border-dashed border-[#FACC15]" />
                <ArrowRight className="w-5 h-5 -ml-1 shrink-0 text-[#FACC15]" />
              </div>

              <button
                type="button"
                onClick={() =>
                  setTargetBand((prev) =>
                    prev === '7.5' ? '8.0' : prev === '8.0' ? '6.5' : '7.5'
                  )
                }
                title="Nhấp để đổi mục tiêu Band điểm"
                className="bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] rounded-xl px-3.5 py-2.5 text-center min-w-[74px] transition-colors cursor-pointer"
              >
                <div className="text-xs font-bold">Band</div>
                <div className="font-display text-2xl font-black leading-none mt-0.5 tabular-nums">
                  {targetBand}
                </div>
              </button>
            </div>

            {/* Milestone Progress Section */}
            <div className="mt-6 pt-5 border-t border-[#2E3340]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#F4F1EA] mb-2">
                <span>Milestone progress</span>
                <span className="font-mono-data text-[#FACC15]">64%</span>
              </div>
              <div className="w-full h-4 rounded-full bg-[#2A2E39] p-0.5 overflow-hidden">
                <div className="h-full w-[64%] rounded-full bg-[#FACC15]" />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-mono-data text-[#B8B2A6]">
                <span>Band 5.0 - Band</span>
                <span className="text-[#F4F1EA] font-bold">{targetBand}</span>
              </div>
            </div>

            {/* Current Target Telemetry */}
            <div className="mt-5 pt-5 border-t border-[#2E3340] space-y-1.5">
              <div className="text-sm font-bold text-[#F4F1EA]">Current Target</div>
              <div className="text-xs text-[#B8B2A6] flex items-center justify-between">
                <span>Độ nhớ FSRS (Retention):</span>
                <span className="font-mono-data text-[#F4F1EA] font-semibold">94.2%</span>
              </div>
              <div className="text-xs text-[#B8B2A6] flex items-center justify-between">
                <span>Từ vựng đã thuộc hôm nay:</span>
                <span className="font-mono-data text-[#FACC15] font-bold">
                  {35 + reviewedCount} từ
                </span>
              </div>
              <div className="text-xs text-[#B8B2A6] flex items-center justify-between">
                <span>Trạng thái thẻ hiện tại:</span>
                <span className="font-mono-data text-[#10B981]">
                  {currentRecord?.state || 'Review'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Vocabulary Mastery Bar */}
          <div className="mt-6 pt-4 border-t border-[#2E3340]">
            <div className="text-sm font-bold text-[#F4F1EA] mb-2">
              Vocabulary Mastery (CEFR A1–C2)
            </div>
            <div className="w-full h-3.5 rounded-full bg-[#2A2E39] overflow-hidden flex">
              <div className="w-[22%] h-full bg-[#EA580C]" />
              <div className="w-[26%] h-full bg-[#F59E0B]" />
              <div className="w-[20%] h-full bg-[#FACC15]" />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs font-mono-data text-[#B8B2A6]">
              <span>0%</span>
              <span>7,298 IELTS Words</span>
              <span>100%</span>
            </div>

            <Link
              href="/roadmap"
              className="mt-4 w-full py-2.5 px-3 rounded-lg bg-[#252934] hover:bg-[#FACC15] hover:text-[#16181D] text-[#F4F1EA] font-display font-bold text-xs flex items-center justify-between transition-colors"
            >
              <span className="inline-flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-[#FACC15]" />
                <span>{lang === 'vi' ? 'Mở Lộ Trình 12 Tuần & Placement Test' : 'Open 12-Week Roadmap & Placement Test'}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* COLUMN 2 (6 cols): 02 / HÔM NAY HỌC GÌ (FSRS QUEUE) */}
        <section
          id="station-02"
          aria-label="02 Hôm nay học gì FSRS Queue"
          className="lg:col-span-6 wayfinding-hero-panel rounded-2xl p-4 sm:p-5 flex flex-col justify-between"
        >
          {/* Yellow Concourse Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-black tracking-tight text-[#16181D]">
                {lang === 'vi'
                  ? `02 / HÔM NAY HỌC GÌ (FSRS QUEUE: ${dueQueueCount} TỪ)`
                  : `02 / TODAY FSRS QUEUE (${dueQueueCount} DUE)`}
              </h2>
              <div className="flex items-center gap-1 bg-[#16181D]/10 p-0.5 rounded-md">
                {(['ALL', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleFilterStationByCefr(lvl)}
                    className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold cursor-pointer transition-colors ${
                      stationCefrFilter === lvl
                        ? 'bg-[#16181D] text-[#FACC15]'
                        : 'text-[#16181D] hover:bg-[#16181D]/15'
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
                className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'see'
                    ? 'bg-[#16181D] text-[#FACC15]'
                    : 'bg-[#16181D]/10 text-[#16181D] hover:bg-[#16181D]/20'
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
                className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'quiz'
                    ? 'bg-[#16181D] text-[#FACC15]'
                    : 'bg-[#16181D]/10 text-[#16181D] hover:bg-[#16181D]/20'
                }`}
              >
                {lang === 'vi' ? 'Quiz 4 Đáp Án' : '4-Option Quiz'}
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('cloze')}
                className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'cloze'
                    ? 'bg-[#16181D] text-[#FACC15]'
                    : 'bg-[#16181D]/10 text-[#16181D] hover:bg-[#16181D]/20'
                }`}
              >
                Recall Cloze
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('dictation')}
                className={`px-2.5 py-1 rounded text-xs font-display font-bold transition-colors cursor-pointer ${
                  practiceMode === 'dictation'
                    ? 'bg-[#16181D] text-[#FACC15]'
                    : 'bg-[#16181D]/10 text-[#16181D] hover:bg-[#16181D]/20'
                }`}
              >
                Dictation
              </button>
            </div>
          </div>

          {/* Inner Dark Charcoal Lexical Theatre */}
          {currentWord && (
            <div className="bg-[#16181D] text-[#F4F1EA] rounded-xl p-5 flex-1 flex flex-col justify-between">
              {/* Top Half: Word + Phonetics + Audio + Visual Scene */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <h3 className="font-display text-3xl sm:text-4xl font-black tracking-tight text-[#F4F1EA] leading-none">
                      {practiceMode === 'dictation' && !clozeSolved
                        ? `${currentWord.w[0]}${'•'.repeat(Math.max(3, currentWord.w.length - 1))}`
                        : currentWord.w}
                    </h3>
                  </div>

                  <div className="font-mono-data text-base text-[#B8B2A6]">
                    {currentWord.uk || currentWord.us || `/ˈ${currentWord.w}/`}{' '}
                    <span className="text-[#EA580C] ml-1">{currentWord.pos}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded font-mono-data text-xs font-bold ${
                        CEFR_BADGE_STYLE[currentWord.cefr] || 'bg-[#FACC15] text-[#16181D]'
                      }`}
                    >
                      {currentWord.cefr} • {currentWord.topic.charAt(0).toUpperCase() + currentWord.topic.slice(1)}
                    </span>
                    {currentRecord && (
                      <span className="px-2 py-0.5 rounded bg-[#272B35] text-[#10B981] font-mono-data text-xs">
                        Stability: {currentRecord.stability}d
                      </span>
                    )}
                  </div>

                  {practiceMode === 'quiz' ? (
                    <div className="space-y-1.5 pt-1">
                      <div className="font-mono-data text-xs text-[#FACC15] font-bold">
                        {lang === 'vi'
                          ? 'CHỌN NGHĨA ĐÚNG CỦA TỪ (+20 XP):'
                          : 'SELECT THE CORRECT MEANING (+20 XP):'}
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
                                if (isRight) {
                                  setUserXp((x) => x + 20);
                                }
                              }}
                              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? isRight
                                    ? 'bg-[#065F46] border-[#10B981] text-[#F4F1EA] font-bold'
                                    : 'bg-[#EA580C]/30 border-[#EA580C] text-[#F4F1EA]'
                                  : 'bg-[#1F2229] border-[#363B47] text-[#F4F1EA] hover:border-[#FACC15]'
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
                      <p className="text-base sm:text-lg font-medium text-[#F4F1EA] leading-snug">
                        {currentWord.vi || currentWord.en}
                      </p>
                      {currentWord.vi && (
                        <p className="text-xs text-[#B8B2A6] leading-relaxed">
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
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222630] hover:bg-[#2E3340] border border-[#363B47] text-xs font-mono-data text-[#F4F1EA] transition-colors cursor-pointer"
                    >
                      <UkFlagSvg />
                      <span className="font-bold">UK</span>
                      <WaveformSvg active={playingVoice === 'uk'} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAudioTrigger('us')}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#222630] hover:bg-[#2E3340] border border-[#363B47] text-xs font-mono-data text-[#F4F1EA] transition-colors cursor-pointer"
                    >
                      <UsFlagSvg />
                      <span className="font-bold">US</span>
                      <WaveformSvg active={playingVoice === 'us'} />
                    </button>
                  </div>
                </div>

                {/* Right Side: Contextual Word-Atlas Illustration */}
                <div className="sm:col-span-5">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#232732] border border-[#363B47]">
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
                      <div className="w-full h-full p-4 flex flex-col justify-between bg-[#1F2430] text-[#F4F1EA]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono-data text-xs text-[#FACC15]">
                            LEXICAL BLUEPRINT • {currentWord.topic.toUpperCase()}
                          </span>
                          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#16181D] text-[#10B981]">
                            {currentWord.cefr}
                          </span>
                        </div>
                        <div className="my-auto py-2 border-y border-[#2E3340]">
                          <div className="font-display text-2xl font-black text-[#F4F1EA]">
                            {currentWord.w}
                          </div>
                          <div className="font-mono-data text-xs text-[#FACC15] mt-1">
                            {currentWord.uk || currentWord.us} • {currentWord.pos}
                          </div>
                        </div>
                        <span className="text-xs text-[#B8B2A6] line-clamp-2">
                          {currentWord.col.join(' • ') || currentWord.en}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAudioTrigger('ex')}
                      className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-[#16181D]/85 text-[#FACC15] hover:bg-[#FACC15] hover:text-[#16181D] font-mono-data text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>{lang === 'vi' ? 'Nghe câu ví dụ' : 'Example Audio'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Collocations Strip */}
              {currentWord.col && currentWord.col.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#2B303C] flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-data text-xs text-[#FACC15] mr-1">
                    COLLOCATIONS:
                  </span>
                  {currentWord.col.slice(0, 3).map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-[#222630] text-[#B8B2A6] text-xs font-mono-data"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Bottom Half: Interactive Cloze / Dictation Sentence Bar */}
              <div className="mt-4 pt-4 border-t border-[#2B303C]">
                <div className="text-sm sm:text-base text-[#F4F1EA] leading-relaxed">
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
                    className={`mx-1.5 px-2.5 py-0.5 rounded-md border bg-[#232732] font-mono-data text-sm font-bold w-36 sm:w-44 focus:outline-none ${
                      clozeSolved
                        ? 'border-[#10B981] text-[#10B981]'
                        : 'border-[#FACC15] text-[#FACC15]'
                    }`}
                  />
                  <span>{clozeSentenceParts.after}</span>
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#B8B2A6]">
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
                      className="p-1 rounded bg-[#232732] hover:bg-[#2E3340] text-[#F4F1EA]"
                      aria-label="Thẻ từ trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono-data">
                      {currentIndex + 1}/{queueWords.length}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentIndex((prev) => (prev + 1) % queueWords.length)
                      }
                      className="p-1 rounded bg-[#232732] hover:bg-[#2E3340] text-[#F4F1EA]"
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
              className="py-2.5 px-3 rounded-lg bg-[#EA580C] hover:bg-[#D9460F] text-[#F4F1EA] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [1] Again {intervals.again}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('hard')}
              className="py-2.5 px-3 rounded-lg bg-[#16181D] hover:bg-[#232732] text-[#F4F1EA] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [2] Hard {intervals.hard}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('good')}
              className="py-2.5 px-3 rounded-lg bg-[#15803D] hover:bg-[#166534] text-[#F4F1EA] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [3] Good {intervals.good}
            </button>
            <button
              type="button"
              onClick={() => handleGradeCard('easy')}
              className="py-2.5 px-3 rounded-lg bg-[#065F46] hover:bg-[#047857] text-[#F4F1EA] font-mono-data text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer shadow-sm"
            >
              [4] Easy {intervals.easy}
            </button>
          </div>
        </section>

        {/* COLUMN 3 (3 cols): 03 / WORD ATLAS & 04 / ĐUA TOP SĂN VIP */}
        <div className="lg:col-span-3 flex flex-col gap-5 justify-between">
          {/* 03 / WORD ATLAS CONSTELLATION */}
          <section
            aria-label="03 Word Atlas Constellation"
            className="concourse-panel rounded-2xl p-5 border border-[#2E3340]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2E3340]">
              <h2 className="font-display text-sm font-extrabold tracking-wide text-[#F4F1EA]">
                03 / WORD ATLAS
              </h2>
              <a
                href="#topics-explorer"
                className="font-mono-data text-xs text-[#FACC15] hover:underline"
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

          {/* 04 / ĐUA TOP SĂN VIP */}
          <section
            id="leaderboard-04"
            aria-label="04 Đua Top Săn VIP"
            className="concourse-panel rounded-2xl p-5 flex-1 flex flex-col justify-between border border-[#2E3340]"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#2E3340]">
                <h2 className="font-display text-sm font-extrabold tracking-wide text-[#F4F1EA]">
                  04 / ĐUA TOP SĂN VIP
                </h2>
                <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#252934] text-[#B8B2A6]">
                  Weekly • Demo
                </span>
              </div>

              {/* 3 Podium Columns */}
              <div className="mt-4 grid grid-cols-3 gap-2 items-end text-center">
                <div className="p-2.5 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <Award className="w-5 h-5 mx-auto text-[#94A3B8]" />
                  <div className="font-display text-xs font-bold text-[#F4F1EA] mt-1.5">
                    Hạng 2
                  </div>
                  <div className="font-mono-data text-xs text-[#B8B2A6]">
                    2,180 XP
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#252934] border border-[#FACC15]/50">
                  <Trophy className="w-6 h-6 mx-auto text-[#FACC15]" />
                  <div className="font-display text-xs font-extrabold text-[#FACC15] mt-1.5">
                    Hạng 1 VIP
                  </div>
                  <div className="font-mono-data text-xs text-[#F4F1EA]">
                    2,490 XP
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <Shield className="w-5 h-5 mx-auto text-[#10B981]" />
                  <div className="font-display text-xs font-bold text-[#F4F1EA] mt-1.5">
                    Hạng 3
                  </div>
                  <div className="font-mono-data text-xs text-[#B8B2A6]">
                    1,890 XP
                  </div>
                </div>
              </div>
            </div>

            {/* Live Learner XP Rows */}
            <div className="mt-4 pt-3 border-t border-[#2E3340] divide-y divide-[#252934] text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="font-medium text-[#F4F1EA]">
                  1. Minh Anh (Band 7.5 Route)
                </span>
                <span className="font-mono-data text-[#FACC15] font-bold">
                  2,490 XP
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-medium text-[#10B981]">
                  • Bạn (Phiên FSRS hiện tại)
                </span>
                <span className="font-mono-data text-[#10B981] font-bold">
                  {userXp.toLocaleString()} XP
                </span>
              </div>
              <div className="pt-2.5">
                <Link
                  href="/pricing"
                  className="w-full py-2 px-3 rounded-lg bg-[#065F46] hover:bg-[#047857] text-[#F4F1EA] font-display font-bold text-xs flex items-center justify-between transition-colors"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-[#FACC15]" />
                    <span>{lang === 'vi' ? 'Mở Khóa Gói VIP Qua VietQR' : 'Unlock VIP via VietQR'}</span>
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
        className="mt-7 concourse-panel rounded-2xl p-6 border border-[#2E3340]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-[#2E3340]">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-wide text-[#F4F1EA]">
              19 IELTS TOPICS EXPLORER • KHO TỪ VỰNG WORD-ATLAS ({explorerTotal.toLocaleString()} TỪ KHỚP BỘ LỌC)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#B8B2A6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={atlasQuery}
                onChange={(e) => {
                  setAtlasQuery(e.target.value);
                  setExplorerPage(1);
                }}
                placeholder="Tìm trong 7,298 từ IELTS..."
                className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F4F1EA] placeholder:text-[#B8B2A6]/70"
              />
            </div>

            <button
              type="button"
              onClick={handleLoadExplorerIntoStation}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FACC15] text-[#16181D] hover:bg-[#EAB308] font-display text-xs font-extrabold transition-colors cursor-pointer"
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F4F1EA] text-[#16181D] hover:bg-[#FACC15] font-display text-xs font-bold transition-colors cursor-pointer"
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
            className={`px-3.5 py-2 rounded-lg text-xs font-display font-bold shrink-0 transition-colors cursor-pointer ${
              activeTopic === 'all'
                ? 'bg-[#FACC15] text-[#16181D]'
                : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA]'
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
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FACC15] text-[#16181D] font-bold'
                    : 'bg-[#1F2229] text-[#F4F1EA] hover:bg-[#272B35]'
                }`}
              >
                <span>{t.vi}</span>
                <span className="font-mono-data ml-1.5 opacity-75">({t.total})</span>
              </button>
            );
          })}
        </div>

        {/* CEFR Filter Row */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#2E3340]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono-data text-xs text-[#B8B2A6] mr-2">
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
                className={`px-2.5 py-1 rounded font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                  activeCefr === lvl
                    ? 'bg-[#EA580C] text-[#F4F1EA]'
                    : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA]'
                }`}
              >
                {lvl === 'all' ? 'TẤT CẢ (A1–C2)' : lvl}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 font-mono-data text-xs text-[#B8B2A6]">
            <button
              type="button"
              disabled={explorerPage <= 1}
              onClick={() => setExplorerPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded bg-[#1F2229] text-[#F4F1EA] disabled:opacity-40"
            >
              Trang trước
            </button>
            <span>Trang {explorerPage}</span>
            <button
              type="button"
              onClick={() => setExplorerPage((p) => p + 1)}
              className="px-2.5 py-1 rounded bg-[#1F2229] text-[#F4F1EA]"
            >
              Trang tiếp
            </button>
          </div>
        </div>

        {/* Word Grid (Flush Architectural Cells, No Nested Boxed Cards) */}
        <div
          className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#2E3340] rounded-xl overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-[#2E3340] ${
            loadingExplorer ? 'opacity-60' : ''
          }`}
        >
          {explorerWords.map((item) => {
            const isReviewed = !!fsrsRecords[item.id];
            return (
              <div
                key={item.id}
                className="p-4 bg-[#1A1D24] hover:bg-[#222630] transition-colors flex flex-col justify-between gap-3 border-b border-[#2E3340]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectWordForStation(item)}
                      className="font-display text-lg font-extrabold text-[#F4F1EA] hover:text-[#FACC15] text-left transition-colors cursor-pointer"
                    >
                      {item.w}
                    </button>
                    <span
                      className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold ${
                        CEFR_BADGE_STYLE[item.cefr] || 'bg-[#FACC15] text-[#16181D]'
                      }`}
                    >
                      {item.cefr}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center gap-2 font-mono-data text-xs text-[#B8B2A6]">
                    <span>{item.uk || item.us}</span>
                    <span className="text-[#EA580C]">{item.pos}</span>
                  </div>

                  <p className="mt-2 text-xs text-[#F4F1EA] line-clamp-2">
                    {item.vi || item.en}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#2A2E39] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        playPronunciation(item.audioUkUrl, item.w, 'en-GB')
                      }
                      className="px-2 py-1 rounded bg-[#252934] hover:bg-[#FACC15] hover:text-[#16181D] text-xs font-mono-data text-[#F4F1EA] transition-colors cursor-pointer"
                    >
                      UK
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        playPronunciation(item.audioUsUrl, item.w, 'en-US')
                      }
                      className="px-2 py-1 rounded bg-[#252934] hover:bg-[#FACC15] hover:text-[#16181D] text-xs font-mono-data text-[#F4F1EA] transition-colors cursor-pointer"
                    >
                      US
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectWordForStation(item)}
                    className={`px-2.5 py-1 rounded font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      isReviewed
                        ? 'bg-[#065F46] text-[#F4F1EA]'
                        : 'bg-[#FACC15] text-[#16181D] hover:bg-[#EAB308]'
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

      {/* SECTION 3: MY-IELTS BIG DATA HUB (22 CHAPTERS, 538 READING, 179 LISTENING, 100 WRITING) */}
      <MyIeltsBigDataHub
        chapters={chapters}
        readingTiers={readingTiers}
        listening179={listening179}
        writing100={writing100}
        onSendWordToFsrs={(wordText) => handleSelectWordForStation(wordText)}
      />

      {/* SECTION 4: SPLIT-SCREEN EXAM ROOM & LEAD GEN FOOTER */}
      <SplitScreenExamPreview
        onSelectVocabFromPassage={(wordText) => handleSelectWordForStation(wordText)}
        lang={lang}
      />
    </div>
  );
}
