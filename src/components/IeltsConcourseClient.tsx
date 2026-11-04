'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Flame,
  Globe,
  Headphones,
  HelpCircle,
  Keyboard,
  Layers,
  LogOut,
  Search,
  Shield,
  Sparkles,
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
import type { PlatformUser } from '@/lib/db';
import {
  getIntervalPreviews,
  gradeFsrsCard,
  playPronunciation
} from '@/lib/fsrs-engine';
import WordAtlasConstellation from './WordAtlasConstellation';
import MyIeltsBigDataHub from './MyIeltsBigDataHub';
import SplitScreenExamPreview from './SplitScreenExamPreview';
import {
  AnimatedRoadmapBeam,
  BlurFade,
  BorderBeam,
  Marquee,
  NumberTicker
} from './magicui';

interface Props {
  initialPriorityWords: WordAtlasEntry[];
  topics: TopicStat[];
  chapters: MyIeltsChapter[];
  readingTiers: Reading538Tier[];
  listening179: Listening179Item[];
  writing100: Writing100Item[];
}

type StudyMode = 'see_hear' | 'quiz_mcq' | 'recall_cloze' | 'dictation';
type WorkspaceStep =
  | 'step1_roadmap'
  | 'step2_vocab'
  | 'step3_dictation'
  | 'step4_exam'
  | 'step5_dictionary';

const STORAGE_FSRS_KEY = 'tid_word_atlas_fsrs_v1';
const STORAGE_STREAK_KEY = 'tid_word_atlas_streak_v1';
const STORAGE_USER_KEY = 'tid_active_user_v1';
const STORAGE_NOTEBOOK_KEY = 'tid_vocab_notebook_v1';
const STORAGE_COMPLETED_LESSONS_KEY = 'tid_completed_lessons_v1';

const CEFR_BADGE_STYLE: Record<CefrLevel, string> = {
  A1: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
  A2: 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]',
  B1: 'bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]',
  B2: 'bg-[#0284C7] text-[#FFFFFF]',
  C1: 'bg-[#0369A1] text-[#FFFFFF]',
  C2: 'bg-[#E11D48] text-[#FFFFFF]'
};

const HALL_OF_FAME = [
  {
    name: 'Nguyễn Minh Khuê',
    roleVi: 'Học sinh THPT Chuyên Hà Nội - Amsterdam',
    roleEn: 'Hanoi-Amsterdam High School Student',
    overall: '8.5',
    subscores: 'L 9.0 • R 9.0 • W 7.5 • S 8.0',
    streak: 42
  },
  {
    name: 'Trần Hoàng Bách',
    roleVi: 'Sinh viên Đại học Ngoại Thương (FTU)',
    roleEn: 'Foreign Trade University Student',
    overall: '8.0',
    subscores: 'L 8.5 • R 9.0 • W 7.5 • S 7.5',
    streak: 36
  },
  {
    name: 'Lê Thảo Nguyên',
    roleVi: 'Chuyên viên Phân tích Tài chính',
    roleEn: 'Senior Financial Analyst',
    overall: '8.0',
    subscores: 'L 8.5 • R 8.5 • W 7.5 • S 7.5',
    streak: 29
  },
  {
    name: 'Phạm Quốc Bảo',
    roleVi: 'Kỹ sư Phần mềm Quốc tế',
    roleEn: 'International Software Engineer',
    overall: '7.5',
    subscores: 'L 8.5 • R 8.0 • W 7.0 • S 7.0',
    streak: 24
  }
];

interface StageConfig {
  code: string;
  band: string;
  titleVi: string;
  titleEn: string;
  subVi: string;
  subEn: string;
  cefrLevels: CefrLevel[];
  wordCount: number;
}

const PROGRESSIVE_STAGES: StageConfig[] = [
  {
    code: 'CHẶNG 01',
    band: 'Band 4.0 → 5.0',
    titleVi: 'Khởi Động Nền Tảng Cốt Lõi',
    titleEn: 'Core Lexical Foundation',
    subVi: 'Từ vựng A1–B1 thông dụng, phát âm UK/US chuẩn & câu đơn.',
    subEn: 'Essential A1–B1 vocabulary, UK/US phonetics & core sentences.',
    cefrLevels: ['A1', 'A2', 'B1'],
    wordCount: 1850
  },
  {
    code: 'CHẶNG 02',
    band: 'Band 5.0 → 6.0',
    titleVi: 'Tăng Tốc Phản Xạ Chủ Đề',
    titleEn: 'Thematic Fluency Acceleration',
    subVi: 'Từ vựng B1–B2 theo 19 chủ đề IELTS & phản xạ nghe chép.',
    subEn: 'B1–B2 topic vocabulary across 19 IELTS themes & dictation.',
    cefrLevels: ['B1', 'B2'],
    wordCount: 2640
  },
  {
    code: 'CHẶNG 03',
    band: 'Band 6.0 → 7.0',
    titleVi: 'Bứt Phá Học Thuật Chuyên Sâu',
    titleEn: 'Academic Mastery & Paraphrase',
    subVi: 'Từ vựng B2–C1 học thuật, Reading 538 & Listening 179.',
    subEn: 'B2–C1 academic lexicon, 538 Reading & 179 Listening synonyms.',
    cefrLevels: ['B2', 'C1'],
    wordCount: 3820
  },
  {
    code: 'CHẶNG 04',
    band: 'Band 7.0 → 8.0+',
    titleVi: 'Tinh Hoa C1–C2 & Thực Chiến 4 Kỹ Năng',
    titleEn: 'C1–C2 Lexical Precision & Full Mock',
    subVi: 'Từ vựng C1–C2 nâng cao, 100 cấu trúc Writing 7.5+ & Phòng thi AI.',
    subEn: 'Advanced C1–C2 vocabulary, 100 Writing 7.5+ structures & AI Exam.',
    cefrLevels: ['C1', 'C2'],
    wordCount: 2662
  }
];

function FlagUkSvg() {
  return (
    <svg
      className="w-3.5 h-3.5 rounded-xs shrink-0"
      viewBox="0 0 60 30"
      aria-hidden="true"
    >
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3" />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function FlagUsSvg() {
  return (
    <svg
      className="w-3.5 h-3.5 rounded-xs shrink-0"
      viewBox="0 0 60 30"
      aria-hidden="true"
    >
      <rect width="60" height="30" fill="#B22234" />
      <path
        d="M0,4.6 h60 M0,11.5 h60 M0,18.4 h60 M0,25.3 h60"
        stroke="#FFFFFF"
        strokeWidth="2.3"
      />
      <rect width="26" height="16" fill="#3C3B6E" />
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
  // Language & View Mode
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeUser, setActiveUser] = useState<Omit<
    PlatformUser,
    'passwordHash'
  > | null>(null);
  const [forceLandingPreview, setForceLandingPreview] = useState(false);

  // Quick Auth Form on Landing Page
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('hocvien@theieltsdictionary.vn');
  const [authPassword, setAuthPassword] = useState('123456');
  const [authTargetBand, setAuthTargetBand] = useState('Band 7.5+');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Step-by-Step Workspace Navigation (Only 1 Step rendered at a time!)
  const [workspaceStep, setWorkspaceStep] =
    useState<WorkspaceStep>('step1_roadmap');
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [activeLessonId, setActiveLessonId] = useState<string>('stage-0-lesson-0');
  const [completedLessons, setCompletedLessons] = useState<string[]>([
    'stage-0-lesson-0'
  ]);

  // Vocabulary & FSRS State
  const [studyMode, setStudyMode] = useState<StudyMode>('see_hear');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [fsrsRecords, setFsrsRecords] = useState<
    Record<string, FsrsCardRecord>
  >({});
  const [streakDays, setStreakDays] = useState<number>(14);
  const [reviewedToday, setReviewedToday] = useState<number>(18);
  const [userXp, setUserXp] = useState<number>(14250);
  const [notebookWords, setNotebookWords] = useState<string[]>([
    'ubiquitous',
    'mitigate',
    'unprecedented',
    'viable'
  ]);

  // Interactive Study Mode Inputs
  const [clozeInput, setClozeInput] = useState<string>('');
  const [dictationInput, setDictationInput] = useState<string>('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(
    null
  );

  // Step 5 Dictionary Explorer State
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedCefr, setSelectedCefr] = useState<CefrLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [apiWords, setApiWords] =
    useState<WordAtlasEntry[]>(initialPriorityWords);
  const [totalMatches, setTotalMatches] = useState<number>(7298);
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(false);

  // Load persisted state
  useEffect(() => {
    try {
      const savedFsrs = localStorage.getItem(STORAGE_FSRS_KEY);
      if (savedFsrs) setFsrsRecords(JSON.parse(savedFsrs));
      const savedStreak = localStorage.getItem(STORAGE_STREAK_KEY);
      if (savedStreak) {
        const parsed = JSON.parse(savedStreak);
        if (parsed.streakDays) setStreakDays(parsed.streakDays);
        if (parsed.reviewedToday) setReviewedToday(parsed.reviewedToday);
        if (parsed.userXp) setUserXp(parsed.userXp);
      }
      const savedUser = localStorage.getItem(STORAGE_USER_KEY);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setActiveUser(parsedUser);
        if (parsedUser.xp) setUserXp(parsedUser.xp);
        if (parsedUser.streak) setStreakDays(parsedUser.streak);
      }
      const savedNotebook = localStorage.getItem(STORAGE_NOTEBOOK_KEY);
      if (savedNotebook) {
        setNotebookWords(JSON.parse(savedNotebook));
      }
      const savedLessons = localStorage.getItem(STORAGE_COMPLETED_LESSONS_KEY);
      if (savedLessons) {
        setCompletedLessons(JSON.parse(savedLessons));
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Build progressive lessons for the selected Stage (6 bite-sized lessons per Stage, 12 words each)
  const stageLessons = useMemo(() => {
    const stage = PROGRESSIVE_STAGES[selectedStageIdx] || PROGRESSIVE_STAGES[0];
    const stageWords = initialPriorityWords.filter((w) =>
      stage.cefrLevels.includes(w.cefr)
    );
    const fallbackPool =
      stageWords.length >= 24 ? stageWords : initialPriorityWords;

    const lessonCount = 6;
    const wordsPerLesson = 12;

    return Array.from({ length: lessonCount }, (_, idx) => {
      const start = (idx * wordsPerLesson) % Math.max(1, fallbackPool.length);
      const slice: WordAtlasEntry[] = [];
      for (let i = 0; i < wordsPerLesson; i++) {
        slice.push(fallbackPool[(start + i) % fallbackPool.length]);
      }
      const topicObj = topics[(selectedStageIdx * 4 + idx) % topics.length];
      const lessonId = `stage-${selectedStageIdx}-lesson-${idx}`;
      return {
        id: lessonId,
        lessonNo: idx + 1,
        titleVi: `Bài ${idx + 1}: ${topicObj?.vi || 'Từ Vựng Học Thuật Trọng Tâm'}`,
        titleEn: `Lesson ${idx + 1}: ${topicObj?.en || 'Core Academic Lexicon'}`,
        topicCode: topicObj?.id || 'education',
        cefrBadge: stage.cefrLevels.join(' / '),
        words: slice
      };
    });
  }, [selectedStageIdx, initialPriorityWords, topics]);

  const currentLesson = useMemo(() => {
    return (
      stageLessons.find((l) => l.id === activeLessonId) || stageLessons[0]
    );
  }, [stageLessons, activeLessonId]);

  const activeLessonWords = useMemo(() => {
    return currentLesson?.words?.length
      ? currentLesson.words
      : initialPriorityWords.slice(0, 12);
  }, [currentLesson, initialPriorityWords]);

  const activeWord = useMemo(() => {
    if (!activeLessonWords.length) return initialPriorityWords[0];
    return activeLessonWords[currentWordIndex % activeLessonWords.length];
  }, [activeLessonWords, currentWordIndex, initialPriorityWords]);

  const activeCardRecord = useMemo(() => {
    if (!activeWord) return undefined;
    return fsrsRecords[activeWord.id];
  }, [activeWord, fsrsRecords]);

  const intervalPreviews = useMemo(
    () => getIntervalPreviews(activeCardRecord),
    [activeCardRecord]
  );

  // 4-Option Multiple Choice Quiz Generator
  const mcqOptions = useMemo(() => {
    if (!activeWord) return [];
    const correctMeaning = activeWord.vi || activeWord.en;
    const distractors = initialPriorityWords
      .filter((w) => w.id !== activeWord.id && (w.vi || w.en))
      .slice(
        (currentWordIndex * 3) % Math.max(1, initialPriorityWords.length - 4),
        ((currentWordIndex * 3) %
          Math.max(1, initialPriorityWords.length - 4)) +
          3
      )
      .map((w) => w.vi || w.en);

    while (distractors.length < 3) {
      distractors.push(
        'Sự phát triển bền vững và cân bằng hệ sinh thái đô thị.'
      );
    }

    const combined = [correctMeaning, ...distractors.slice(0, 3)];
    return combined.sort(
      (a, b) =>
        ((a.length * 7 + activeWord.w.length) % 11) -
        ((b.length * 7 + activeWord.w.length) % 11)
    );
  }, [activeWord, initialPriorityWords, currentWordIndex]);

  // Fetch filtered words for Step 5 Dictionary
  useEffect(() => {
    if (workspaceStep !== 'step5_dictionary') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsLoadingWords(true);
      try {
        const params = new URLSearchParams();
        if (selectedTopic !== 'all') params.set('topic', selectedTopic);
        if (selectedCefr !== 'ALL') params.set('cefr', selectedCefr);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        params.set('limit', '16');

        const res = await fetch(`/api/atlas?${params.toString()}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setApiWords(data.items);
          setTotalMatches(data.total);
        }
      } catch {
        // ignore abort
      } finally {
        setIsLoadingWords(false);
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [workspaceStep, selectedTopic, selectedCefr, searchQuery]);

  // Save or remove word from Personal Vocabulary Notebook
  const toggleSaveToNotebook = useCallback((wordStr: string) => {
    const clean = wordStr.trim();
    if (!clean) return;
    setNotebookWords((prev) => {
      const exists = prev.some(
        (w) => w.toLowerCase() === clean.toLowerCase()
      );
      const next = exists
        ? prev.filter((w) => w.toLowerCase() !== clean.toLowerCase())
        : [clean, ...prev];
      try {
        localStorage.setItem(STORAGE_NOTEBOOK_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const addWordToNotebook = useCallback((wordStr: string) => {
    const clean = wordStr.trim();
    if (!clean) return;
    setNotebookWords((prev) => {
      if (prev.some((w) => w.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      const next = [clean, ...prev];
      try {
        localStorage.setItem(STORAGE_NOTEBOOK_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Rate FSRS Card & Advance to Next Word in the Lesson
  const handleRateCard = useCallback(
    (grade: 'again' | 'hard' | 'good' | 'easy') => {
      if (!activeWord) return;
      const updated = gradeFsrsCard(activeWord.id, grade, activeCardRecord);
      const nextRecords = { ...fsrsRecords, [activeWord.id]: updated };
      setFsrsRecords(nextRecords);

      const xpGain =
        grade === 'easy'
          ? 25
          : grade === 'good'
            ? 20
            : grade === 'hard'
              ? 10
              : 5;
      const nextReviewed = reviewedToday + 1;
      const nextXp = userXp + xpGain;

      setReviewedToday(nextReviewed);
      setUserXp(nextXp);
      setClozeInput('');
      setDictationInput('');
      setSelectedMcqOption(null);

      // If at end of 12-word lesson, mark lesson completed!
      if (
        currentLesson &&
        currentWordIndex + 1 >= activeLessonWords.length &&
        !completedLessons.includes(currentLesson.id)
      ) {
        const nextDone = [...completedLessons, currentLesson.id];
        setCompletedLessons(nextDone);
        try {
          localStorage.setItem(
            STORAGE_COMPLETED_LESSONS_KEY,
            JSON.stringify(nextDone)
          );
        } catch {
          // ignore
        }
      }

      setCurrentWordIndex((prev) => (prev + 1) % activeLessonWords.length);

      try {
        localStorage.setItem(STORAGE_FSRS_KEY, JSON.stringify(nextRecords));
        localStorage.setItem(
          STORAGE_STREAK_KEY,
          JSON.stringify({
            streakDays,
            reviewedToday: nextReviewed,
            userXp: nextXp
          })
        );
      } catch {
        // ignore
      }
    },
    [
      activeWord,
      activeCardRecord,
      fsrsRecords,
      reviewedToday,
      userXp,
      streakDays,
      currentLesson,
      currentWordIndex,
      activeLessonWords.length,
      completedLessons
    ]
  );

  // Keyboard shortcuts 1-4 in Step 2 Vocabulary
  useEffect(() => {
    if (workspaceStep !== 'step2_vocab') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === '1') handleRateCard('again');
      if (e.key === '2') handleRateCard('hard');
      if (e.key === '3') handleRateCard('good');
      if (e.key === '4') handleRateCard('easy');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [workspaceStep, handleRateCard]);

  // Quick Login Handlers on Landing Page
  const handleQuickAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          name: authName,
          email: authEmail,
          password: authPassword,
          targetBand: authTargetBand
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Đăng nhập không thành công');
      } else if (data.user) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        setActiveUser(data.user);
        setForceLandingPreview(false);
        setWorkspaceStep('step1_roadmap');
      }
    } catch {
      setAuthError('Lỗi kết nối máy chủ.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOneClickLogin = async (
    email: string,
    name: string,
    isGoogle = false
  ) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGoogle
            ? { action: 'google', email, name }
            : { action: 'login', email, password: '123' }
        )
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        setActiveUser(data.user);
        setForceLandingPreview(false);
        setWorkspaceStep('step1_roadmap');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    setActiveUser(null);
    setForceLandingPreview(false);
  };

  // Start a specific lesson from Step 1 -> transitions to Step 2
  const handleStartLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setCurrentWordIndex(0);
    setClozeInput('');
    setDictationInput('');
    setSelectedMcqOption(null);
    setWorkspaceStep('step2_vocab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Send a specific word to Step 2 FSRS
  const handleQueueWordToFsrs = (wordStr: string) => {
    const clean = wordStr.trim().toLowerCase();
    addWordToNotebook(wordStr);
    const idx = activeLessonWords.findIndex(
      (w) => w.w.toLowerCase() === clean
    );
    if (idx !== -1) {
      setCurrentWordIndex(idx);
    }
    setWorkspaceStep('step2_vocab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const exampleSentence = activeWord?.ex?.[0]?.en || '';
  const clozeSentence = useMemo(() => {
    if (!activeWord || !exampleSentence) return '';
    const regex = new RegExp(`\\b${activeWord.w}\\b`, 'gi');
    if (regex.test(exampleSentence)) {
      return exampleSentence.replace(regex, '________');
    }
    return `${exampleSentence} (Target: ________)`;
  }, [activeWord, exampleSentence]);

  const isClozeCorrect =
    activeWord &&
    clozeInput.trim().toLowerCase() === activeWord.w.toLowerCase();
  const isDictationCorrect =
    activeWord &&
    dictationInput.trim().toLowerCase() === activeWord.w.toLowerCase();
  const isSavedInNotebook =
    activeWord &&
    notebookWords.some((w) => w.toLowerCase() === activeWord.w.toLowerCase());

  const showLandingPage = !activeUser || forceLandingPreview;

  // ============================================================================
  // VIEW 1: CLEAN MAGIC UI COMMERCIAL LANDING PAGE (BEFORE LOGIN)
  // ============================================================================
  if (showLandingPage) {
    return (
      <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-12">
          {/* Clean Commercial Header */}
          <header className="bg-[#FFFFFF] rounded-2xl px-5 py-3.5 border border-[#DCEBFA] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display font-black text-sm">
                YP
              </span>
              <div>
                <span className="font-display text-lg font-black tracking-tight text-[#0F172A]">
                  YOUPASS × WORD ATLAS 4.0
                </span>
                <span className="hidden sm:inline-block ml-2.5 px-2.5 py-0.5 rounded-full bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                  STEP-BY-STEP IELTS STUDIO
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'VI / EN' : 'EN / VI'}</span>
              </button>

              <Link
                href="/pricing"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] font-display text-xs font-bold transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Gói PRO / VIP' : 'PRO / VIP Plans'}</span>
              </Link>

              {activeUser ? (
                <button
                  type="button"
                  onClick={() => setForceLandingPreview(false)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                >
                  <span>Quay Lại Lộ Trình Đang Học →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleOneClickLogin(
                      'hocvien@theieltsdictionary.vn',
                      'Nguyễn Minh Anh (VIP)'
                    )
                  }
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                >
                  <span>
                    {lang === 'vi' ? 'Vào Học Ngay (1-Chạm)' : 'Start Now (1-Click)'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </header>

          {/* Hero Section: Left Value Prop & 4-Stage Beam + Right Quick Login Card */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Progressive Value Proposition */}
            <BlurFade delay={0.05} className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {lang === 'vi'
                    ? 'PHƯƠNG PHÁP HỌC TỪ TỪ TỪNG BƯỚC • KHÔNG NHỒI NHÉT QUÁ TẢI'
                    : 'STEP-BY-STEP ADAPTIVE LEARNING • ZERO INFORMATION OVERLOAD'}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F172A] leading-tight">
                {lang === 'vi'
                  ? 'Chinh Phục IELTS 4.0 → 8.0+ Theo Lộ Trình Từng Bài Nhỏ Mỗi Ngày.'
                  : 'Master IELTS 4.0 → 8.0+ Through Bite-Sized Daily Lessons.'}
              </h1>

              <p className="text-base text-[#334155] leading-relaxed max-w-2xl">
                {lang === 'vi'
                  ? 'Thay vì hiển thị hàng nghìn từ vựng gây rối mắt, hệ thống chia nhỏ 10,972 từ vựng học thuật (Word-Atlas & My-IELTS) thành 4 Chặng Band điểm rõ ràng. Đăng nhập để mở khóa từng bài học 12 từ vựng, nghe chép chính tả và luyện phòng thi 4 kỹ năng.'
                  : 'Instead of overwhelming you with thousands of words at once, our studio divides 10,972 academic words into 4 progressive Band stages. Log in to unlock 12-word daily lessons, dictation drills, and 4-skill mock exams.'}
              </p>

              {/* Magic UI NumberTicker Telemetry Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                  <div className="font-display text-2xl font-black text-[#0284C7]">
                    <NumberTicker value={10972} />
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {lang === 'vi' ? 'Từ vựng chia theo Band' : 'Curated IELTS Words'}
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                  <div className="font-display text-2xl font-black text-[#059669]">
                    <NumberTicker value={22905} />
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {lang === 'vi' ? 'Audio chuẩn UK / US' : 'UK / US Audio Clips'}
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                  <div className="font-display text-2xl font-black text-[#0F172A]">
                    <NumberTicker value={4} suffix=" Chặng" />
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {lang === 'vi' ? 'Lộ trình từ 4.0 → 8.0+' : 'Progressive Stages'}
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                  <div className="font-display text-2xl font-black text-[#D97706]">
                    <NumberTicker value={94.2} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    {lang === 'vi' ? 'Tỉ lệ nhớ thuật toán FSRS' : 'FSRS Retention Rate'}
                  </div>
                </div>
              </div>

              {/* Preview of the 4 Progressive Stages with Magic UI AnimatedRoadmapBeam */}
              <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-extrabold text-[#0F172A]">
                    {lang === 'vi'
                      ? 'SƠ ĐỒ 4 CHẶNG LỘ TRÌNH HỌC TỪ TỪ (BẤM ĐỂ XEM TRƯỚC)'
                      : '4-STAGE PROGRESSIVE LEARNING PATH'}
                  </span>
                  <span className="font-mono-data text-xs text-[#0284C7] font-bold">
                    Band 4.0 → 8.0+
                  </span>
                </div>

                <AnimatedRoadmapBeam
                  stages={PROGRESSIVE_STAGES.map((s) => ({
                    code: s.code,
                    band: s.band,
                    title: lang === 'vi' ? s.titleVi : s.titleEn,
                    sub: lang === 'vi' ? s.subVi : s.subEn,
                    wordCount: s.wordCount
                  }))}
                  activeStageIndex={selectedStageIdx}
                  onSelectStage={(idx) => setSelectedStageIdx(idx)}
                />
              </div>
            </BlurFade>

            {/* Right 5 Columns: Magic UI BorderBeam Login & Instant Access Card */}
            <BlurFade delay={0.15} className="lg:col-span-5">
              <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#BAE6FD] shadow-sm space-y-5 overflow-hidden">
                <BorderBeam duration={7} />

                <div className="flex items-center justify-between pb-4 border-b border-[#DCEBFA]">
                  <div>
                    <h2 className="font-display text-lg font-black text-[#0F172A]">
                      {lang === 'vi'
                        ? 'ĐĂNG NHẬP VÀO LỘ TRÌNH HỌC'
                        : 'SIGN IN TO YOUR LEARNING PATH'}
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {lang === 'vi'
                        ? 'Lưu tiến độ từng bài học, chuỗi ngày Streak & Sổ từ vựng.'
                        : 'Save your daily lesson progress, streak & vocabulary notebook.'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                    FREE & VIP
                  </span>
                </div>

                {/* 1-Click Instant Access Buttons */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() =>
                      handleOneClickLogin(
                        'google.scholar@gmail.com',
                        'Trần Hoàng Minh (Google VIP)',
                        true
                      )
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0F172A] border border-[#BAE6FD] font-display text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.9C3.5 21.4 7.4 24 12 24z"
                      />
                    </svg>
                    <span>
                      {lang === 'vi'
                        ? 'Tiếp Tục Nhanh Bằng Google OAuth 2.0'
                        : 'Continue Instantly with Google OAuth'}
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() =>
                        handleOneClickLogin(
                          'hocvien@theieltsdictionary.vn',
                          'Nguyễn Minh Anh (VIP)'
                        )
                      }
                      className="py-2.5 px-3 rounded-xl bg-[#ECFDF5] hover:bg-[#A7F3D0] border border-[#A7F3D0] text-[#047857] font-mono-data text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Vào Nhanh Học Viên VIP</span>
                    </button>

                    <button
                      type="button"
                      disabled={authLoading}
                      onClick={() =>
                        handleOneClickLogin(
                          'admin@theieltsdictionary.vn',
                          'Admin Quản Trị'
                        )
                      }
                      className="py-2.5 px-3 rounded-xl bg-[#F8FBFF] hover:bg-[#E0F2FE] border border-[#DCEBFA] text-[#0284C7] font-mono-data text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Vào Nhanh Admin</span>
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="grow border-t border-[#DCEBFA]" />
                  <span className="shrink mx-3 text-xs font-mono-data text-[#64748B]">
                    {lang === 'vi' ? 'HOẶC TÀI KHOẢN EMAIL' : 'OR EMAIL ACCOUNT'}
                  </span>
                  <div className="grow border-t border-[#DCEBFA]" />
                </div>

                {/* Mode Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#F0F7FF] border border-[#DCEBFA]">
                  <button
                    type="button"
                    onClick={() => setAuthMode('login')}
                    className={`py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer ${
                      authMode === 'login'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'text-[#334155]'
                    }`}
                  >
                    {lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('register')}
                    className={`py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer ${
                      authMode === 'register'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'text-[#334155]'
                    }`}
                  >
                    {lang === 'vi' ? 'Tạo Tài Khoản Mới' : 'Create Account'}
                  </button>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#E11D48] font-medium">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleQuickAuthSubmit} className="space-y-3">
                  {authMode === 'register' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                          HỌ VÀ TÊN
                        </label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Nguyễn Văn A..."
                          className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3 py-2 text-xs text-[#0F172A]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                          MỤC TIÊU BAND
                        </label>
                        <select
                          value={authTargetBand}
                          onChange={(e) => setAuthTargetBand(e.target.value)}
                          className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3 py-2 text-xs text-[#0F172A]"
                        >
                          <option>Band 6.5+</option>
                          <option>Band 7.0+</option>
                          <option>Band 7.5+</option>
                          <option>Band 8.0+</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                      EMAIL HỌC VIÊN
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                      MẬT KHẨU
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-sm font-extrabold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {authLoading
                        ? 'Đang mở lộ trình học...'
                        : authMode === 'login'
                          ? 'Đăng Nhập & Bắt Đầu Học Theo Lộ Trình'
                          : 'Tạo Tài Khoản & Mở Khóa Chặng 1'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </BlurFade>
          </section>

          {/* 3 Clean Step-by-Step Pillars (Showing Why Progressive Learning Works) */}
          <BlurFade delay={0.2}>
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-extrabold">
                    BƯỚC 01 / CHỌN BÀI THEO NGÀY
                  </span>
                  <Compass className="w-5 h-5 text-[#0284C7]" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Học Từng Bài Nhỏ 12 Từ — Không Bị Ngợp
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  Sau khi đăng nhập, bạn chỉ nhìn thấy chặng đường của mình và danh sách các bài học nhỏ theo thứ tự (Bài 1 → Bài 2 → Bài 3). Học xong bài nào hệ thống đánh dấu hoàn thành bài đó.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-[#ECFDF5] text-[#059669] font-mono-data text-xs font-extrabold">
                    BƯỚC 02 / FLASHCARD FSRS & DICTATION
                  </span>
                  <Layers className="w-5 h-5 text-[#059669]" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  4 Chế Độ Tương Tác Đa Giác Quan
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  Mỗi từ vựng đều có hình ảnh minh họa, phát âm chuẩn UK/US, trắc nghiệm 4 đáp án, điền từ vào câu (Cloze) và nghe chép chính tả (Dictation) để nhớ sâu gấp 3 lần.
                </p>
              </div>

              <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-lg bg-[#FFFBEB] text-[#D97706] font-mono-data text-xs font-extrabold">
                    BƯỚC 03 / PHÒNG THI 4 KỸ NĂNG
                  </span>
                  <Award className="w-5 h-5 text-[#D97706]" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Áp Dụng Vào Bài Thi Thực Tế & AI Chấm Bài
                </h3>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  Khi đã nắm vững từ vựng trong ngày, bạn chuyển sang Bước Phòng Thi để luyện Reading (bấm tra từ trực tiếp trong bài đọc), Listening và AI chấm Writing 4 tiêu chí.
                </p>
              </div>
            </section>
          </BlurFade>

          {/* Magic UI Marquee: Hall of Fame & Live Word Preview */}
          <section className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base sm:text-lg font-extrabold text-[#0F172A]">
                {lang === 'vi'
                  ? 'BẢNG VÀNG HỌC VIÊN ĐẠT BAND 7.5 – 8.5 NHỜ LỘ TRÌNH TỪNG BƯỚC'
                  : 'HALL OF FAME: STUDENTS ACHIEVING BAND 7.5 – 8.5'}
              </h2>
              <span className="font-mono-data text-xs text-[#059669] font-bold">
                VERIFIED IDP / BC SCORES
              </span>
            </div>

            <Marquee>
              {HALL_OF_FAME.map((st, idx) => (
                <div
                  key={idx}
                  className="w-80 p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      {st.name}
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      {lang === 'vi' ? st.roleVi : st.roleEn}
                    </div>
                    <div className="font-mono-data text-xs text-[#059669] font-bold mt-1">
                      {st.subscores}
                    </div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-[#0284C7] text-[#FFFFFF] text-center shrink-0">
                    <div className="font-mono-data text-xs">IELTS</div>
                    <div className="font-display text-xl font-black">
                      {st.overall}
                    </div>
                  </div>
                </div>
              ))}
            </Marquee>
          </section>

          {/* Clean Footer */}
          <footer className="pt-4 pb-8 border-t border-[#DCEBFA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
            <div>
              © 2026 YOUPASS × WORD ATLAS 4.0 — Hệ Sinh Thái Luyện Thi IELTS Từng Bước.
            </div>
            <div className="flex items-center gap-4">
              <Link href="/roadmap" className="hover:text-[#0284C7]">
                Lộ trình 12 tuần
              </Link>
              <Link href="/pricing" className="hover:text-[#0284C7]">
                Nâng cấp VIP VietQR
              </Link>
              <Link href="/admin" className="hover:text-[#0284C7]">
                Admin CMS
              </Link>
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: LOGGED-IN PROGRESSIVE STEP-BY-STEP WORKSPACE (1 FOCUSED STEP AT A TIME)
  // ============================================================================
  const WORKSPACE_STEPS: {
    id: WorkspaceStep;
    stepNo: string;
    labelVi: string;
    labelEn: string;
    descVi: string;
  }[] = [
    {
      id: 'step1_roadmap',
      stepNo: 'BƯỚC 01',
      labelVi: 'Lộ Trình & Chọn Bài Học',
      labelEn: 'Roadmap & Daily Lessons',
      descVi: 'Chọn chặng Band & bài học 12 từ hôm nay'
    },
    {
      id: 'step2_vocab',
      stepNo: 'BƯỚC 02',
      labelVi: 'Học Từ Vựng Bài Đang Chọn',
      labelEn: 'Active Lesson Vocabulary',
      descVi: `${currentLesson?.titleVi || 'Bài 1'} (12 từ)`
    },
    {
      id: 'step3_dictation',
      stepNo: 'BƯỚC 03',
      labelVi: 'Nghe Chép & Đồng Nghĩa',
      labelEn: 'Dictation & Synonyms',
      descVi: 'Luyện 22 Chuyên đề & Paraphrase'
    },
    {
      id: 'step4_exam',
      stepNo: 'BƯỚC 04',
      labelVi: 'Phòng Thi 4 Kỹ Năng',
      labelEn: '4-Skill Exam Simulator',
      descVi: 'Reading • Listening • Writing AI'
    },
    {
      id: 'step5_dictionary',
      stepNo: 'BƯỚC 05',
      labelVi: `Từ Điển & Sổ Tay (${notebookWords.length})`,
      labelEn: `Dictionary & Notebook (${notebookWords.length})`,
      descVi: 'Tra cứu 7,298 từ & Sổ từ vựng'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6">
        {/* Top Workspace Header */}
        <header className="bg-[#FFFFFF] rounded-2xl px-5 py-3.5 border border-[#DCEBFA] shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display font-black text-sm">
              YP
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg font-black text-[#0F172A]">
                  YOUPASS × WORD ATLAS 4.0
                </span>
                <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                  {activeUser.role.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-[#64748B]">
                Học viên: <strong className="text-[#0F172A]">{activeUser.name}</strong> • Mục tiêu:{' '}
                <strong className="text-[#0284C7]">{activeUser.targetBand}</strong>
              </p>
            </div>
          </div>

          {/* Right User Telemetry & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-mono-data text-xs font-bold">
              <Flame className="w-3.5 h-3.5" />
              <span>{streakDays} ngày Streak</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{userXp.toLocaleString()} XP</span>
            </div>

            <button
              type="button"
              onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
              className="px-2.5 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-[#334155] font-mono-data text-xs font-bold cursor-pointer"
            >
              {lang === 'vi' ? 'VI / EN' : 'EN / VI'}
            </button>

            <button
              type="button"
              onClick={() => setForceLandingPreview(true)}
              className="px-3 py-1.5 rounded-xl bg-[#F8FBFF] hover:bg-[#E0F2FE] border border-[#DCEBFA] text-[#334155] font-mono-data text-xs font-bold cursor-pointer"
            >
              Xem Landing Page
            </button>

            <Link
              href="/pricing"
              className="px-3 py-1.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold"
            >
              Nâng Cấp VIP
            </Link>

            {activeUser.role === 'admin' && (
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-mono-data text-xs font-bold"
              >
                Admin CMS
              </Link>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] font-mono-data text-xs font-bold cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </header>

        {/* Progressive 5-Step Navigation Bar (Only 1 Step Active at a Time!) */}
        <nav
          aria-label="Lộ trình học 5 bước"
          className="bg-[#FFFFFF] rounded-2xl p-2 border border-[#DCEBFA] shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2"
        >
          {WORKSPACE_STEPS.map((st) => {
            const active = workspaceStep === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setWorkspaceStep(st.id)}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  active
                    ? 'bg-[#0284C7] text-[#FFFFFF] shadow-xs'
                    : 'bg-[#F8FBFF] hover:bg-[#F0F7FF] text-[#0F172A] border border-[#DCEBFA]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono-data text-xs font-extrabold px-2 py-0.5 rounded ${
                      active
                        ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                        : 'bg-[#E0F2FE] text-[#0284C7]'
                    }`}
                  >
                    {st.stepNo}
                  </span>
                  {active && (
                    <span className="font-mono-data text-xs text-[#E0F2FE]">
                      Đang mở
                    </span>
                  )}
                </div>
                <div className="font-display text-sm font-extrabold mt-2">
                  {lang === 'vi' ? st.labelVi : st.labelEn}
                </div>
                <div
                  className={`text-xs mt-0.5 truncate ${
                    active ? 'text-[#E0F2FE]' : 'text-[#64748B]'
                  }`}
                >
                  {st.descVi}
                </div>
              </button>
            );
          })}
        </nav>

        {/* ===================================================================== */}
        {/* STEP 1: PROGRESSIVE ROADMAP & DAILY LESSONS (DEFAULT UPON LOGIN)      */}
        {/* ===================================================================== */}
        {workspaceStep === 'step1_roadmap' && (
          <BlurFade key="step1" className="space-y-6">
            {/* Stage Selector with Magic UI AnimatedRoadmapBeam */}
            <section className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
                <div>
                  <h1 className="font-display text-xl sm:text-2xl font-black text-[#0F172A]">
                    {lang === 'vi'
                      ? 'BƯỚC 01 / CHỌN CHẶNG LỘ TRÌNH & BÀI HỌC HÔM NAY'
                      : 'STEP 01 / CHOOSE YOUR STAGE & DAILY LESSON'}
                  </h1>
                  <p className="text-xs sm:text-sm text-[#334155] mt-1">
                    {lang === 'vi'
                      ? 'Hãy hoàn thành lần lượt từng bài học (12 từ vựng/bài). Bấm vào một bài học bên dưới để chuyển sang Bước 02 bắt đầu học.'
                      : 'Complete one bite-sized lesson (12 words/lesson) at a time. Select any lesson below to enter Step 02.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                    Đã hoàn thành: {completedLessons.length} / 24 bài
                  </span>
                  <Link
                    href="/roadmap"
                    className="px-3.5 py-1.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold"
                  >
                    Làm Placement Test
                  </Link>
                </div>
              </div>

              <AnimatedRoadmapBeam
                stages={PROGRESSIVE_STAGES.map((s) => ({
                  code: s.code,
                  band: s.band,
                  title: lang === 'vi' ? s.titleVi : s.titleEn,
                  sub: lang === 'vi' ? s.subVi : s.subEn,
                  wordCount: s.wordCount
                }))}
                activeStageIndex={selectedStageIdx}
                onSelectStage={(idx) => setSelectedStageIdx(idx)}
              />
            </section>

            {/* 6 Bite-Sized Sequential Lessons for the Selected Stage */}
            <section className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCEBFA]">
                <div>
                  <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                    {PROGRESSIVE_STAGES[selectedStageIdx]?.code}:{' '}
                    {lang === 'vi'
                      ? PROGRESSIVE_STAGES[selectedStageIdx]?.titleVi
                      : PROGRESSIVE_STAGES[selectedStageIdx]?.titleEn}{' '}
                    — 6 Bài Học Theo Thứ Tự
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Mỗi bài học gồm 12 từ vựng chọn lọc cấp độ{' '}
                    <strong>
                      {PROGRESSIVE_STAGES[selectedStageIdx]?.cefrLevels.join(', ')}
                    </strong>{' '}
                    kèm phát âm UK/US và bài tập FSRS.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stageLessons.map((lesson) => {
                  const isDone = completedLessons.includes(lesson.id);
                  const isSelected = activeLessonId === lesson.id;
                  return (
                    <div
                      key={lesson.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-[#F0F7FF] border-[#0284C7]'
                          : isDone
                            ? 'bg-[#ECFDF5] border-[#A7F3D0]'
                            : 'bg-[#F8FBFF] border-[#DCEBFA] hover:border-[#BAE6FD]'
                      }`}
                    >
                      {isSelected && <BorderBeam duration={7} />}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                            BÀI 0{lesson.lessonNo} • 12 TỪ
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold ${
                              isDone
                                ? 'bg-[#059669] text-[#FFFFFF]'
                                : 'bg-[#E0F2FE] text-[#0284C7]'
                            }`}
                          >
                            {isDone ? 'Đã học xong' : lesson.cefrBadge}
                          </span>
                        </div>

                        <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                          {lang === 'vi' ? lesson.titleVi : lesson.titleEn}
                        </h3>

                        {/* Preview 4 sample words in this lesson */}
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          {lesson.words.slice(0, 5).map((w) => (
                            <span
                              key={w.id}
                              className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#DCEBFA] font-mono-data text-xs text-[#334155]"
                            >
                              {w.w}
                            </span>
                          ))}
                          <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                            +7 từ nữa
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartLesson(lesson.id)}
                        className={`w-full py-2.5 px-4 rounded-xl font-display text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-[#059669] hover:bg-[#047857] text-[#FFFFFF]'
                            : 'bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF]'
                        }`}
                      >
                        <span>
                          {isDone
                            ? 'Ôn Tập Lại Bài Này (Bước 02) →'
                            : 'Bắt Đầu Học Bài Này (Bước 02) →'}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </BlurFade>
        )}

        {/* ===================================================================== */}
        {/* STEP 2: FOCUSED DAILY LESSON VOCABULARY STUDIO (12 WORDS ONLY)        */}
        {/* ===================================================================== */}
        {workspaceStep === 'step2_vocab' && activeWord && (
          <BlurFade key="step2" className="max-w-4xl mx-auto space-y-5">
            {/* Lesson Progress Top Bar */}
            <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setWorkspaceStep('step1_roadmap')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Đổi Bài Học</span>
                </button>
                <div>
                  <div className="font-display text-sm sm:text-base font-extrabold text-[#0F172A]">
                    {lang === 'vi'
                      ? currentLesson?.titleVi
                      : currentLesson?.titleEn}
                  </div>
                  <div className="font-mono-data text-xs text-[#64748B]">
                    Từ {(currentWordIndex % activeLessonWords.length) + 1} /{' '}
                    {activeLessonWords.length} trong bài học này
                  </div>
                </div>
              </div>

              {/* 12-Word Step Dots */}
              <div className="flex items-center gap-1.5">
                {activeLessonWords.map((w, idx) => {
                  const isCurrent =
                    idx === currentWordIndex % activeLessonWords.length;
                  const isPassed =
                    idx < currentWordIndex % activeLessonWords.length;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setCurrentWordIndex(idx)}
                      title={w.w}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        isCurrent
                          ? 'w-7 bg-[#0284C7]'
                          : isPassed
                            ? 'w-2.5 bg-[#059669]'
                            : 'w-2.5 bg-[#DCEBFA]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Centered Focused Flashcard Studio */}
            <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#BAE6FD] shadow-sm space-y-6 overflow-hidden">
              <BorderBeam duration={8} />

              {/* 4 Interactive Study Mode Pills */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setStudyMode('see_hear')}
                    className={`px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      studyMode === 'see_hear'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA]'
                    }`}
                  >
                    1. Nghe & Nhìn
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode('quiz_mcq')}
                    className={`px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      studyMode === 'quiz_mcq'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA]'
                    }`}
                  >
                    2. Quiz 4 Đáp Án
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode('recall_cloze')}
                    className={`px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      studyMode === 'recall_cloze'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA]'
                    }`}
                  >
                    3. Điền Từ Cloze
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudyMode('dictation')}
                    className={`px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                      studyMode === 'dictation'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA]'
                    }`}
                  >
                    4. Nghe Chép Từ
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => toggleSaveToNotebook(activeWord.w)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold border transition-colors cursor-pointer ${
                    isSavedInNotebook
                      ? 'bg-[#ECFDF5] border-[#059669] text-[#059669]'
                      : 'bg-[#F0F7FF] border-[#BAE6FD] text-[#0284C7] hover:bg-[#0284C7] hover:text-[#FFFFFF]'
                  }`}
                >
                  {isSavedInNotebook ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      <span>Đã Lưu Sổ Từ Vựng</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>+ Lưu Sổ Từ Vựng</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Word Content + Image */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                <div className="md:col-span-7 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded font-mono-data text-xs font-bold ${
                        CEFR_BADGE_STYLE[activeWord.cefr]
                      }`}
                    >
                      CEFR {activeWord.cefr}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-[#F0F7FF] border border-[#DCEBFA] text-[#0284C7] font-mono-data text-xs font-bold">
                      {activeWord.pos} • {activeWord.topic.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0F172A]">
                    {studyMode === 'dictation' && !isDictationCorrect
                      ? '• • • • • • •'
                      : activeWord.w}
                  </h2>

                  {/* UK / US Audio Buttons */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        playPronunciation(
                          activeWord.audioUkUrl,
                          activeWord.w,
                          'en-GB'
                        )
                      }
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0F172A] hover:text-[#FFFFFF] border border-[#BAE6FD] font-mono-data text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FlagUkSvg />
                      <span>UK {activeWord.uk}</span>
                      <Volume2 className="w-3.5 h-3.5 text-[#0284C7] group-hover:text-[#FFFFFF]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        playPronunciation(
                          activeWord.audioUsUrl,
                          activeWord.w,
                          'en-US'
                        )
                      }
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0F172A] hover:text-[#FFFFFF] border border-[#BAE6FD] font-mono-data text-xs font-bold transition-colors cursor-pointer"
                    >
                      <FlagUsSvg />
                      <span>US {activeWord.us}</span>
                      <Volume2 className="w-3.5 h-3.5 text-[#0284C7]" />
                    </button>
                  </div>

                  {/* Mode-Specific Interactive Area */}
                  {studyMode === 'see_hear' && (
                    <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                      <div className="text-base font-bold text-[#0284C7]">
                        {activeWord.vi || activeWord.en}
                      </div>
                      <p className="text-xs sm:text-sm text-[#334155]">
                        {activeWord.en}
                      </p>
                    </div>
                  )}

                  {studyMode === 'quiz_mcq' && (
                    <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2.5">
                      <div className="font-mono-data text-xs font-bold text-[#0284C7] flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>CHỌN NGHĨA ĐÚNG CỦA TỪ &ldquo;{activeWord.w}&rdquo;:</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {mcqOptions.map((opt, i) => {
                          const isCorrectOpt =
                            opt === (activeWord.vi || activeWord.en);
                          const isChosen = selectedMcqOption === opt;
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedMcqOption(opt)}
                              className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                isChosen
                                  ? isCorrectOpt
                                    ? 'bg-[#ECFDF5] border-[#059669] text-[#047857] font-bold'
                                    : 'bg-[#FFF1F2] border-[#E11D48] text-[#E11D48] font-bold'
                                  : 'bg-[#FFFFFF] border-[#DCEBFA] text-[#0F172A] hover:bg-[#E0F2FE]'
                              }`}
                            >
                              <span>
                                {String.fromCharCode(65 + i)}. {opt}
                              </span>
                              {isChosen && isCorrectOpt && (
                                <Check className="w-4 h-4 text-[#059669] shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {studyMode === 'recall_cloze' && (
                    <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2.5">
                      <div className="text-xs font-bold text-[#0284C7]">
                        ĐIỀN TỪ TIẾNG ANH TƯƠNG ỨNG VỚI NGHĨA: &ldquo;
                        {activeWord.vi || activeWord.en}&rdquo;
                      </div>
                      <p className="text-xs text-[#334155] italic">
                        &ldquo;{clozeSentence}&rdquo;
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={clozeInput}
                          onChange={(e) => setClozeInput(e.target.value)}
                          placeholder={`Gõ từ bắt đầu bằng "${activeWord.w[0]}"...`}
                          className={`flex-1 px-3.5 py-2 rounded-xl border font-mono-data text-sm ${
                            isClozeCorrect
                              ? 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold'
                              : 'bg-[#FFFFFF] border-[#BAE6FD] text-[#0F172A]'
                          }`}
                        />
                        {isClozeCorrect && (
                          <span className="px-3 py-2 rounded-xl bg-[#059669] text-[#FFFFFF] font-mono-data text-xs font-bold">
                            Chính xác!
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {studyMode === 'dictation' && (
                    <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2.5">
                      <div className="text-xs font-bold text-[#0284C7]">
                        BẤM LOA NGHE PHÁT ÂM VÀ GÕ LẠI CHÍNH XÁC TỪ VỰNG:
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={dictationInput}
                          onChange={(e) => setDictationInput(e.target.value)}
                          placeholder="Gõ từ bạn nghe được..."
                          className={`flex-1 px-3.5 py-2 rounded-xl border font-mono-data text-sm ${
                            isDictationCorrect
                              ? 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold'
                              : 'bg-[#FFFFFF] border-[#BAE6FD] text-[#0F172A]'
                          }`}
                        />
                        {isDictationCorrect && (
                          <span className="px-3 py-2 rounded-xl bg-[#059669] text-[#FFFFFF] font-mono-data text-xs font-bold">
                            Chuẩn xác!
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contextual Example */}
                  {activeWord.ex?.[0] && (
                    <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#DCEBFA] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                          VÍ DỤ NGỮ CẢNH HỌC THUẬT
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            playPronunciation(
                              activeWord.audioExUrl,
                              activeWord.ex[0].en,
                              'en-GB'
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs font-mono-data text-[#0284C7] font-bold cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Nghe câu</span>
                        </button>
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-[#0F172A]">
                        &ldquo;{activeWord.ex[0].en}&rdquo;
                      </p>
                      {activeWord.ex[0].vi && (
                        <p className="text-xs text-[#334155]">
                          → {activeWord.ex[0].vi}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right 5 Columns: Illustration & Collocations */}
                <div className="md:col-span-5 space-y-3">
                  <div className="rounded-xl overflow-hidden border border-[#DCEBFA] bg-[#F8FBFF] aspect-4/3">
                    <img
                      src={activeWord.imgUrl}
                      alt={activeWord.w}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {activeWord.col?.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                      <div className="font-mono-data text-xs font-bold text-[#64748B]">
                        CỤM TỪ ĐI KÈM (COLLOCATIONS)
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeWord.col.slice(0, 4).map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] font-mono-data text-xs text-[#0284C7] font-bold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 4 FSRS Rating Buttons */}
              <div className="pt-4 border-t border-[#DCEBFA] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#64748B]">
                  <span className="inline-flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5 text-[#0284C7]" />
                    <span>
                      CHẤM MỨC NHỚ ĐỂ QUA TỪ TIẾP THEO (PHÍM TẮT 1 – 4):
                    </span>
                  </span>
                  <span>
                    Từ {(currentWordIndex % activeLessonWords.length) + 1} /{' '}
                    {activeLessonWords.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleRateCard('again')}
                    className="py-3 px-3 rounded-xl bg-[#FFF1F2] hover:bg-[#E11D48] text-[#E11D48] hover:text-[#FFFFFF] border border-[#FECDD3] font-display text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>[1] Học Lại</span>
                    <span className="font-mono-data">{intervalPreviews.again}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard('hard')}
                    className="py-3 px-3 rounded-xl bg-[#FFFBEB] hover:bg-[#D97706] text-[#B45309] hover:text-[#FFFFFF] border border-[#FDE68A] font-display text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>[2] Hơi Khó</span>
                    <span className="font-mono-data">{intervalPreviews.hard}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard('good')}
                    className="py-3 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>[3] Nhớ Tốt</span>
                    <span className="font-mono-data">{intervalPreviews.good}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRateCard('easy')}
                    className="py-3 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>[4] Quá Dễ</span>
                    <span className="font-mono-data">{intervalPreviews.easy}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Progressive Next-Step Footer Bar */}
            <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setWorkspaceStep('step1_roadmap')}
                className="inline-flex items-center gap-2 text-xs font-display font-bold text-[#334155] hover:text-[#0284C7] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Bước 01 (Danh sách bài học)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkspaceStep('step3_dictation');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                <span>Chuyển Sang Bước 03: Luyện Nghe Chép & Paraphrase</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </BlurFade>
        )}

        {/* ===================================================================== */}
        {/* STEP 3: FOCUSED LISTENING DICTATION & PARAPHRASE HUB                  */}
        {/* ===================================================================== */}
        {workspaceStep === 'step3_dictation' && (
          <BlurFade key="step3" className="space-y-5">
            <MyIeltsBigDataHub
              chapters={chapters}
              readingTiers={readingTiers}
              listening179={listening179}
              writing100={writing100}
              onSendWordToFsrs={handleQueueWordToFsrs}
              lang={lang}
            />

            <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setWorkspaceStep('step2_vocab')}
                className="inline-flex items-center gap-2 text-xs font-display font-bold text-[#334155] hover:text-[#0284C7] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Bước 02 (Học Từ Vựng Bài Đang Chọn)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkspaceStep('step4_exam');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                <span>Chuyển Sang Bước 04: Vào Phòng Thi 4 Kỹ Năng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </BlurFade>
        )}

        {/* ===================================================================== */}
        {/* STEP 4: FOCUSED 4-SKILL COMPUTER-DELIVERED EXAM SIMULATOR             */}
        {/* ===================================================================== */}
        {workspaceStep === 'step4_exam' && (
          <BlurFade key="step4" className="space-y-5">
            <SplitScreenExamPreview
              lang={lang}
              onSaveToNotebook={(word) => addWordToNotebook(word)}
              onSelectVocabFromPassage={handleQueueWordToFsrs}
            />

            <div className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setWorkspaceStep('step3_dictation')}
                className="inline-flex items-center gap-2 text-xs font-display font-bold text-[#334155] hover:text-[#0284C7] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Bước 03 (Nghe Chép & Đồng Nghĩa)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setWorkspaceStep('step5_dictionary');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                <span>Qua Bước 05: Ôn Sổ Từ Vựng Đã Lưu & Tra Từ Điển</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </BlurFade>
        )}

        {/* ===================================================================== */}
        {/* STEP 5: PERSONAL VOCABULARY NOTEBOOK & 7,298-WORD TOPIC EXPLORER      */}
        {/* ===================================================================== */}
        {workspaceStep === 'step5_dictionary' && (
          <BlurFade key="step5" className="space-y-6">
            {/* Personal Vocabulary Notebook + 19-Topic Constellation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#DCEBFA]">
                  <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                    SỔ TỪ VỰNG CÁ NHÂN CỦA BẠN ({notebookWords.length} TỪ ĐÃ LƯU)
                  </h2>
                  <span className="font-mono-data text-xs text-[#0284C7] font-bold">
                    Bấm vào từ để học FSRS ở Bước 02
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {notebookWords.map((nw) => (
                    <div
                      key={nw}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] font-mono-data text-xs font-bold text-[#0284C7]"
                    >
                      <button
                        type="button"
                        onClick={() => handleQueueWordToFsrs(nw)}
                        className="hover:underline cursor-pointer"
                      >
                        {nw}
                      </button>
                      <button
                        type="button"
                        onClick={() => playPronunciation('', nw, 'en-GB')}
                        className="text-[#0284C7] hover:text-[#0369A1] cursor-pointer"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSaveToNotebook(nw)}
                        className="text-[#64748B] hover:text-[#E11D48] cursor-pointer"
                        title="Xóa khỏi sổ"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#DCEBFA]">
                  <h2 className="font-display text-sm font-extrabold text-[#0F172A]">
                    BẢN ĐỒ 19 CHỦ ĐỀ WORD ATLAS
                  </h2>
                  <span className="font-mono-data text-xs text-[#0284C7] font-bold">
                    {selectedTopic === 'all'
                      ? '19 TOPICS'
                      : selectedTopic.toUpperCase()}
                  </span>
                </div>
                <WordAtlasConstellation
                  topics={topics}
                  activeTopic={selectedTopic}
                  onSelectTopic={(id) => setSelectedTopic(id)}
                />
              </div>
            </div>

            {/* 7,298 Word Dictionary Search & Filter */}
            <section className="bg-[#FFFFFF] rounded-2xl border border-[#DCEBFA] overflow-hidden shadow-xs">
              <div className="p-6 bg-[#F0F7FF] border-b border-[#DCEBFA] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-black text-[#0F172A]">
                    TRA CỨU KHO TỪ ĐIỂN 7,298 TỪ VỰNG MINH HỌA ({totalMatches.toLocaleString()} KẾT QUẢ)
                  </h2>
                  <p className="text-xs text-[#334155]">
                    Lọc theo 19 chủ đề hoặc cấp độ CEFR A1–C2 để lưu thêm từ mới vào Sổ Từ Vựng Cá Nhân.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm từ vựng, nghĩa tiếng Việt..."
                      className="bg-[#FFFFFF] border border-[#BAE6FD] rounded-xl pl-9 pr-3 py-2 text-xs text-[#0F172A] w-60"
                    />
                  </div>

                  {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(
                    (lv) => (
                      <button
                        key={lv}
                        type="button"
                        onClick={() => setSelectedCefr(lv)}
                        className={`px-2.5 py-1.5 rounded-lg font-mono-data text-xs font-bold cursor-pointer ${
                          selectedCefr === lv
                            ? 'bg-[#0284C7] text-[#FFFFFF]'
                            : 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA]'
                        }`}
                      >
                        {lv}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div
                className={`p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${
                  isLoadingWords ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {apiWords.slice(0, 12).map((item) => {
                  const saved = notebookWords.some(
                    (w) => w.toLowerCase() === item.w.toLowerCase()
                  );
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-base font-extrabold text-[#0F172A]">
                            {item.w}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold ${
                              CEFR_BADGE_STYLE[item.cefr]
                            }`}
                          >
                            {item.cefr}
                          </span>
                        </div>
                        <div className="font-mono-data text-xs text-[#64748B]">
                          {item.pos} • {item.uk}
                        </div>
                        <p className="text-xs font-semibold text-[#0284C7] line-clamp-2">
                          {item.vi || item.en}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#DCEBFA] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            playPronunciation(item.audioUkUrl, item.w, 'en-GB')
                          }
                          className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                        >
                          Nghe UK
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSaveToNotebook(item.w)}
                          className={`px-2.5 py-1 rounded-lg font-mono-data text-xs font-bold cursor-pointer ${
                            saved
                              ? 'bg-[#059669] text-[#FFFFFF]'
                              : 'bg-[#0284C7] text-[#FFFFFF]'
                          }`}
                        >
                          {saved ? 'Đã lưu Sổ' : '+ Lưu Sổ'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </BlurFade>
        )}
      </div>
    </div>
  );
}
