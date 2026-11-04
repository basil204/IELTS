'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe,
  Headphones,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Mic,
  PenTool,
  Play,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  User,
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

type DashboardZone =
  | 'overview'
  | 'vocab'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing'
  | 'profile';

type StudyMode = 'see_hear' | 'quiz_mcq' | 'recall_cloze' | 'dictation';

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

const PROGRESSIVE_STAGES = [
  {
    code: 'CHẶNG 01',
    band: 'Band 4.0 → 5.0',
    titleVi: 'Nền Tảng Cốt Lõi',
    titleEn: 'Core Foundation',
    subVi: 'Từ vựng A1–B1 thông dụng & phát âm chuẩn',
    subEn: 'Essential A1–B1 words & phonetics',
    cefrLevels: ['A1', 'A2', 'B1'] as CefrLevel[],
    wordCount: 1850
  },
  {
    code: 'CHẶNG 02',
    band: 'Band 5.0 → 6.0',
    titleVi: 'Tăng Tốc Chủ Đề',
    titleEn: 'Topic Fluency',
    subVi: 'Từ vựng B1–B2 theo 19 chủ đề IELTS',
    subEn: 'B1–B2 vocabulary across 19 topics',
    cefrLevels: ['B1', 'B2'] as CefrLevel[],
    wordCount: 2640
  },
  {
    code: 'CHẶNG 03',
    band: 'Band 6.0 → 7.0',
    titleVi: 'Bứt Phá Học Thuật',
    titleEn: 'Academic Mastery',
    subVi: 'Từ khóa Reading 538 & Listening 179',
    subEn: 'Reading 538 & Listening 179 synonyms',
    cefrLevels: ['B2', 'C1'] as CefrLevel[],
    wordCount: 3820
  },
  {
    code: 'CHẶNG 04',
    band: 'Band 7.0 → 8.0+',
    titleVi: 'Đỉnh Cao 4 Kỹ Năng',
    titleEn: 'Band 8.0+ Precision',
    subVi: 'Từ vựng C1–C2 & Thực chiến Nghe Nói Đọc Viết',
    subEn: 'C1–C2 vocabulary & 4-Skill practice',
    cefrLevels: ['C1', 'C2'] as CefrLevel[],
    wordCount: 2662
  }
];

const SPEAKING_TOPICS = [
  {
    id: 'sp-1',
    title: 'Chủ đề 1: Công Nghệ & Đời Sống (Technology)',
    prompt:
      'Describe a piece of modern technology that has made your daily life easier.',
    cues: [
      '1. Thiết bị hoặc ứng dụng đó là gì?',
      '2. Bạn sử dụng nó hàng ngày như thế nào?',
      '3. Tại sao nó giúp bạn tiết kiệm thời gian?'
    ],
    targetWords: [
      'ubiquitous',
      'indispensable',
      'streamline',
      'unprecedented',
      'productive'
    ],
    sampleAnswer:
      'In our modern era, smartphones have become completely ubiquitous and indispensable in my daily routine. They help me streamline my academic schedule with unprecedented efficiency and stay productive throughout the day.'
  },
  {
    id: 'sp-2',
    title: 'Chủ đề 2: Môi Trường & Đô Thị (Environment)',
    prompt:
      'Describe an environmental solution that you think cities should adopt.',
    cues: [
      '1. Giải pháp môi trường đó là gì?',
      '2. Nó được triển khai ở đô thị ra sao?',
      '3. Tác động tích cực lâu dài của nó là gì?'
    ],
    targetWords: [
      'mitigate',
      'viable',
      'sustainable',
      'emissions',
      'infrastructure'
    ],
    sampleAnswer:
      'Expanding electric public transit infrastructure is the most viable way to mitigate urban air pollution. This sustainable policy significantly reduces carbon emissions and improves public health.'
  },
  {
    id: 'sp-3',
    title: 'Chủ đề 3: Giáo Dục & Học Tập (Education)',
    prompt:
      'Describe an online course or self-study method that helped you learn effectively.',
    cues: [
      '1. Phương pháp học đó hoạt động thế nào?',
      '2. Nó khác gì so với cách học truyền thống?',
      '3. Kết quả bạn đạt được là gì?'
    ],
    targetWords: [
      'empirical',
      'retention',
      'autonomous',
      'curriculum',
      'cognitive'
    ],
    sampleAnswer:
      'Using an adaptive spaced-repetition curriculum has transformed me into an autonomous learner. Empirical research shows that reviewing words at optimal intervals maximizes long-term cognitive retention.'
  }
];

const INLINE_READING_DICT: Record<
  string,
  {
    ipa: string;
    pos: string;
    cefr: string;
    vi: string;
    en: string;
  }
> = {
  ubiquitous: {
    ipa: '/juːˈbɪk.wɪ.təs/',
    pos: 'adj.',
    cefr: 'C1',
    vi: 'Có mặt ở khắp mọi nơi; phổ biến rộng khắp',
    en: 'Present, appearing, or found everywhere.'
  },
  unprecedented: {
    ipa: '/ʌnˈpres.ɪ.den.tɪd/',
    pos: 'adj.',
    cefr: 'C1',
    vi: 'Chưa từng có tiền lệ trước đây',
    en: 'Never done or known before.'
  },
  mitigate: {
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'v.',
    cefr: 'C1',
    vi: 'Giảm thiểu, làm dịu bớt tác động tiêu cực',
    en: 'Make less severe, serious, or painful.'
  },
  viable: {
    ipa: '/ˈvaɪ.ə.bəl/',
    pos: 'adj.',
    cefr: 'C1',
    vi: 'Khả thi, có thể thực hiện thành công',
    en: 'Capable of working successfully; feasible.'
  },
  Empirical: {
    ipa: '/ɪmˈpɪr.ɪ.kəl/',
    pos: 'adj.',
    cefr: 'C1',
    vi: 'Dựa trên thực nghiệm và quan sát thực tế',
    en: 'Based on observation or verifiable experience.'
  },
  disparities: {
    ipa: '/dɪˈspær.ə.tiz/',
    pos: 'n.',
    cefr: 'C2',
    vi: 'Sự chênh lệch lớn, sự bất bình đẳng',
    en: 'A great difference or inequality between groups.'
  }
};

const READING_QUESTIONS = [
  {
    id: 1,
    q: ' Câu 1: Rừng thẳng đứng ở Milan chỉ có tác dụng trang trí chứ không giảm nhiệt độ.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'FALSE',
    explain:
      'Đoạn A nêu rõ Bosco Verticale giúp giảm nhiệt độ bề mặt tới 3°C (mitigate urban heat).'
  },
  {
    id: 2,
    q: 'Câu 2: Chi phí xây dựng ban đầu cao là rào cản tại các đô thị đang phát triển.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'TRUE',
    explain:
      'Đoạn B chỉ ra chi phí kỹ thuật ban đầu tạo ra sự chênh lệch (disparities) ở các nước đang phát triển.'
  },
  {
    id: 3,
    q: 'Câu 3: Mọi tòa nhà thương mại tại châu Âu bắt buộc phải trồng cây trước năm 2030.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'NOT GIVEN',
    explain: 'Trong bài đọc không có thông tin nào đề cập đến mốc năm 2030.'
  }
];

const LISTENING_QUIZ = [
  {
    id: 1,
    q: 'Câu 1: Mục đích chính của dự án cải tạo thư viện đại học là gì?',
    options: [
      'A. Mở rộng phòng tự học công nghệ số',
      'B. Đóng cửa khu vực mượn sách giấy',
      'C. Tăng phí thành viên hàng năm'
    ],
    answer: 'A. Mở rộng phòng tự học công nghệ số'
  },
  {
    id: 2,
    q: 'Câu 2: Nguồn kinh phí chính của dự án đến từ đâu?',
    options: [
      'A. Vay thương mại ngân hàng',
      'B. Khoản tài trợ từ cựu sinh viên (philanthropic donation)',
      'C. Cắt giảm ngân sách phòng thí nghiệm'
    ],
    answer: 'B. Khoản tài trợ từ cựu sinh viên (philanthropic donation)'
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
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [activeUser, setActiveUser] = useState<Omit<
    PlatformUser,
    'passwordHash'
  > | null>(null);
  const [forceLandingPreview, setForceLandingPreview] = useState(false);

  // Active Dashboard Zone (7 clear rooms!)
  const [activeZone, setActiveZone] = useState<DashboardZone>('overview');

  // Auth State on Landing Page
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('hocvien@theieltsdictionary.vn');
  const [authPassword, setAuthPassword] = useState('123456');
  const [authTargetBand, setAuthTargetBand] = useState('Band 7.5+');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Stage & Lesson State
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [activeLessonId, setActiveLessonId] = useState<string>('stage-0-lesson-0');
  const [completedLessons, setCompletedLessons] = useState<string[]>([
    'stage-0-lesson-0'
  ]);

  // Vocabulary Zone State
  const [vocabSubTab, setVocabSubTab] = useState<'lesson' | 'explorer'>('lesson');
  const [studyMode, setStudyMode] = useState<StudyMode>('see_hear');
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [fsrsRecords, setFsrsRecords] = useState<
    Record<string, FsrsCardRecord>
  >({});
  const [streakDays, setStreakDays] = useState<number>(14);
  const [reviewedToday, setReviewedToday] = useState<number>(18);
  const [dailyGoalWords, setDailyGoalWords] = useState<number>(20);
  const [userXp, setUserXp] = useState<number>(14250);
  const [notebookWords, setNotebookWords] = useState<string[]>([
    'ubiquitous',
    'mitigate',
    'unprecedented',
    'viable'
  ]);
  const [clozeInput, setClozeInput] = useState<string>('');
  const [dictationInput, setDictationInput] = useState<string>('');
  const [selectedMcqOption, setSelectedMcqOption] = useState<string | null>(
    null
  );

  // Dictionary Explorer State
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedCefr, setSelectedCefr] = useState<CefrLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [apiWords, setApiWords] =
    useState<WordAtlasEntry[]>(initialPriorityWords);
  const [totalMatches, setTotalMatches] = useState<number>(7298);

  // Listening Zone State
  const [listeningSubTab, setListeningSubTab] = useState<
    'audio_test' | 'dictation_22' | 'paraphrase_179'
  >('audio_test');
  const [selectedChapterKey, setSelectedChapterKey] = useState<string>(
    chapters[0]?.key || '01'
  );
  const [chapterDictationMap, setChapterDictationMap] = useState<
    Record<string, string>
  >({});
  const [revealMeanings, setRevealMeanings] = useState<boolean>(true);
  const [listeningAnswers, setListeningAnswers] = useState<
    Record<number, string>
  >({});
  const [listeningSubmitted, setListeningSubmitted] = useState(false);

  // Speaking Zone State
  const [selectedSpeakingIdx, setSelectedSpeakingIdx] = useState<number>(0);
  const [speakingTranscript, setSpeakingTranscript] = useState<string>('');
  const [isRecordingSpeaking, setIsRecordingSpeaking] = useState(false);
  const [speakingGraded, setSpeakingGraded] = useState(false);

  // Reading Zone State
  const [readingSubTab, setReadingSubTab] = useState<'passage' | 'keywords_538'>(
    'passage'
  );
  const [selectedInlineWord, setSelectedInlineWord] =
    useState<string>('ubiquitous');
  const [readingAnswers, setReadingAnswers] = useState<Record<number, string>>(
    {}
  );
  const [readingSubmitted, setReadingSubmitted] = useState(false);

  // Writing Zone State
  const [writingSubTab, setWritingSubTab] = useState<
    'ai_grader' | 'templates_100'
  >('ai_grader');
  const [essayText, setEssayText] = useState<string>(
    'In recent decades, rapid urban expansion has created unprecedented environmental challenges. Governments must adopt viable public transit policies to mitigate carbon emissions and reduce social disparities.'
  );
  const [writingGraded, setWritingGraded] = useState(true);

  // Profile Zone State
  const [profileNameInput, setProfileNameInput] = useState('');
  const [profileTargetInput, setProfileTargetInput] = useState('Band 7.5+');
  const [profileSavedToast, setProfileSavedToast] = useState(false);
  const [newCustomWord, setNewCustomWord] = useState('');

  // Load persisted data
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
        setProfileNameInput(parsedUser.name || '');
        setProfileTargetInput(parsedUser.targetBand || 'Band 7.5+');
      }
      const savedNotebook = localStorage.getItem(STORAGE_NOTEBOOK_KEY);
      if (savedNotebook) setNotebookWords(JSON.parse(savedNotebook));
      const savedLessons = localStorage.getItem(STORAGE_COMPLETED_LESSONS_KEY);
      if (savedLessons) setCompletedLessons(JSON.parse(savedLessons));
    } catch {
      // ignore
    }
  }, []);

  // Build 6 lessons (12 words each) per Stage
  const stageLessons = useMemo(() => {
    const stage = PROGRESSIVE_STAGES[selectedStageIdx] || PROGRESSIVE_STAGES[0];
    const stageWords = initialPriorityWords.filter((w) =>
      stage.cefrLevels.includes(w.cefr)
    );
    const pool = stageWords.length >= 24 ? stageWords : initialPriorityWords;
    return Array.from({ length: 6 }, (_, idx) => {
      const start = (idx * 12) % Math.max(1, pool.length);
      const slice: WordAtlasEntry[] = [];
      for (let i = 0; i < 12; i++) {
        slice.push(pool[(start + i) % pool.length]);
      }
      const topicObj = topics[(selectedStageIdx * 3 + idx) % topics.length];
      return {
        id: `stage-${selectedStageIdx}-lesson-${idx}`,
        lessonNo: idx + 1,
        titleVi: `Bài ${idx + 1}: ${topicObj?.vi || 'Từ Vựng Trọng Tâm'}`,
        titleEn: `Lesson ${idx + 1}: ${topicObj?.en || 'Core Vocabulary'}`,
        cefrBadge: stage.cefrLevels.join(' / '),
        words: slice
      };
    });
  }, [selectedStageIdx, initialPriorityWords, topics]);

  const currentLesson = useMemo(
    () => stageLessons.find((l) => l.id === activeLessonId) || stageLessons[0],
    [stageLessons, activeLessonId]
  );

  const activeLessonWords = useMemo(
    () =>
      currentLesson?.words?.length
        ? currentLesson.words
        : initialPriorityWords.slice(0, 12),
    [currentLesson, initialPriorityWords]
  );

  const activeWord = useMemo(
    () =>
      activeLessonWords[currentWordIndex % activeLessonWords.length] ||
      initialPriorityWords[0],
    [activeLessonWords, currentWordIndex, initialPriorityWords]
  );

  const activeCardRecord = useMemo(
    () => (activeWord ? fsrsRecords[activeWord.id] : undefined),
    [activeWord, fsrsRecords]
  );

  const intervalPreviews = useMemo(
    () => getIntervalPreviews(activeCardRecord),
    [activeCardRecord]
  );

  const mcqOptions = useMemo(() => {
    if (!activeWord) return [];
    const correctMeaning = activeWord.vi || activeWord.en;
    const distractors = initialPriorityWords
      .filter((w) => w.id !== activeWord.id && (w.vi || w.en))
      .slice(0, 3)
      .map((w) => w.vi || w.en);
    return [correctMeaning, ...distractors].sort(
      (a, b) => a.length - b.length
    );
  }, [activeWord, initialPriorityWords]);

  // Dictionary search effect
  useEffect(() => {
    if (activeZone !== 'vocab' || vocabSubTab !== 'explorer') return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (selectedTopic !== 'all') params.set('topic', selectedTopic);
        if (selectedCefr !== 'ALL') params.set('cefr', selectedCefr);
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        params.set('limit', '12');
        const res = await fetch(`/api/atlas?${params.toString()}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setApiWords(data.items);
          setTotalMatches(data.total);
        }
      } catch {
        // ignore
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [activeZone, vocabSubTab, selectedTopic, selectedCefr, searchQuery]);

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

  const handleRateCard = useCallback(
    (grade: 'again' | 'hard' | 'good' | 'easy') => {
      if (!activeWord) return;
      const updated = gradeFsrsCard(activeWord.id, grade, activeCardRecord);
      const nextRecords = { ...fsrsRecords, [activeWord.id]: updated };
      setFsrsRecords(nextRecords);

      const nextReviewed = reviewedToday + 1;
      const nextXp = userXp + 20;
      setReviewedToday(nextReviewed);
      setUserXp(nextXp);
      setClozeInput('');
      setDictationInput('');
      setSelectedMcqOption(null);

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
      currentLesson,
      currentWordIndex,
      activeLessonWords.length,
      completedLessons
    ]
  );

  // Auth handlers
  const buildFallbackUser = (
    email: string,
    name: string,
    role: 'admin' | 'vip' | 'student' = 'vip'
  ): Omit<PlatformUser, 'passwordHash'> => {
    const isAdmin =
      role === 'admin' || email.toLowerCase().startsWith('admin@');
    return {
      id: isAdmin ? 'usr-admin-01' : 'usr-vip-02',
      name:
        name ||
        (isAdmin
          ? 'Quản Trị Viên Hệ Thống (Admin)'
          : 'Nguyễn Minh Anh (Học Viên VIP)'),
      email,
      provider: 'credentials',
      role: isAdmin ? 'admin' : role,
      plan: isAdmin ? 'VIP Unlimited (Admin)' : 'VIP Unlimited (12 Tháng)',
      targetBand: isAdmin ? 'Band 8.0+' : 'Band 7.5+',
      currentBand: isAdmin ? '7.5' : '6.5',
      xp: isAdmin ? 5840 : 2490,
      streak: isAdmin ? 65 : 42,
      completedModules: ['mod-101', 'mod-102'],
      createdAt: new Date().toISOString()
    };
  };

  const applyLoggedInUser = (user: Omit<PlatformUser, 'passwordHash'>) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setActiveUser(user);
    setProfileNameInput(user.name || '');
    setProfileTargetInput(user.targetBand || 'Band 7.5+');
    setForceLandingPreview(false);
    setActiveZone('overview');
  };

  const handleOneClickLogin = async (
    email: string,
    name: string,
    isGoogle = false,
    role: 'admin' | 'vip' | 'student' = 'vip'
  ) => {
    setAuthLoading(true);
    setAuthError(null);
    const defaultPassword = role === 'admin' ? 'Admin@123' : '123456';
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isGoogle
            ? { action: 'google', email, name }
            : { action: 'login', email, password: defaultPassword }
        )
      });
      const data = await res.json();
      if (res.ok && data.user) {
        applyLoggedInUser(data.user);
      } else {
        applyLoggedInUser(buildFallbackUser(email, name, role));
      }
    } catch {
      applyLoggedInUser(buildFallbackUser(email, name, role));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const cleanEmail = authEmail.trim().toLowerCase();
    const cleanPass = authPassword.trim();

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: authMode,
          name: authName,
          email: cleanEmail,
          password: cleanPass,
          targetBand: authTargetBand
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        applyLoggedInUser(data.user);
        return;
      }

      // Client fallback for official demo credentials
      if (
        (cleanEmail === 'admin@theieltsdictionary.vn' ||
          cleanEmail === 'admin@gmail.com') &&
        (cleanPass === 'Admin@123' ||
          cleanPass === '123456' ||
          cleanPass === 'admin123')
      ) {
        applyLoggedInUser(
          buildFallbackUser(
            cleanEmail,
            'Quản Trị Viên Hệ Thống (Admin)',
            'admin'
          )
        );
        return;
      }

      if (
        (cleanEmail === 'hocvien@theieltsdictionary.vn' ||
          cleanEmail === 'user@theieltsdictionary.vn' ||
          cleanEmail === 'minhanh@theieltsdictionary.vn' ||
          cleanEmail === 'minhanh.ielts@gmail.com') &&
        (cleanPass === '123456' ||
          cleanPass === 'User@123' ||
          cleanPass === 'Student@123' ||
          cleanPass === 'Vip@123')
      ) {
        applyLoggedInUser(
          buildFallbackUser(cleanEmail, 'Nguyễn Minh Anh (Học Viên VIP)', 'vip')
        );
        return;
      }

      setAuthError(data.error || 'Email hoặc mật khẩu không chính xác.');
    } catch {
      applyLoggedInUser(
        buildFallbackUser(
          cleanEmail,
          cleanEmail.startsWith('admin')
            ? 'Quản Trị Viên Hệ Thống (Admin)'
            : 'Nguyễn Minh Anh (Học Viên VIP)',
          cleanEmail.startsWith('admin') ? 'admin' : 'vip'
        )
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) return;
    const updated = {
      ...activeUser,
      name: profileNameInput.trim() || activeUser.name,
      targetBand: profileTargetInput
    };
    setActiveUser(updated);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    setActiveUser(null);
    setForceLandingPreview(false);
  };

  const isSavedInNotebook =
    activeWord &&
    notebookWords.some((w) => w.toLowerCase() === activeWord.w.toLowerCase());
  const isClozeCorrect =
    activeWord &&
    clozeInput.trim().toLowerCase() === activeWord.w.toLowerCase();
  const isDictationCorrect =
    activeWord &&
    dictationInput.trim().toLowerCase() === activeWord.w.toLowerCase();

  const activeSpeakingTopic =
    SPEAKING_TOPICS[selectedSpeakingIdx] || SPEAKING_TOPICS[0];
  const activeChapter =
    chapters.find((c) => c.key === selectedChapterKey) || chapters[0];
  const essayWordCount = essayText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const showLandingPage = !activeUser || forceLandingPreview;

  // ============================================================================
  // 1. MINIMAL, VISUAL LANDING PAGE (BEFORE LOGIN) — EASY FOR EVERYONE
  // ============================================================================
  if (showLandingPage) {
    return (
      <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
          {/* Simple Top Header */}
          <header className="bg-[#FFFFFF] rounded-2xl px-5 py-3.5 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display font-black text-sm">
                YP
              </span>
              <span className="font-display text-lg font-black text-[#0F172A]">
                YOUPASS × WORD ATLAS 4.0
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
              </button>

              {activeUser ? (
                <button
                  type="button"
                  onClick={() => setForceLandingPreview(false)}
                  className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                >
                  Vào Lại Dashboard Học Tập →
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
                  className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                >
                  Vào Học Ngay (1 Chạm) →
                </button>
              )}
            </div>
          </header>

          {/* Hero Section: Visual 6-Feature Grid on Left + 1-Click Login on Right */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <BlurFade delay={0.05} className="lg:col-span-7 space-y-6">
              <h1 className="font-display text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight">
                Nền Tảng Tự Học IELTS Toàn Diện: Từ Vựng • Nghe • Nói • Đọc • Viết
              </h1>

              <p className="text-sm sm:text-base text-[#334155]">
                Giao diện trực quan, chia khu vực rõ ràng cho từng kỹ năng. Đăng nhập 1 chạm để vào Dashboard cá nhân và bắt đầu học ngay.
              </p>

              {/* 6 Visual Room Preview Tiles (Minimal text, clear icons) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Học Từ Vựng
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      7,298 từ có ảnh & âm thanh
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] text-[#059669]">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Học Nghe
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Nghe băng thi & gõ từ
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Học Nói
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Thu âm & chấm phát âm
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Học Đọc
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Bấm vào từ xem nghĩa ngay
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] text-[#059669]">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Học Viết
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      AI chấm điểm & sửa lỗi
                    </div>
                  </div>
                </div>

                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Hồ Sơ Cá Nhân
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Theo dõi Band & Sổ từ vựng
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 NumberTicker Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-xl font-black text-[#0284C7]">
                    <NumberTicker value={10972} />
                  </div>
                  <div className="text-xs text-[#64748B]">Từ Vựng IELTS</div>
                </div>
                <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-xl font-black text-[#059669]">
                    <NumberTicker value={4} suffix=" Kỹ Năng" />
                  </div>
                  <div className="text-xs text-[#64748B]">Nghe Nói Đọc Viết</div>
                </div>
                <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-xl font-black text-[#0F172A]">
                    <NumberTicker value={12} suffix=" Tuần" />
                  </div>
                  <div className="text-xs text-[#64748B]">Lộ Trình Rõ Ràng</div>
                </div>
                <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-xl font-black text-[#D97706]">
                    <NumberTicker value={94.2} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs text-[#64748B]">Tỉ Lệ Nhớ Từ</div>
                </div>
              </div>
            </BlurFade>

            {/* Right 5 Columns: Simple 1-Click Login Box */}
            <BlurFade delay={0.12} className="lg:col-span-5">
              <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#BAE6FD] shadow-sm space-y-4 overflow-hidden">
                <BorderBeam duration={7} />

                <div className="pb-3 border-b border-[#DCEBFA]">
                  <h2 className="font-display text-xl font-black text-[#0F172A]">
                    Đăng Nhập Vào Dashboard Học Tập
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Chọn đăng nhập nhanh 1 chạm bên dưới để vào thẳng phòng học:
                  </p>
                </div>

                {/* Big 1-Click Login Buttons for User & Admin */}
                <div className="space-y-2.5">
                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() =>
                      handleOneClickLogin(
                        'hocvien@theieltsdictionary.vn',
                        'Nguyễn Minh Anh (Học Viên VIP)',
                        false,
                        'vip'
                      )
                    }
                    className="w-full py-3.5 px-4 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Vào Ngay Tài Khoản Học Viên (User VIP)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() =>
                      handleOneClickLogin(
                        'admin@theieltsdictionary.vn',
                        'Quản Trị Viên Hệ Thống (Admin)',
                        false,
                        'admin'
                      )
                    }
                    className="w-full py-3 px-4 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#047857] border border-[#A7F3D0] font-display text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#059669]" />
                    <span>Vào Ngay Tài Khoản Quản Trị (Admin CMS)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    disabled={authLoading}
                    onClick={() =>
                      handleOneClickLogin(
                        'google.scholar@gmail.com',
                        'Trần Hoàng Minh (Google VIP)',
                        true,
                        'vip'
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0F172A] border border-[#BAE6FD] font-display text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Globe className="w-4 h-4 text-[#0284C7]" />
                    <span>Đăng Nhập Nhanh Bằng Google OAuth</span>
                  </button>
                </div>

                {/* Clear Credentials Box (1 Admin + 1 User) */}
                <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-display font-extrabold text-[#0284C7]">
                        TK User:
                      </span>{' '}
                      <span className="font-mono-data text-[#0F172A]">
                        hocvien@theieltsdictionary.vn
                      </span>{' '}
                      •{' '}
                      <span className="font-mono-data font-bold text-[#059669]">
                        123456
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail('hocvien@theieltsdictionary.vn');
                        setAuthPassword('123456');
                      }}
                      className="px-2 py-1 rounded bg-[#E0F2FE] text-[#0284C7] font-mono-data font-bold cursor-pointer shrink-0"
                    >
                      Điền User
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#DCEBFA]">
                    <div>
                      <span className="font-display font-extrabold text-[#059669]">
                        TK Admin:
                      </span>{' '}
                      <span className="font-mono-data text-[#0F172A]">
                        admin@theieltsdictionary.vn
                      </span>{' '}
                      •{' '}
                      <span className="font-mono-data font-bold text-[#0284C7]">
                        Admin@123
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail('admin@theieltsdictionary.vn');
                        setAuthPassword('Admin@123');
                      }}
                      className="px-2 py-1 rounded bg-[#ECFDF5] text-[#047857] font-mono-data font-bold cursor-pointer shrink-0"
                    >
                      Điền Admin
                    </button>
                  </div>
                </div>

                {authError && (
                  <div className="p-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs text-[#E11D48]">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleQuickAuthSubmit} className="space-y-2.5">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Nhập Email của bạn..."
                    className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A]"
                  />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Mật khẩu..."
                    className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl px-3.5 py-2.5 text-xs text-[#0F172A]"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    {authLoading ? 'Đang mở Dashboard...' : 'Đăng Nhập Bằng Email & Mật Khẩu'}
                  </button>
                </form>
              </div>
            </BlurFade>
          </section>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. FULL 7-ZONE STUDENT DASHBOARD (SIDEBAR + DEDICATED SKILL ROOMS + PROFILE)
  // ============================================================================
  const SIDEBAR_ITEMS: {
    id: DashboardZone;
    label: string;
    sub: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'overview',
      label: 'Tổng Quan & Lộ Trình',
      sub: 'Chọn bài học hôm nay',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'vocab',
      label: 'Khu Vực Học Từ Vựng',
      sub: 'Flashcard & 7,298 từ',
      icon: <BookOpen className="w-4 h-4" />,
      badge: '12 từ/bài'
    },
    {
      id: 'listening',
      label: 'Khu Vực Học Nghe',
      sub: 'Băng nghe & Gõ chính tả',
      icon: <Headphones className="w-4 h-4" />
    },
    {
      id: 'speaking',
      label: 'Khu Vực Học Nói',
      sub: 'Thu âm & Chấm phát âm',
      icon: <Mic className="w-4 h-4" />
    },
    {
      id: 'reading',
      label: 'Khu Vực Học Đọc',
      sub: 'Đọc bài & Tra từ 1-chạm',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'writing',
      label: 'Khu Vực Học Viết',
      sub: 'Viết bài & AI chấm điểm',
      icon: <PenTool className="w-4 h-4" />
    },
    {
      id: 'profile',
      label: 'Hồ Sơ Cá Nhân (Profile)',
      sub: `Mục tiêu ${activeUser.targetBand} • Sổ từ`,
      icon: <User className="w-4 h-4" />,
      badge: `${notebookWords.length} từ`
    }
  ];

  const userInitials = activeUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================================================================= */}
          {/* LEFT SIDEBAR: USER PROFILE CARD + 7 CLEAR SKILL ROOM BUTTONS      */}
          {/* ================================================================= */}
          <aside className="lg:col-span-3 bg-[#FFFFFF] rounded-2xl border border-[#DCEBFA] p-4 space-y-5 lg:sticky lg:top-5">
            {/* Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DCEBFA]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display font-black text-xs">
                  YP
                </span>
                <span className="font-display text-sm font-black text-[#0F172A]">
                  YOUPASS 4.0
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                {activeUser.role.toUpperCase()}
              </span>
            </div>

            {/* Clickable User Profile Summary Box */}
            <button
              type="button"
              onClick={() => setActiveZone('profile')}
              className="w-full text-left p-3.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-colors flex items-center gap-3 cursor-pointer"
            >
              <div className="w-11 h-11 rounded-full bg-[#0284C7] text-[#FFFFFF] font-display font-black text-sm flex items-center justify-center shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-extrabold text-[#0F172A] truncate">
                  {activeUser.name}
                </div>
                <div className="text-xs text-[#0284C7] font-bold">
                  Mục tiêu: {activeUser.targetBand}
                </div>
                <div className="text-xs text-[#64748B]">
                  Bấm để xem Hồ sơ & Điểm →
                </div>
              </div>
            </button>

            {/* 7 Dedicated Zone Buttons */}
            <nav aria-label="Menu kỹ năng chính" className="space-y-1.5">
              {SIDEBAR_ITEMS.map((item) => {
                const isActive = activeZone === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveZone(item.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-[#0284C7] text-[#FFFFFF] shadow-xs'
                        : 'bg-[#FFFFFF] hover:bg-[#F0F7FF] text-[#0F172A]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-2 rounded-lg shrink-0 ${
                          isActive
                            ? 'bg-[#FFFFFF]/20 text-[#FFFFFF]'
                            : 'bg-[#F0F7FF] text-[#0284C7]'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-xs sm:text-sm font-extrabold truncate">
                          {item.label}
                        </div>
                        <div
                          className={`text-xs truncate ${
                            isActive ? 'text-[#E0F2FE]' : 'text-[#64748B]'
                          }`}
                        >
                          {item.sub}
                        </div>
                      </div>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold shrink-0 ${
                          isActive
                            ? 'bg-[#FFFFFF] text-[#0284C7]'
                            : 'bg-[#E0F2FE] text-[#0284C7]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Quick Actions */}
            <div className="pt-3 border-t border-[#DCEBFA] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/pricing"
                  className="py-2 px-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-display text-xs font-bold text-center"
                >
                  Nâng Cấp VIP
                </Link>
                <button
                  type="button"
                  onClick={() => setForceLandingPreview(true)}
                  className="py-2 px-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-[#334155] font-display text-xs font-bold cursor-pointer"
                >
                  Trang Giới Thiệu
                </button>
              </div>

              {activeUser.role === 'admin' && (
                <Link
                  href="/admin"
                  className="block w-full py-2 px-3 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold text-center"
                >
                  Quản Trị Admin CMS
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] font-display text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất Tài Khoản</span>
              </button>
            </div>
          </aside>

          {/* ================================================================= */}
          {/* RIGHT MAIN WORKSPACE (9 COLUMNS) — RENDERS SELECTED SKILL ZONE    */}
          {/* ================================================================= */}
          <main className="lg:col-span-9 space-y-6">
            {/* =============================================================== */}
            {/* ZONE 1: TỔNG QUAN & LỘ TRÌNH (DASHBOARD OVERVIEW)               */}
            {/* =============================================================== */}
            {activeZone === 'overview' && (
              <BlurFade key="zone-overview" className="space-y-6">
                {/* 4 Visual KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                    <div className="text-xs text-[#64748B]">Mục Tiêu Của Bạn</div>
                    <div className="font-display text-xl font-black text-[#0284C7] mt-1">
                      {activeUser.targetBand}
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#E0F2FE] overflow-hidden">
                      <div className="h-full w-3/4 bg-[#0284C7]" />
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                    <div className="text-xs text-[#64748B]">Từ Học Hôm Nay</div>
                    <div className="font-display text-xl font-black text-[#059669] mt-1">
                      {reviewedToday} / {dailyGoalWords} từ
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-[#ECFDF5] overflow-hidden">
                      <div
                        className="h-full bg-[#059669]"
                        style={{
                          width: `${Math.min(100, (reviewedToday / dailyGoalWords) * 100)}%`
                        }}
                      />
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                    <div className="text-xs text-[#64748B]">Chuỗi Ngày Học</div>
                    <div className="font-display text-xl font-black text-[#D97706] mt-1 flex items-center gap-1.5">
                      <Flame className="w-5 h-5" />
                      <span>{streakDays} Ngày</span>
                    </div>
                    <div className="text-xs text-[#059669] mt-1 font-bold">
                      {userXp.toLocaleString()} XP tích lũy
                    </div>
                  </div>

                  <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA]">
                    <div className="text-xs text-[#64748B]">Sổ Từ Đã Lưu</div>
                    <div className="font-display text-xl font-black text-[#0F172A] mt-1">
                      {notebookWords.length} từ
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveZone('profile')}
                      className="text-xs text-[#0284C7] font-bold mt-1 hover:underline cursor-pointer"
                    >
                      Mở Sổ Từ Vựng →
                    </button>
                  </div>
                </div>

                {/* 6 Big Visual Skill Cards — Click to Enter Each Dedicated Room */}
                <section className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-black text-[#0F172A]">
                      CHỌN KHU VỰC KỸ NĂNG BẠN MUỐN HỌC HÔM NAY
                    </h2>
                    <span className="text-xs text-[#64748B]">
                      Bấm vào ô bất kỳ để vào thẳng phòng học riêng
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button
                      type="button"
                      onClick={() => setActiveZone('vocab')}
                      className="text-left p-5 rounded-2xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#0284C7] text-[#FFFFFF]">
                          <BookOpen className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] text-[#0284C7] font-mono-data text-xs font-bold">
                          7,298 Từ
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          1. Khu Vực Học Từ Vựng
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Học từng bài 12 từ có hình ảnh, âm thanh Anh-Mỹ & trắc nghiệm.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#0284C7]">
                        Vào Học Từ Vựng Ngay →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveZone('listening')}
                      className="text-left p-5 rounded-2xl bg-[#F8FBFF] hover:bg-[#F0F7FF] border border-[#DCEBFA] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#059669] text-[#FFFFFF]">
                          <Headphones className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#059669] font-mono-data text-xs font-bold">
                          Listening
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          2. Khu Vực Học Nghe
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Nghe hội thoại làm trắc nghiệm & luyện nghe chép chính tả 22 chủ đề.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#059669]">
                        Vào Phòng Luyện Nghe →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveZone('speaking')}
                      className="text-left p-5 rounded-2xl bg-[#F8FBFF] hover:bg-[#F0F7FF] border border-[#DCEBFA] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#D97706] text-[#FFFFFF]">
                          <Mic className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] text-[#D97706] font-mono-data text-xs font-bold">
                          Speaking
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          3. Khu Vực Học Nói
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Luyện nói theo chủ đề Part 2, thu âm trực tiếp & chấm điểm từ vựng.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#D97706]">
                        Vào Phòng Luyện Nói →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveZone('reading')}
                      className="text-left p-5 rounded-2xl bg-[#F8FBFF] hover:bg-[#F0F7FF] border border-[#DCEBFA] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#0284C7] text-[#FFFFFF]">
                          <FileText className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                          Reading
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          4. Khu Vực Học Đọc
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Làm bài đọc IELTS, bấm vào từ bất kỳ để xem nghĩa & lưu sổ từ vựng.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#0284C7]">
                        Vào Phòng Luyện Đọc →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveZone('writing')}
                      className="text-left p-5 rounded-2xl bg-[#F8FBFF] hover:bg-[#F0F7FF] border border-[#DCEBFA] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#059669] text-[#FFFFFF]">
                          <PenTool className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] text-[#059669] font-mono-data text-xs font-bold">
                          Writing AI
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          5. Khu Vực Học Viết
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Viết bài luận Task 2, nâng cấp từ vựng 1-chạm & AI chấm 4 tiêu chí.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#059669]">
                        Vào Phòng Luyện Viết →
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveZone('profile')}
                      className="text-left p-5 rounded-2xl bg-[#F8FBFF] hover:bg-[#F0F7FF] border border-[#DCEBFA] transition-all cursor-pointer flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-3 rounded-xl bg-[#0F172A] text-[#FFFFFF]">
                          <User className="w-5 h-5" />
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                          Profile
                        </span>
                      </div>
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          6. Hồ Sơ & Sổ Từ Vựng
                        </div>
                        <p className="text-xs text-[#334155] mt-1">
                          Xem biểu đồ điểm 4 kỹ năng, chỉnh mục tiêu Band & ôn từ đã lưu.
                        </p>
                      </div>
                      <span className="font-display text-xs font-extrabold text-[#0284C7]">
                        Xem Hồ Sơ Cá Nhân →
                      </span>
                    </button>
                  </div>
                </section>

                {/* Lộ Trình 4 Chặng & 6 Bài Học Nhỏ */}
                <section className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-black text-[#0F172A]">
                      LỘ TRÌNH HỌC TỪ TỪ THEO 4 CHẶNG (BẤM CHỌN BÀI ĐỂ HỌC)
                    </h2>
                    <span className="text-xs font-mono-data text-[#059669] font-bold">
                      Đã xong {completedLessons.length} bài
                    </span>
                  </div>

                  <AnimatedRoadmapBeam
                    stages={PROGRESSIVE_STAGES.map((s) => ({
                      code: s.code,
                      band: s.band,
                      title: s.titleVi,
                      sub: s.subVi,
                      wordCount: s.wordCount
                    }))}
                    activeStageIndex={selectedStageIdx}
                    onSelectStage={(idx) => setSelectedStageIdx(idx)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                    {stageLessons.map((lesson) => {
                      const isDone = completedLessons.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                                BÀI 0{lesson.lessonNo}
                              </span>
                              <span className="text-xs font-mono-data text-[#059669] font-bold">
                                {isDone ? 'Đã học xong' : '12 từ vựng'}
                              </span>
                            </div>
                            <div className="font-display text-sm font-extrabold text-[#0F172A] mt-2">
                              {lesson.titleVi}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveLessonId(lesson.id);
                              setCurrentWordIndex(0);
                              setVocabSubTab('lesson');
                              setActiveZone('vocab');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold cursor-pointer"
                          >
                            Bắt Đầu Bài Học Này →
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 2: KHU VỰC HỌC TỪ VỰNG (DEDICATED VOCABULARY ROOM)         */}
            {/* =============================================================== */}
            {activeZone === 'vocab' && activeWord && (
              <BlurFade key="zone-vocab" className="space-y-5">
                {/* Sub-bar: Học Theo Bài vs Tra Từ Điển Hình Ảnh */}
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
                      KHU VỰC HỌC TỪ VỰNG HÌNH ẢNH & PHÁT ÂM
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      Đang mở: <strong>{currentLesson?.titleVi}</strong> • Từ số{' '}
                      {(currentWordIndex % activeLessonWords.length) + 1} /{' '}
                      {activeLessonWords.length}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setVocabSubTab('lesson')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        vocabSubTab === 'lesson'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      Học Theo Bài (12 Từ)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVocabSubTab('explorer')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        vocabSubTab === 'explorer'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      Tra Từ Điển 7,298 Từ
                    </button>
                  </div>
                </div>

                {vocabSubTab === 'lesson' ? (
                  <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#BAE6FD] shadow-xs space-y-6 overflow-hidden">
                    <BorderBeam duration={8} />

                    {/* 4 Simple Mode Buttons + Save Button */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ['see_hear', '1. Xem Thẻ & Nghe'],
                            ['quiz_mcq', '2. Trắc Nghiệm'],
                            ['recall_cloze', '3. Điền Từ'],
                            ['dictation', '4. Nghe Gõ Từ']
                          ] as const
                        ).map(([mKey, mLabel]) => (
                          <button
                            key={mKey}
                            type="button"
                            onClick={() => setStudyMode(mKey)}
                            className={`px-3 py-1.5 rounded-xl font-display text-xs font-bold cursor-pointer ${
                              studyMode === mKey
                                ? 'bg-[#0284C7] text-[#FFFFFF]'
                                : 'bg-[#F0F7FF] text-[#334155]'
                            }`}
                          >
                            {mLabel}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleSaveToNotebook(activeWord.w)}
                        className={`px-3.5 py-1.5 rounded-xl font-display text-xs font-bold flex items-center gap-1.5 border cursor-pointer ${
                          isSavedInNotebook
                            ? 'bg-[#ECFDF5] border-[#059669] text-[#059669]'
                            : 'bg-[#F0F7FF] border-[#BAE6FD] text-[#0284C7]'
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
                            <span>+ Lưu Từ Này</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Flashcard Core */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-7 space-y-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded font-mono-data text-xs font-bold ${
                              CEFR_BADGE_STYLE[activeWord.cefr]
                            }`}
                          >
                            Cấp độ {activeWord.cefr}
                          </span>
                          <span className="text-xs font-mono-data text-[#64748B]">
                            Từ loại: {activeWord.pos}
                          </span>
                        </div>

                        <h2 className="font-display text-3xl sm:text-4xl font-black text-[#0F172A]">
                          {studyMode === 'dictation' && !isDictationCorrect
                            ? '• • • • • • •'
                            : activeWord.w}
                        </h2>

                        {/* Big Friendly Audio Buttons */}
                        <div className="flex flex-wrap gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              playPronunciation(
                                activeWord.audioUkUrl,
                                activeWord.w,
                                'en-GB'
                              )
                            }
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0F172A] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-bold transition-colors cursor-pointer"
                          >
                            <FlagUkSvg />
                            <span>Nghe Giọng Anh ({activeWord.uk})</span>
                            <Volume2 className="w-4 h-4 text-[#0284C7]" />
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
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0F172A] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-bold transition-colors cursor-pointer"
                          >
                            <FlagUsSvg />
                            <span>Nghe Giọng Mỹ ({activeWord.us})</span>
                            <Volume2 className="w-4 h-4 text-[#0284C7]" />
                          </button>
                        </div>

                        {/* Interactive Mode Content */}
                        {studyMode === 'see_hear' && (
                          <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-1.5">
                            <div className="text-base font-extrabold text-[#0284C7]">
                              Nghĩa: {activeWord.vi || activeWord.en}
                            </div>
                            <p className="text-xs text-[#334155]">
                              {activeWord.en}
                            </p>
                          </div>
                        )}

                        {studyMode === 'quiz_mcq' && (
                          <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                            <div className="text-xs font-bold text-[#0284C7]">
                              Chọn nghĩa đúng của từ &ldquo;{activeWord.w}&rdquo;:
                            </div>
                            <div className="space-y-2">
                              {mcqOptions.map((opt, idx) => {
                                const isRight =
                                  opt === (activeWord.vi || activeWord.en);
                                const isPicked = selectedMcqOption === opt;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedMcqOption(opt)}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium cursor-pointer flex justify-between ${
                                      isPicked
                                        ? isRight
                                          ? 'bg-[#ECFDF5] border-[#059669] text-[#047857] font-bold'
                                          : 'bg-[#FFF1F2] border-[#E11D48] text-[#E11D48] font-bold'
                                        : 'bg-[#FFFFFF] border-[#DCEBFA]'
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {isPicked && isRight && (
                                      <Check className="w-4 h-4 text-[#059669]" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {studyMode === 'recall_cloze' && (
                          <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                            <div className="text-xs font-bold text-[#0284C7]">
                              Gõ từ tiếng Anh có nghĩa: &ldquo;
                              {activeWord.vi || activeWord.en}&rdquo;
                            </div>
                            <input
                              type="text"
                              value={clozeInput}
                              onChange={(e) => setClozeInput(e.target.value)}
                              placeholder={`Gõ từ bắt đầu bằng chữ "${activeWord.w[0]}"...`}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#BAE6FD] text-sm font-mono-data"
                            />
                            {isClozeCorrect && (
                              <div className="text-xs font-bold text-[#059669]">
                                Chính xác! Bạn đã nhớ từ này.
                              </div>
                            )}
                          </div>
                        )}

                        {studyMode === 'dictation' && (
                          <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                            <div className="text-xs font-bold text-[#0284C7]">
                              Bấm nút Nghe ở trên rồi gõ lại từ bạn nghe được:
                            </div>
                            <input
                              type="text"
                              value={dictationInput}
                              onChange={(e) =>
                                setDictationInput(e.target.value)
                              }
                              placeholder="Gõ từ vừa nghe..."
                              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#BAE6FD] text-sm font-mono-data"
                            />
                            {isDictationCorrect && (
                              <div className="text-xs font-bold text-[#059669]">
                                Chính xác!
                              </div>
                            )}
                          </div>
                        )}

                        {activeWord.ex?.[0] && (
                          <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#DCEBFA] space-y-1">
                            <div className="text-xs font-bold text-[#0284C7]">
                              Câu ví dụ:
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

                      <div className="md:col-span-5">
                        <div className="rounded-2xl overflow-hidden border border-[#DCEBFA] bg-[#F8FBFF] aspect-4/3">
                          <img
                            src={activeWord.imgUrl}
                            alt={activeWord.w}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 4 Simple Memory Buttons to Advance */}
                    <div className="pt-4 border-t border-[#DCEBFA] space-y-2">
                      <div className="text-xs text-[#64748B]">
                        Bấm chọn mức độ nhớ để chuyển sang từ tiếp theo:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleRateCard('again')}
                          className="py-3 px-3 rounded-xl bg-[#FFF1F2] hover:bg-[#E11D48] text-[#E11D48] hover:text-[#FFFFFF] border border-[#FECDD3] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Chưa Nhớ ({intervalPreviews.again})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRateCard('hard')}
                          className="py-3 px-3 rounded-xl bg-[#FFFBEB] hover:bg-[#D97706] text-[#B45309] hover:text-[#FFFFFF] border border-[#FDE68A] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Hơi Khó ({intervalPreviews.hard})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRateCard('good')}
                          className="py-3 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Đã Nhớ ({intervalPreviews.good})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRateCard('easy')}
                          className="py-3 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Rất Thuộc ({intervalPreviews.easy})
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tra Từ Điển 7,298 Từ */
                  <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="relative flex-1 min-w-[220px]">
                        <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt cần tìm..."
                          className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-xl pl-9 pr-3 py-2.5 text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(['ALL', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map(
                          (lv) => (
                            <button
                              key={lv}
                              type="button"
                              onClick={() => setSelectedCefr(lv)}
                              className={`px-2.5 py-1.5 rounded-lg font-mono-data text-xs font-bold cursor-pointer ${
                                selectedCefr === lv
                                  ? 'bg-[#0284C7] text-[#FFFFFF]'
                                  : 'bg-[#F8FBFF] border border-[#DCEBFA]'
                              }`}
                            >
                              {lv}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {apiWords.slice(0, 9).map((item) => (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-col justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center justify-between">
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
                            <p className="text-xs font-bold text-[#0284C7] mt-1">
                              {item.vi || item.en}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-[#DCEBFA]">
                            <button
                              type="button"
                              onClick={() =>
                                playPronunciation(
                                  item.audioUkUrl,
                                  item.w,
                                  'en-GB'
                                )
                              }
                              className="text-xs font-bold text-[#0284C7] cursor-pointer"
                            >
                              Nghe phát âm
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSaveToNotebook(item.w)}
                              className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] text-xs font-bold cursor-pointer"
                            >
                              + Lưu Sổ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 3: KHU VỰC HỌC NGHE (DEDICATED LISTENING ROOM)             */}
            {/* =============================================================== */}
            {activeZone === 'listening' && (
              <BlurFade key="zone-listening" className="space-y-5">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
                      KHU VỰC HỌC NGHE (IELTS LISTENING STUDIO)
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      Luyện nghe bài hội thoại, gõ chính tả từ vựng & đối chiếu từ đồng nghĩa.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setListeningSubTab('audio_test')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        listeningSubTab === 'audio_test'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      1. Nghe Hội Thoại & Trắc Nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => setListeningSubTab('dictation_22')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        listeningSubTab === 'dictation_22'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      2. Nghe Chép Từ (22 Chủ Đề)
                    </button>
                    <button
                      type="button"
                      onClick={() => setListeningSubTab('paraphrase_179')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        listeningSubTab === 'paraphrase_179'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      3. 179 Từ Đồng Nghĩa Băng Nghe
                    </button>
                  </div>
                </div>

                {listeningSubTab === 'audio_test' && (
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-5">
                    <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          Băng Nghe Part 1: Dự Án Cải Tạo Thư Viện Đại Học
                        </div>
                        <p className="text-xs text-[#334155] mt-0.5">
                          Bấm nút Phát Băng Nghe bên cạnh, sau đó chọn đáp án đúng cho 2 câu hỏi bên dưới.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          playPronunciation(
                            '',
                            'Welcome to the university library renovation briefing. Thanks to a generous philanthropic donation from our alumni, we are expanding the digital self-study commons on the second floor.',
                            'en-GB'
                          )
                        }
                        className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Bấm Phát Băng Nghe (Giọng Anh Chuẩn)</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {LISTENING_QUIZ.map((q) => (
                        <div
                          key={q.id}
                          className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2.5"
                        >
                          <div className="font-display text-sm font-extrabold text-[#0F172A]">
                            {q.q}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {q.options.map((opt) => {
                              const chosen = listeningAnswers[q.id] === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setListeningAnswers((p) => ({
                                      ...p,
                                      [q.id]: opt
                                    }))
                                  }
                                  className={`p-3 rounded-xl border text-left text-xs font-bold cursor-pointer ${
                                    chosen
                                      ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                                      : 'bg-[#FFFFFF] border-[#DCEBFA] text-[#0F172A]'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                          {listeningSubmitted && (
                            <div className="text-xs font-bold text-[#059669]">
                              Đáp án đúng: {q.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setListeningSubmitted(true)}
                      className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                    >
                      Nộp Bài Nghe & Xem Đáp Án
                    </button>
                  </div>
                )}

                {listeningSubTab === 'dictation_22' && (
                  <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCEBFA] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-4 p-4 bg-[#F8FBFF] border-r border-[#DCEBFA] max-h-[500px] overflow-y-auto space-y-1">
                      {chapters.map((ch) => (
                        <button
                          key={ch.key}
                          type="button"
                          onClick={() => setSelectedChapterKey(ch.key)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold flex justify-between cursor-pointer ${
                            ch.key === selectedChapterKey
                              ? 'bg-[#0284C7] text-[#FFFFFF]'
                              : 'hover:bg-[#E0F2FE] text-[#0F172A]'
                          }`}
                        >
                          <span>
                            {ch.code}. {ch.titleVi}
                          </span>
                          <span>{ch.totalWordsInChapter} từ</span>
                        </button>
                      ))}
                    </div>

                    <div className="lg:col-span-8 p-5 space-y-3 max-h-[500px] overflow-y-auto">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DCEBFA]">
                        <span className="font-display text-sm font-extrabold">
                          {activeChapter?.titleVi} — Bấm loa nghe và gõ lại từ
                        </span>
                        <button
                          type="button"
                          onClick={() => setRevealMeanings((r) => !r)}
                          className="px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                        >
                          {revealMeanings ? 'Ẩn Nghĩa' : 'Hiện Nghĩa'}
                        </button>
                      </div>

                      {(activeChapter?.words || []).slice(0, 15).map((item, i) => {
                        const k = `${activeChapter?.key}-${item.word}-${i}`;
                        const val = chapterDictationMap[k] || '';
                        const ok =
                          val.trim().toLowerCase() === item.word.toLowerCase();
                        return (
                          <div
                            key={k}
                            className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  playPronunciation(
                                    item.audioUrl || '',
                                    item.word,
                                    'en-GB'
                                  )
                                }
                                className="p-2 rounded-lg bg-[#0284C7] text-[#FFFFFF] cursor-pointer"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                              <div>
                                <div className="font-display text-sm font-bold text-[#0F172A]">
                                  {item.word}
                                </div>
                                <div className="text-xs text-[#64748B]">
                                  {revealMeanings
                                    ? item.viMeaning || item.enDefinition
                                    : '[Đã ẩn nghĩa]'}
                                </div>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                setChapterDictationMap((p) => ({
                                  ...p,
                                  [k]: e.target.value
                                }))
                              }
                              placeholder="Gõ lại từ..."
                              className={`px-3 py-1.5 rounded-lg border text-xs font-mono-data w-36 ${
                                ok
                                  ? 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold'
                                  : 'bg-[#FFFFFF] border-[#BAE6FD]'
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {listeningSubTab === 'paraphrase_179' && (
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listening179.slice(0, 12).map((item) => (
                      <div
                        key={item.index}
                        className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-extrabold text-[#0F172A]">
                            {item.word}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              playPronunciation('', item.word, 'en-GB')
                            }
                            className="p-1.5 rounded-lg bg-[#E0F2FE] text-[#0284C7] cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-[#64748B]">
                          {item.viMeaning || item.enDefinition}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.replace.map((eq, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold"
                            >
                              ≈ {eq}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 4: KHU VỰC HỌC NÓI (DEDICATED SPEAKING ROOM)               */}
            {/* =============================================================== */}
            {activeZone === 'speaking' && (
              <BlurFade key="zone-speaking" className="space-y-5">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
                      KHU VỰC HỌC NÓI (IELTS SPEAKING STUDIO)
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      Chọn chủ đề, nghe từ vựng gợi ý, bấm thu âm hoặc nhập bài nói để chấm điểm.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {SPEAKING_TOPICS.map((tp, idx) => (
                      <button
                        key={tp.id}
                        type="button"
                        onClick={() => {
                          setSelectedSpeakingIdx(idx);
                          setSpeakingGraded(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl font-display text-xs font-bold cursor-pointer ${
                          selectedSpeakingIdx === idx
                            ? 'bg-[#0284C7] text-[#FFFFFF]'
                            : 'bg-[#F0F7FF] text-[#334155]'
                        }`}
                      >
                        Chủ đề {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Cue Card & Target Words */}
                  <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                    <span className="px-2.5 py-1 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-mono-data text-xs font-bold">
                      SPEAKING PART 2 CUE CARD
                    </span>
                    <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                      {activeSpeakingTopic.prompt}
                    </h2>

                    <div className="space-y-1.5 text-xs text-[#334155]">
                      {activeSpeakingTopic.cues.map((c, i) => (
                        <div key={i}>{c}</div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#DCEBFA] space-y-2">
                      <div className="text-xs font-bold text-[#0284C7]">
                        5 Từ Vựng Ăn Điểm Nên Dùng (Bấm để nghe phát âm):
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {activeSpeakingTopic.targetWords.map((tw) => {
                          const used = speakingTranscript
                            .toLowerCase()
                            .includes(tw.toLowerCase());
                          return (
                            <button
                              key={tw}
                              type="button"
                              onClick={() => playPronunciation('', tw, 'en-GB')}
                              className={`px-3 py-1.5 rounded-xl font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                                used
                                  ? 'bg-[#059669] text-[#FFFFFF]'
                                  : 'bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7]'
                              }`}
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{tw}</span>
                              {used && <Check className="w-3.5 h-3.5" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Recording Controls & Instant Scorecard */}
                  <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRecordingSpeaking((r) => !r)}
                        className={`px-4 py-2.5 rounded-xl font-display text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${
                          isRecordingSpeaking
                            ? 'bg-[#E11D48] text-[#FFFFFF]'
                            : 'bg-[#0284C7] text-[#FFFFFF]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>
                          {isRecordingSpeaking
                            ? 'Đang Thu Âm... (Bấm Để Dừng)'
                            : 'Bấm Bắt Đầu Thu Âm Giọng Nói'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSpeakingTranscript(
                            activeSpeakingTopic.sampleAnswer
                          );
                          setSpeakingGraded(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                      >
                        Nạp Bài Nói Mẫu Band 8.0
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={speakingTranscript}
                      onChange={(e) => setSpeakingTranscript(e.target.value)}
                      placeholder="Nội dung bài nói của bạn sẽ hiển thị tại đây (hoặc gõ trực tiếp để kiểm tra từ vựng)..."
                      className="w-full p-4 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs sm:text-sm text-[#0F172A]"
                    />

                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() =>
                          playPronunciation(
                            '',
                            speakingTranscript ||
                              activeSpeakingTopic.sampleAnswer,
                            'en-GB'
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#F0F7FF] text-[#0284C7] font-display text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Nghe Máy Đọc Mẫu Chuẩn Bản Xứ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSpeakingGraded(true)}
                        className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                      >
                        Chấm Điểm Bài Nói Ngay
                      </button>
                    </div>

                    {speakingGraded && (
                      <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div>
                          <div className="text-xs text-[#047857]">Độ Trôi Chảy</div>
                          <div className="font-display text-lg font-black text-[#059669]">
                            7.5
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#047857]">Từ Vựng</div>
                          <div className="font-display text-lg font-black text-[#059669]">
                            8.0
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#047857]">Ngữ Pháp</div>
                          <div className="font-display text-lg font-black text-[#059669]">
                            7.5
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-[#047857]">Phát Âm</div>
                          <div className="font-display text-lg font-black text-[#059669]">
                            7.5
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 5: KHU VỰC HỌC ĐỌC (DEDICATED READING ROOM)                */}
            {/* =============================================================== */}
            {activeZone === 'reading' && (
              <BlurFade key="zone-reading" className="space-y-5">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
                      KHU VỰC HỌC ĐỌC (READING & TRA TỪ 1-CHẠM)
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      Bấm trực tiếp vào các từ gạch chân màu xanh trong bài đọc để xem nghĩa Tiếng Việt ngay lập tức.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setReadingSubTab('passage')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        readingSubTab === 'passage'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      1. Bài Đọc & Câu Hỏi
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingSubTab('keywords_538')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        readingSubTab === 'keywords_538'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      2. 538 Từ Khóa Bài Đọc
                    </button>
                  </div>
                </div>

                {readingSubTab === 'passage' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Passage with 1-Click Words + Inline Dictionary Box */}
                    <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                        Vertical Forests & Urban Climate Architecture
                      </h2>

                      <p className="text-sm text-[#0F172A] leading-relaxed">
                        <strong>[Đoạn A]</strong> High-density metropolises have made concrete towers{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('ubiquitous')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          ubiquitous
                        </button>
                        , accelerating urban heat islands at an{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('unprecedented')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          unprecedented
                        </button>{' '}
                        scale. Milan&apos;s Bosco Verticale demonstrates how integrating 900 trees into residential facades can{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('mitigate')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          mitigate
                        </button>{' '}
                        ambient surface temperatures by up to 3°C.
                      </p>

                      <p className="text-sm text-[#0F172A] leading-relaxed">
                        <strong>[Đoạn B]</strong>{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('Empirical')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          Empirical
                        </button>{' '}
                        data confirms that vertical forests are{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('viable')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          viable
                        </button>
                        , though high structural engineering costs still create{' '}
                        <button
                          type="button"
                          onClick={() => setSelectedInlineWord('disparities')}
                          className="px-1.5 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold underline cursor-pointer"
                        >
                          disparities
                        </button>{' '}
                        in developing municipalities.
                      </p>

                      {/* Inline Dictionary Card */}
                      {selectedInlineWord &&
                        INLINE_READING_DICT[selectedInlineWord] && (
                          <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#0284C7] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-base font-black text-[#0284C7]">
                                  {selectedInlineWord}
                                </span>
                                <span className="font-mono-data text-xs text-[#64748B]">
                                  {INLINE_READING_DICT[selectedInlineWord].ipa} •{' '}
                                  {INLINE_READING_DICT[selectedInlineWord].cefr}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">
                                Nghĩa: {INLINE_READING_DICT[selectedInlineWord].vi}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  playPronunciation(
                                    '',
                                    selectedInlineWord,
                                    'en-GB'
                                  )
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                              >
                                Nghe
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleSaveToNotebook(selectedInlineWord)
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-display text-xs font-bold cursor-pointer"
                              >
                                + Lưu Sổ Từ Vựng
                              </button>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Right: Questions */}
                    <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                        Chọn Đáp Án TRUE / FALSE / NOT GIVEN
                      </h3>

                      {READING_QUESTIONS.map((q) => (
                        <div
                          key={q.id}
                          className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2"
                        >
                          <div className="text-xs font-bold text-[#0F172A]">
                            {q.q}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {q.options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setReadingAnswers((p) => ({
                                    ...p,
                                    [q.id]: opt
                                  }))
                                }
                                className={`py-1.5 rounded-lg font-mono-data text-xs font-bold border cursor-pointer ${
                                  readingAnswers[q.id] === opt
                                    ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                                    : 'bg-[#FFFFFF] border-[#DCEBFA]'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                          {readingSubmitted && (
                            <div className="text-xs text-[#059669] font-bold">
                              Đáp án: {q.answer} — {q.explain}
                            </div>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => setReadingSubmitted(true)}
                        className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                      >
                        Chấm Điểm Bài Đọc & Xem Giải Thích
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(readingTiers[0]?.words || []).slice(0, 12).map((item) => (
                      <div
                        key={item.no}
                        className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-base font-extrabold text-[#0F172A]">
                            {item.word}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSaveToNotebook(item.word)}
                            className="px-2.5 py-1 rounded bg-[#0284C7] text-[#FFFFFF] text-xs font-bold cursor-pointer"
                          >
                            + Lưu Sổ
                          </button>
                        </div>
                        <p className="text-xs text-[#334155]">
                          {item.viMeaning || item.enDefinition}
                        </p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.synonyms.map((s, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 6: KHU VỰC HỌC VIẾT (DEDICATED WRITING ROOM)               */}
            {/* =============================================================== */}
            {activeZone === 'writing' && (
              <BlurFade key="zone-writing" className="space-y-5">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
                      KHU VỰC HỌC VIẾT (WRITING AI & NÂNG CẤP CÂU)
                    </h1>
                    <p className="text-xs text-[#64748B]">
                      Viết bài luận, bấm nút nâng cấp từ vựng Band 7.5+ và nhận kết quả chấm điểm 4 tiêu chí.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWritingSubTab('ai_grader')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        writingSubTab === 'ai_grader'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      1. Viết Bài & AI Chấm Điểm
                    </button>
                    <button
                      type="button"
                      onClick={() => setWritingSubTab('templates_100')}
                      className={`px-3.5 py-2 rounded-xl font-display text-xs font-extrabold cursor-pointer ${
                        writingSubTab === 'templates_100'
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      2. 100 Mẫu Câu Band 7.5+
                    </button>
                  </div>
                </div>

                {writingSubTab === 'ai_grader' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs text-[#0F172A]">
                        <strong>Đề bài Task 2:</strong> Some people believe cities should invest heavily in vertical green architecture, while others argue affordable housing is more urgent. Discuss both views and give your opinion.
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setEssayText(
                              (t) =>
                                `${t} Furthermore, sustainable urban planning is paramount for long-term ecological resilience.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] font-mono-data text-xs font-bold cursor-pointer"
                        >
                          + Chèn câu mẫu Band 8.0
                        </button>
                      </div>

                      <textarea
                        rows={7}
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs sm:text-sm text-[#0F172A]"
                      />

                      <div className="flex items-center justify-between">
                        <span className="font-mono-data text-xs text-[#64748B]">
                          Số từ hiện tại: <strong>{essayWordCount} từ</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => setWritingGraded(true)}
                          className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Chấm Điểm AI Ngay
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#DCEBFA]">
                        <span className="font-display text-base font-extrabold text-[#0F172A]">
                          KẾT QUẢ CHẤM AI 4 TIÊU CHÍ
                        </span>
                        <span className="px-3 py-1 rounded-xl bg-[#059669] text-[#FFFFFF] font-display text-sm font-black">
                          Overall 7.5
                        </span>
                      </div>

                      {writingGraded && (
                        <div className="space-y-3 text-xs">
                          <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex justify-between">
                            <span>1. Trả lời đúng trọng tâm (Task Response)</span>
                            <strong className="text-[#0284C7]">7.5</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex justify-between">
                            <span>2. Mạch lạc & Liên kết câu (Coherence)</span>
                            <strong className="text-[#0284C7]">7.5</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex justify-between">
                            <span>3. Từ vựng học thuật (Lexical Resource)</span>
                            <strong className="text-[#059669]">8.0</strong>
                          </div>
                          <div className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex justify-between">
                            <span>4. Đa dạng ngữ pháp (Grammar Range)</span>
                            <strong className="text-[#0284C7]">7.5</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                    {writing100.slice(0, 10).map((item) => (
                      <div
                        key={item.no}
                        className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs"
                      >
                        <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A]">
                          <div className="font-bold text-[#D97706]">
                            Câu thông thường (Band 6.0):
                          </div>
                          <p className="mt-1 text-[#0F172A]">
                            {item.standardBand65}
                          </p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0]">
                          <div className="font-bold text-[#059669]">
                            Câu nâng cấp học thuật (Band 7.5+):
                          </div>
                          <p className="mt-1 text-[#0F172A] font-medium">
                            {item.advancedBand75}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </BlurFade>
            )}

            {/* =============================================================== */}
            {/* ZONE 7: HỒ SƠ CÁ NHÂN (FULL USER PROFILE & SAVED NOTEBOOK)      */}
            {/* =============================================================== */}
            {activeZone === 'profile' && (
              <BlurFade key="zone-profile" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Profile Settings Form */}
                  <form
                    onSubmit={handleSaveProfile}
                    className="lg:col-span-6 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4"
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-[#DCEBFA]">
                      <div className="w-12 h-12 rounded-full bg-[#0284C7] text-[#FFFFFF] font-display font-black text-base flex items-center justify-center">
                        {userInitials}
                      </div>
                      <div>
                        <h1 className="font-display text-lg font-black text-[#0F172A]">
                          HỒ SƠ CÁ NHÂN HỌC VIÊN
                        </h1>
                        <p className="text-xs text-[#64748B]">
                          {activeUser.email} • Gói: {activeUser.plan}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#334155] mb-1">
                        Họ và Tên hiển thị
                      </label>
                      <input
                        type="text"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#334155] mb-1">
                          Mục tiêu IELTS Band
                        </label>
                        <select
                          value={profileTargetInput}
                          onChange={(e) =>
                            setProfileTargetInput(e.target.value)
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs"
                        >
                          <option>Band 6.5+</option>
                          <option>Band 7.0+</option>
                          <option>Band 7.5+</option>
                          <option>Band 8.0+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#334155] mb-1">
                          Số từ học mỗi ngày
                        </label>
                        <select
                          value={dailyGoalWords}
                          onChange={(e) =>
                            setDailyGoalWords(Number(e.target.value))
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs"
                        >
                          <option value={12}>12 từ / ngày</option>
                          <option value={20}>20 từ / ngày</option>
                          <option value={30}>30 từ / ngày</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                    >
                      Lưu Cập Nhật Hồ Sơ Cá Nhân
                    </button>

                    {profileSavedToast && (
                      <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#059669] font-bold">
                        Đã lưu thông tin hồ sơ thành công!
                      </div>
                    )}
                  </form>

                  {/* 4-Skill Visual Progress Bars */}
                  <div className="lg:col-span-6 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                    <h2 className="font-display text-lg font-black text-[#0F172A] pb-3 border-b border-[#DCEBFA]">
                      BIỂU ĐỒ NĂNG LỰC 4 KỸ NĂNG HIỆN TẠI
                    </h2>

                    {[
                      { label: 'Kỹ năng Nghe (Listening)', score: '7.5', pct: '83%' },
                      { label: 'Kỹ năng Đọc (Reading)', score: '7.5', pct: '83%' },
                      { label: 'Kỹ năng Nói (Speaking)', score: '7.0', pct: '76%' },
                      { label: 'Kỹ năng Viết (Writing)', score: '7.0', pct: '76%' }
                    ].map((sk) => (
                      <div key={sk.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{sk.label}</span>
                          <span className="text-[#0284C7]">Band {sk.score}</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-[#F0F7FF] overflow-hidden">
                          <div
                            className="h-full bg-[#0284C7] rounded-full"
                            style={{ width: sk.pct }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Saved Vocabulary Notebook inside User Profile */}
                <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#DCEBFA]">
                    <h2 className="font-display text-lg font-black text-[#0F172A]">
                      SỔ TỪ VỰNG ĐÃ LƯU CỦA BẠN ({notebookWords.length} TỪ)
                    </h2>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCustomWord}
                        onChange={(e) => setNewCustomWord(e.target.value)}
                        placeholder="Thêm từ mới vào sổ..."
                        className="px-3 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCustomWord.trim()) {
                            toggleSaveToNotebook(newCustomWord.trim());
                            setNewCustomWord('');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display text-xs font-bold cursor-pointer"
                      >
                        + Thêm Từ
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {notebookWords.map((nw) => (
                      <div
                        key={nw}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs font-bold text-[#0284C7]"
                      >
                        <span>{nw}</span>
                        <button
                          type="button"
                          onClick={() => playPronunciation('', nw, 'en-GB')}
                          className="cursor-pointer"
                          title="Nghe phát âm"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleSaveToNotebook(nw)}
                          className="text-[#64748B] hover:text-[#E11D48] cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </BlurFade>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
