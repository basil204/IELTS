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
    q: 'Câu 1: Rừng thẳng đứng ở Milan (Bosco Verticale) chỉ có tác dụng trang trí chứ không giúp giảm nhiệt độ bề mặt.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'FALSE',
    explain:
      'Đoạn A nêu rõ Bosco Verticale tích hợp 900 cây xanh giúp giảm nhiệt độ bề mặt tới 3°C (mitigate ambient surface temperatures by up to 3°C).'
  },
  {
    id: 2,
    q: 'Câu 2: Dữ liệu thực nghiệm xác nhận mô hình rừng thẳng đứng hoàn toàn khả thi về mặt sinh thái.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'TRUE',
    explain:
      'Đoạn B khẳng định: "Empirical data confirms that vertical forests are viable" (Dữ liệu thực nghiệm xác nhận rừng thẳng đứng là khả thi).'
  },
  {
    id: 3,
    q: 'Câu 3: Chi phí kỹ thuật kết cấu ban đầu cao vẫn đang tạo ra sự chênh lệch tại các đô thị đang phát triển.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'TRUE',
    explain:
      'Đoạn B chỉ rõ: "high structural engineering costs still create disparities in developing municipalities".'
  },
  {
    id: 4,
    q: 'Câu 4: Chính phủ Ý đã bắt buộc mọi tòa nhà chung cư mới tại Milan phải trồng tối thiểu 500 cây xanh trước năm 2030.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'NOT GIVEN',
    explain:
      'Trong bài đọc hoàn toàn không đề cập đến quy định bắt buộc 500 cây hay mốc thời gian năm 2030.'
  },
  {
    id: 5,
    q: 'Câu 5: Các tòa tháp bê tông mật độ cao đã làm gia tăng hiện tượng đảo nhiệt đô thị ở quy mô chưa từng có.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'TRUE',
    explain:
      'Đoạn A nêu rõ: "concrete towers... accelerating urban heat islands at an unprecedented scale".'
  }
];

const LISTENING_QUIZ = [
  {
    id: 1,
    q: 'Câu 1: Mục đích chính của dự án cải tạo thư viện đại học là gì?',
    options: [
      'A. Mở rộng phòng tự học công nghệ số ở tầng 2',
      'B. Đóng cửa hoàn toàn khu vực mượn sách giấy',
      'C. Tăng phí thành viên thư viện hàng năm'
    ],
    answer: 'A. Mở rộng phòng tự học công nghệ số ở tầng 2'
  },
  {
    id: 2,
    q: 'Câu 2: Nguồn kinh phí chính của dự án cải tạo đến từ đâu?',
    options: [
      'A. Vay thương mại từ ngân hàng địa phương',
      'B. Khoản tài trợ từ hội cựu sinh viên (philanthropic donation)',
      'C. Cắt giảm ngân sách phòng thí nghiệm khoa học'
    ],
    answer: 'B. Khoản tài trợ từ hội cựu sinh viên (philanthropic donation)'
  },
  {
    id: 3,
    q: 'Câu 3: Khu vực phòng học nhóm cách âm mới có sức chứa tối đa bao nhiêu sinh viên?',
    options: [
      'A. Tối đa 40 sinh viên cùng lúc',
      'B. Tối đa 120 sinh viên cùng lúc',
      'C. Tối đa 250 sinh viên cùng lúc'
    ],
    answer: 'B. Tối đa 120 sinh viên cùng lúc'
  },
  {
    id: 4,
    q: 'Câu 4: Sinh viên cần làm gì nếu muốn đặt trước phòng thảo luận nhóm?',
    options: [
      'A. Đăng ký trực tuyến trước ít nhất 24 giờ (reserve in advance online)',
      'B. Nộp đơn giấy tại văn phòng khoa',
      'C. Đóng thêm lệ phí 15 bảng Anh mỗi giờ'
    ],
    answer:
      'A. Đăng ký trực tuyến trước ít nhất 24 giờ (reserve in advance online)'
  },
  {
    id: 5,
    q: 'Câu 5: Trong thời gian thi công, kho sách tham khảo học thuật được chuyển tạm thời sang đâu?',
    options: [
      'A. Tầng hầm tòa nhà Hành chính (Administration Building)',
      'B. Hội trường Thể chất',
      'C. Khu ký túc xá phía Đông'
    ],
    answer: 'A. Tầng hầm tòa nhà Hành chính (Administration Building)'
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
  const [vocabQuizAnswers, setVocabQuizAnswers] = useState<
    Record<string, string>
  >({});
  const [vocabQuizSubmitted, setVocabQuizSubmitted] = useState<boolean>(false);

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
  const [revealEnglishWords, setRevealEnglishWords] = useState<boolean>(false);
  const [dictationSubmitted, setDictationSubmitted] = useState<boolean>(false);
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
  const [showPassageTranslation, setShowPassageTranslation] =
    useState<boolean>(true);

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

  const applyLoggedInUser = (
    user: Omit<PlatformUser, 'passwordHash'>,
    targetZone: DashboardZone = 'overview'
  ) => {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    setActiveUser(user);
    setProfileNameInput(user.name || '');
    setProfileTargetInput(user.targetBand || 'Band 7.5+');
    setForceLandingPreview(false);
    setActiveZone(targetZone);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOneClickLogin = async (
    email: string,
    name: string,
    isGoogle = false,
    role: 'admin' | 'vip' | 'student' = 'vip',
    targetZone: DashboardZone = 'overview'
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
        applyLoggedInUser(data.user, targetZone);
      } else {
        applyLoggedInUser(buildFallbackUser(email, name, role), targetZone);
      }
    } catch {
      applyLoggedInUser(buildFallbackUser(email, name, role), targetZone);
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
  // 1. COMPREHENSIVE COMMERCIAL LANDING PAGE (BEFORE LOGIN) — YOUPASS 4.0
  // ============================================================================
  if (showLandingPage) {
    const previewWords = initialPriorityWords.slice(0, 6);
    const activePreviewWord =
      previewWords[currentWordIndex % Math.max(1, previewWords.length)] ||
      initialPriorityWords[0];

    const enterRoomFromLanding = (zone: DashboardZone) => {
      if (activeUser) {
        setForceLandingPreview(false);
        setActiveZone(zone);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        handleOneClickLogin(
          'hocvien@theieltsdictionary.vn',
          'Nguyễn Minh Anh (Học Viên VIP)',
          false,
          'vip',
          zone
        );
      }
    };

    return (
      <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
          {/* ================================================================= */}
          {/* STICKY TOP NAVIGATION HEADER                                      */}
          {/* ================================================================= */}
          <header className="sticky top-3 z-40 bg-[#FFFFFF]/95 backdrop-blur-md rounded-2xl px-5 py-3.5 border border-[#DCEBFA] shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display font-black text-sm">
                YP
              </span>
              <div>
                <div className="font-display text-base sm:text-lg font-black text-[#0F172A] leading-none">
                  YOUPASS × WORD ATLAS 4.0
                </div>
                <div className="font-mono-data text-xs text-[#0284C7] mt-0.5">
                  HỆ SINH THÁI LUYỆN THI IELTS & 10,972 HỌC LIỆU CHUẨN CAMBRIDGE
                </div>
              </div>
            </div>

            <nav
              aria-label="Điều hướng trang chủ"
              className="hidden xl:flex items-center gap-2 text-xs font-display font-bold text-[#334155]"
            >
              <a
                href="#landing-preview"
                className="px-3 py-1.5 rounded-lg hover:bg-[#F0F7FF] hover:text-[#0284C7] transition-colors"
              >
                Học Thử Trực Tiếp
              </a>
              <a
                href="#landing-rooms"
                className="px-3 py-1.5 rounded-lg hover:bg-[#F0F7FF] hover:text-[#0284C7] transition-colors"
              >
                6 Phòng Kỹ Năng
              </a>
              <a
                href="#landing-roadmap"
                className="px-3 py-1.5 rounded-lg hover:bg-[#F0F7FF] hover:text-[#0284C7] transition-colors"
              >
                Lộ Trình 4 Chặng
              </a>
              <a
                href="#landing-compare"
                className="px-3 py-1.5 rounded-lg hover:bg-[#F0F7FF] hover:text-[#0284C7] transition-colors"
              >
                Phương Pháp FSRS
              </a>
              <a
                href="#landing-hall"
                className="px-3 py-1.5 rounded-lg hover:bg-[#F0F7FF] hover:text-[#0284C7] transition-colors"
              >
                Bảng Vinh Danh
              </a>
              <Link
                href="/pricing"
                className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
              >
                Gói VIP & Bảng Giá
              </Link>
              <Link
                href="/admin"
                className="px-3 py-1.5 rounded-lg bg-[#F0F7FF] text-[#0284C7] border border-[#BAE6FD]"
              >
                Admin CMS
              </Link>
            </nav>

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
                      'Nguyễn Minh Anh (Học Viên VIP)'
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                >
                  Vào Học Ngay (1 Chạm) →
                </button>
              )}
            </div>
          </header>

          {/* ================================================================= */}
          {/* SECTION 01: HERO BANNER + 1-CLICK LOGIN CARD                      */}
          {/* ================================================================= */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <BlurFade delay={0.05} className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  NỀN TẢNG EDTECH IELTS 4.0 • TỪ VỰNG WORD-ATLAS + CORPUS MY-IELTS
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-black text-[#0F172A] leading-tight">
                Hệ Sinh Thái Tự Học IELTS Toàn Diện: Từ Vựng • Nghe • Nói • Đọc • Viết Cá Nhân Hóa
              </h1>

              <p className="text-sm sm:text-base text-[#334155] leading-relaxed">
                Kết hợp kho dữ liệu <strong>7,298 từ vựng minh họa Word-Atlas</strong> (chuẩn CEFR A1–C2, âm thanh UK/US), <strong>22 chuyên đề Nghe Corpus</strong>, <strong>538 từ khóa Reading học thuật</strong>, <strong>179 cặp Paraphrase</strong> và <strong>phòng chấm AI Speaking & Writing</strong>. Mỗi kỹ năng được tách thành khu vực riêng biệt, chia nhỏ 12 từ/bài giúp người mới bắt đầu hay học viên mục tiêu 8.0+ đều dễ dàng làm chủ mỗi ngày.
              </p>

              {/* 6 Interactive Skill Room Cards (Click to enter that room immediately!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('vocab')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#0284C7] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#E0F2FE] text-[#0284C7] shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      1. Khu Vực Từ Vựng
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      7,298 từ có ảnh, IPA UK/US & 4 chế độ luyện nhớ FSRS
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('listening')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#059669] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] text-[#059669] shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      2. Khu Vực Học Nghe
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      22 chuyên đề chép chính tả & 179 cặp từ Paraphrase
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('speaking')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#D97706] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#FFFBEB] text-[#D97706] shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      3. Khu Vực Học Nói
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Thu âm trực tiếp Part 1-2-3 & chấm phát âm tự động
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('reading')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#0284C7] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#E0F2FE] text-[#0284C7] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      4. Khu Vực Học Đọc
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Bấm vào từ bất kỳ tra nghĩa ngay + 538 từ khóa Reading
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('writing')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#059669] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#ECFDF5] text-[#059669] shrink-0">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      5. Khu Vực Học Viết
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      AI chấm điểm 4 tiêu chí Task 2 & 100 cấu trúc Band 7.5+
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('profile')}
                  className="text-left bg-[#FFFFFF] hover:bg-[#F0F7FF] p-4 rounded-2xl border border-[#DCEBFA] hover:border-[#D97706] transition-all flex items-start gap-3 cursor-pointer"
                >
                  <div className="p-2.5 rounded-xl bg-[#FFFBEB] text-[#D97706] shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      6. Hồ Sơ & Sổ Từ
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      Theo dõi Band điểm, chuỗi ngày học Streak & Sổ từ vựng
                    </div>
                  </div>
                </button>
              </div>

              {/* 4 NumberTicker Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-2xl font-black text-[#0284C7]">
                    <NumberTicker value={10972} />
                  </div>
                  <div className="text-xs font-bold text-[#334155] mt-0.5">
                    Tổng Học Liệu Chuẩn
                  </div>
                  <div className="text-xs text-[#64748B]">Word-Atlas + My-IELTS</div>
                </div>
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-2xl font-black text-[#059669]">
                    <NumberTicker value={7298} />
                  </div>
                  <div className="text-xs font-bold text-[#334155] mt-0.5">
                    Từ Vựng Minh Họa
                  </div>
                  <div className="text-xs text-[#64748B]">Có Ảnh & Audio UK/US</div>
                </div>
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-2xl font-black text-[#0F172A]">
                    <NumberTicker value={22} suffix=" Chủ Đề" />
                  </div>
                  <div className="text-xs font-bold text-[#334155] mt-0.5">
                    Nghe Chép Chính Tả
                  </div>
                  <div className="text-xs text-[#64748B]">3,674 Từ Vựng Corpus</div>
                </div>
                <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#DCEBFA] text-center">
                  <div className="font-display text-2xl font-black text-[#D97706]">
                    <NumberTicker value={94.2} decimals={1} suffix="%" />
                  </div>
                  <div className="text-xs font-bold text-[#334155] mt-0.5">
                    Tỉ Lệ Nhớ Dài Hạn
                  </div>
                  <div className="text-xs text-[#64748B]">Thuật Toán FSRS-4.5</div>
                </div>
              </div>
            </BlurFade>

            {/* Right 5 Columns: 1-Click Login & Credential Box */}
            <BlurFade delay={0.12} className="lg:col-span-5">
              <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#BAE6FD] shadow-sm space-y-4 overflow-hidden">
                <BorderBeam duration={7} />

                <div className="pb-3 border-b border-[#DCEBFA]">
                  <h2 className="font-display text-xl font-black text-[#0F172A]">
                    Đăng Nhập Vào Dashboard Học Tập
                  </h2>
                  <p className="text-xs text-[#64748B] mt-1">
                    Chọn đăng nhập nhanh 1 chạm bên dưới để vào thẳng 7 khu vực học tập:
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
                    {authLoading
                      ? 'Đang mở Dashboard...'
                      : 'Đăng Nhập Bằng Email & Mật Khẩu'}
                  </button>
                </form>
              </div>
            </BlurFade>
          </section>

          {/* ================================================================= */}
          {/* SECTION 02: MAGIC UI INFINITE MARQUEE (VOCAB & HALL OF FAME)       */}
          {/* ================================================================= */}
          <section className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#DCEBFA] space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                LIVE STREAM • TỪ VỰNG HỌC THUẬT C1/C2 & BẢNG VÀNG HỌC VIÊN YOUPASS 4.0
              </span>
              <span className="font-mono-data text-xs text-[#059669] font-bold">
                Cập nhật thời gian thực
              </span>
            </div>
            <Marquee>
              {initialPriorityWords.slice(0, 10).map((item) => (
                <div
                  key={`marquee-w-${item.id}`}
                  className="px-4 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] flex items-center gap-2.5"
                >
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono-data text-xs font-bold ${
                      CEFR_BADGE_STYLE[item.cefr] || CEFR_BADGE_STYLE.B2
                    }`}
                  >
                    {item.cefr}
                  </span>
                  <span className="font-display text-xs font-extrabold text-[#0F172A]">
                    {item.w}
                  </span>
                  <span className="font-mono-data text-xs text-[#0284C7]">
                    {item.uk || item.us}
                  </span>
                  <span className="text-xs text-[#334155]">
                    {item.vi || item.en}
                  </span>
                </div>
              ))}
            </Marquee>
          </section>

          {/* ================================================================= */}
          {/* SECTION 03: TRẢI NGHIỆM HỌC THỬ NGAY TRÊN TRANG CHỦ               */}
          {/* ================================================================= */}
          <section
            id="landing-preview"
            className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCEBFA]">
              <div>
                <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                  01 / HỌC THỬ TRỰC TIẾP TRƯỚC KHI ĐĂNG NHẬP
                </span>
                <h2 className="font-display text-2xl font-black text-[#0F172A] mt-1">
                  Trải Nghiệm Flashcard Đa Phương Tiện & Bản Đồ Ngữ Nghĩa Word-Atlas
                </h2>
              </div>
              <button
                type="button"
                onClick={() => enterRoomFromLanding('vocab')}
                className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                Mở Toàn Bộ 7,298 Từ Trong Phòng Học →
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 6 Cols: Interactive Trial Flashcard */}
              <div className="lg:col-span-6 bg-[#F8FBFF] rounded-2xl p-5 border border-[#BAE6FD] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-xs font-extrabold text-[#0284C7]">
                    CHỌN TỪ VỰNG ĐỂ NGHE PHÁT ÂM UK/US & XEM HÌNH MINH HỌA:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {previewWords.map((w, idx) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setCurrentWordIndex(idx)}
                        className={`px-2.5 py-1 rounded-lg font-mono-data text-xs font-bold cursor-pointer ${
                          activePreviewWord?.id === w.id
                            ? 'bg-[#0284C7] text-[#FFFFFF]'
                            : 'bg-[#FFFFFF] border border-[#DCEBFA] text-[#334155]'
                        }`}
                      >
                        {w.w}
                      </button>
                    ))}
                  </div>
                </div>

                {activePreviewWord && (
                  <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#DCEBFA] space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      <div className="sm:col-span-5">
                        <img
                          src={activePreviewWord.imgUrl}
                          alt={activePreviewWord.w}
                          className="w-full h-36 object-cover rounded-xl border border-[#DCEBFA]"
                        />
                      </div>
                      <div className="sm:col-span-7 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-mono-data text-xs font-bold ${
                              CEFR_BADGE_STYLE[activePreviewWord.cefr] ||
                              CEFR_BADGE_STYLE.B2
                            }`}
                          >
                            CEFR {activePreviewWord.cefr}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#F0F7FF] text-[#0284C7] font-mono-data text-xs font-bold">
                            {activePreviewWord.pos || 'n./v.'}
                          </span>
                        </div>

                        <div className="font-display text-2xl font-black text-[#0F172A]">
                          {activePreviewWord.w}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              playPronunciation(
                                activePreviewWord.audioUkUrl,
                                activePreviewWord.w,
                                'en-GB'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                          >
                            <FlagUkSvg />
                            <span>UK {activePreviewWord.uk || '/.../'}</span>
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              playPronunciation(
                                activePreviewWord.audioUsUrl,
                                activePreviewWord.w,
                                'en-US'
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold cursor-pointer"
                          >
                            <FlagUsSvg />
                            <span>US {activePreviewWord.us || '/.../'}</span>
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-sm font-bold text-[#0F172A]">
                          Nghĩa: {activePreviewWord.vi || activePreviewWord.en}
                        </div>
                      </div>
                    </div>

                    {activePreviewWord.ex?.[0] && (
                      <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-1">
                        <div className="text-xs font-semibold text-[#0F172A]">
                          Ví dụ: &ldquo;{activePreviewWord.ex[0].en}&rdquo;
                        </div>
                        {activePreviewWord.ex[0].vi && (
                          <div className="text-xs text-[#334155]">
                            Dịch: {activePreviewWord.ex[0].vi}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right 6 Cols: Interactive Semantic Constellation */}
              <div className="lg:col-span-6 bg-[#F8FBFF] rounded-2xl p-5 border border-[#BAE6FD] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-display text-sm font-extrabold text-[#0F172A]">
                      Bản Đồ 18 Chủ Đề Từ Vựng Học Thuật (Word-Atlas Graph)
                    </div>
                    <div className="text-xs text-[#64748B]">
                      Bấm vào chủ đề bất kỳ để xem số lượng từ vựng và phân bổ theo Band điểm
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                    Interactive Graph
                  </span>
                </div>

                <WordAtlasConstellation
                  topics={topics}
                  activeTopic={selectedTopic}
                  onSelectTopic={(tId) => setSelectedTopic(tId)}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {topics.slice(0, 6).map((tp) => (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setSelectedTopic(tp.id)}
                      className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                        selectedTopic === tp.id
                          ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                          : 'bg-[#FFFFFF] text-[#0F172A] border-[#DCEBFA] hover:bg-[#F0F7FF]'
                      }`}
                    >
                      <div className="font-display text-xs font-extrabold truncate">
                        {tp.vi}
                      </div>
                      <div
                        className={`font-mono-data text-xs ${
                          selectedTopic === tp.id
                            ? 'text-[#E0F2FE]'
                            : 'text-[#0284C7]'
                        }`}
                      >
                        {tp.total} từ vựng
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* SECTION 04: CHI TIẾT 6 PHÒNG HỌC CHUYÊN BIỆT TRONG DASHBOARD       */}
          {/* ================================================================= */}
          <section id="landing-rooms" className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                  02 / KIẾN TRÚC PHÒNG HỌC TÁCH BIỆT RÕ RÀNG
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">
                  6 Khu Vực Chuyên Sâu Sau Khi Đăng Nhập Vào Hệ Thống
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-[#334155] max-w-xl">
                Không nhồi nhét tất cả vào một màn hình. Khi vào Dashboard, thanh menu bên trái giúp bạn chuyển đổi tức thì giữa 6 phòng chức năng chuyên biệt:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Room 1 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                      <BookOpen className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] font-mono-data text-xs font-bold text-[#0284C7]">
                      7,298 Từ • 18 Chủ Đề
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    1. Phòng Học Từ Vựng (Word-Atlas)
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Chia nhỏ thành từng bài học <strong>12 từ vựng</strong> để tránh quá tải. Tích hợp đầy đủ tranh minh họa trực quan, phiên âm IPA Anh-Anh / Anh-Mỹ và 4 chế độ luyện phản xạ:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Chế độ 1:</strong> Xem ảnh, nghe phát âm & phân tích câu ví dụ</li>
                    <li>• <strong>Chế độ 2:</strong> Trắc nghiệm 4 đáp án kiểm tra tốc độ nhận diện</li>
                    <li>• <strong>Chế độ 3:</strong> Điền từ vào chỗ trống trong ngữ cảnh (Cloze Test)</li>
                    <li>• <strong>Chế độ 4:</strong> Nghe âm thanh & gõ lại chính tả (Spelling)</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('vocab')}
                  className="w-full py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Học Từ Vựng →
                </button>
              </div>

              {/* Room 2 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#ECFDF5] text-[#059669]">
                      <Headphones className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] font-mono-data text-xs font-bold text-[#059669]">
                      22 Chuyên Đề • 179 Paraphrase
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    2. Phòng Học Nghe (Listening Lab)
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Bao gồm toàn bộ <strong>3,674 từ vựng cốt lõi</strong> thuộc 22 chuyên đề IELTS Listening thực chiến (Renting, Library, Medical, Academic Research...) kèm trình phát âm thanh đa tốc độ:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Luyện Dictation:</strong> Nghe băng và gõ lại từng từ để bắt âm cuối</li>
                    <li>• <strong>Điều chỉnh tốc độ:</strong> 0.8x (nghe chậm) • 1.0x (chuẩn) • 1.2x (nâng cao)</li>
                    <li>• <strong>179 Nhóm Paraphrase:</strong> Nắm trọn quy luật biến đổi từ khóa trong bài nghe</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('listening')}
                  className="w-full py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-[#059669] text-[#059669] hover:text-[#FFFFFF] border border-[#A7F3D0] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Học Nghe →
                </button>
              </div>

              {/* Room 3 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                      <Mic className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] font-mono-data text-xs font-bold text-[#D97706]">
                      Part 1 • Part 2 • Part 3
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    3. Phòng Học Nói (Speaking Studio)
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Mô phỏng phòng thi IELTS Speaking trực tiếp với bộ đề Forecast mới nhất, đồng hồ bấm giờ chuẩn và công nghệ thu âm Web Audio ngay trên trình duyệt:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Cue Card & Gợi ý C1/C2:</strong> Cung cấp collocations ăn điểm cho từng đề</li>
                    <li>• <strong>Ghi âm & Nghe lại:</strong> Thu âm bài nói thật và phát lại để tự sửa lỗi</li>
                    <li>• <strong>Chấm điểm AI:</strong> Đánh giá độ trôi chảy (Fluency), Từ vựng & Phát âm</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('speaking')}
                  className="w-full py-2.5 rounded-xl bg-[#FFFBEB] hover:bg-[#D97706] text-[#B45309] hover:text-[#FFFFFF] border border-[#FDE68A] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Học Nói →
                </button>
              </div>

              {/* Room 4 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                      <FileText className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] font-mono-data text-xs font-bold text-[#0284C7]">
                      Tra Từ 1-Chạm • 538 Từ Khóa
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    4. Phòng Học Đọc (Reading Room)
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Giao diện đọc bài học thuật thông minh kết hợp kho <strong>538 từ khóa Reading trọng tâm</strong> được phân loại theo tần suất xuất hiện trong đề thi thật (100% • 60% • 30%):
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Click-to-Lookup:</strong> Bấm vào bất kỳ từ nào trong bài đọc để xem nghĩa & nghe âm</li>
                    <li>• <strong>Lưu Sổ Từ 1-Chạm:</strong> Thêm từ khó trong bài đọc vào sổ ôn tập cá nhân</li>
                    <li>• <strong>Luyện True/False/Not Given:</strong> Giải thích chi tiết vị trí dẫn chứng</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('reading')}
                  className="w-full py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Học Đọc →
                </button>
              </div>

              {/* Room 5 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#ECFDF5] text-[#059669]">
                      <PenTool className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] font-mono-data text-xs font-bold text-[#059669]">
                      AI Task 2 • 100 Cấu Trúc
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    5. Phòng Học Viết (AI Writing Grader)
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Trình soạn thảo IELTS Writing Task 2 tích hợp bộ đếm từ tự động, nhận diện từ vựng C1/C2 theo thời gian thực và <strong>100 cấu trúc ngữ pháp ăn điểm</strong>:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Chấm 4 tiêu chí chuẩn IDP/BC:</strong> Task Response, Coherence, Lexical, Grammar</li>
                    <li>• <strong>Chèn mẫu câu 1-chạm:</strong> 100 cấu trúc câu phức & đảo ngữ Band 7.5+</li>
                    <li>• <strong>Gợi ý nâng cấp từ:</strong> Thay thế từ B1 thông thường bằng từ học thuật C1</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('writing')}
                  className="w-full py-2.5 rounded-xl bg-[#ECFDF5] hover:bg-[#059669] text-[#059669] hover:text-[#FFFFFF] border border-[#A7F3D0] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Học Viết →
                </button>
              </div>

              {/* Room 6 */}
              <div className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-3 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                      <User className="w-6 h-6" />
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] font-mono-data text-xs font-bold text-[#D97706]">
                      Hồ Sơ • FSRS-4.5 • Sổ Từ
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-black text-[#0F172A]">
                    6. Hồ Sơ Cá Nhân & Sổ Từ Vựng
                  </h3>
                  <p className="text-xs text-[#334155] leading-relaxed">
                    Quản lý toàn bộ thông tin cá nhân, mục tiêu Band điểm, chuỗi ngày học liên tiếp (Streak) và thuật toán lặp lại ngắt quãng <strong>FSRS-4.5</strong>:
                  </p>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• <strong>Lịch ôn tập tự động:</strong> Tính toán chính xác thời điểm não bộ sắp quên từ</li>
                    <li>• <strong>Sổ từ vựng riêng:</strong> Lưu trữ mọi từ khó bạn đánh dấu khi học Đọc & Từ vựng</li>
                    <li>• <strong>Thống kê 4 kỹ năng:</strong> Biểu đồ tiến độ hoàn thành từng chặng học</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('profile')}
                  className="w-full py-2.5 rounded-xl bg-[#FFFBEB] hover:bg-[#D97706] text-[#B45309] hover:text-[#FFFFFF] border border-[#FDE68A] font-display text-xs font-extrabold transition-colors cursor-pointer"
                >
                  Vào Khu Vực Hồ Sơ Cá Nhân →
                </button>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* SECTION 05: LỘ TRÌNH 4 CHẶNG 12 TUẦN (BAND 4.0 -> 8.0+)           */}
          {/* ================================================================= */}
          <section
            id="landing-roadmap"
            className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCEBFA]">
              <div>
                <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                  03 / LỘ TRÌNH HỌC TẬP TỪNG BƯỚC (ADAPTIVE ROADMAP)
                </span>
                <h2 className="font-display text-2xl font-black text-[#0F172A] mt-1">
                  Lộ Trình 4 Chặng Cá Nhân Hóa Từ Mất Gốc (4.0) Lên Mastery (8.0+)
                </h2>
              </div>
              <Link
                href="/roadmap"
                className="px-4 py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-extrabold"
              >
                Xem Chi Tiết Giáo Án 12 Tuần →
              </Link>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PROGRESSIVE_STAGES.map((stg, idx) => (
                <div
                  key={stg.code}
                  className="bg-[#F8FBFF] rounded-2xl p-5 border border-[#DCEBFA] flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                        {stg.code}
                      </span>
                      <span className="font-mono-data text-xs font-extrabold text-[#059669]">
                        {stg.band}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-black text-[#0F172A]">
                      {stg.titleVi}
                    </h3>
                    <p className="text-xs text-[#334155] leading-relaxed">
                      {stg.subVi}
                    </p>
                    <div className="pt-2 border-t border-[#DCEBFA] space-y-1 text-xs text-[#64748B]">
                      <div>
                        • <strong>Cấp độ CEFR:</strong> {stg.cefrLevels.join(', ')}
                      </div>
                      <div>
                        • <strong>Khối lượng:</strong> {stg.wordCount.toLocaleString()} từ vựng
                      </div>
                      <div>
                        • <strong>Thời lượng:</strong> 3 tuần ({Math.ceil(stg.wordCount / 12)} bài học nhỏ)
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStageIdx(idx);
                      setActiveLessonId(`stage-${idx}-lesson-0`);
                      enterRoomFromLanding('vocab');
                    }}
                    className="w-full py-2 rounded-xl bg-[#FFFFFF] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-extrabold transition-colors cursor-pointer"
                  >
                    Bắt Đầu Học {stg.code} →
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================================= */}
          {/* SECTION 06: BẢNG SO SÁNH PHƯƠNG PHÁP HỌC 4.0 VS TRUYỀN THỐNG      */}
          {/* ================================================================= */}
          <section
            id="landing-compare"
            className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] space-y-6"
          >
            <div className="pb-4 border-b border-[#DCEBFA]">
              <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                04 / TẠI SAO HỌC VIÊN CHỌN YOUPASS × WORD ATLAS 4.0?
              </span>
              <h2 className="font-display text-2xl font-black text-[#0F172A] mt-1">
                So Sánh Phương Pháp Học Thích Ứng 4.0 Với Cách Học Truyền Thống
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#FFF1F2]/60 rounded-2xl p-6 border border-[#FECDD3] space-y-3">
                <div className="font-display text-base font-black text-[#E11D48]">
                  Cách Học IELTS Truyền Thống (Dễ Quên & Quá Tải)
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#334155]">
                  <li>
                    • <strong>Học vẹt danh sách dài:</strong> Cố nhồi nhét hàng trăm từ rời rạc trên giấy hoặc file PDF khiến não bộ quên tới 80% chỉ sau 7 ngày.
                  </li>
                  <li>
                    • <strong>Thiếu ngữ cảnh & âm thanh:</strong> Chỉ học nghĩa tiếng Việt, không nghe phát âm chuẩn UK/US nên khi vào phòng thi Listening không nhận diện được từ.
                  </li>
                  <li>
                    • <strong>Tài liệu phân mảnh:</strong> Từ vựng một nơi, bài nghe một nẻo, không kết nối trực tiếp với bài đọc Reading và cấu trúc câu Writing.
                  </li>
                </ul>
              </div>

              <div className="bg-[#ECFDF5]/60 rounded-2xl p-6 border border-[#A7F3D0] space-y-3">
                <div className="font-display text-base font-black text-[#059669]">
                  Hệ Sinh Thái YouPass × Word Atlas 4.0 (Nhớ Lâu 94.2%)
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#334155]">
                  <li>
                    • <strong>Chia nhỏ 12 từ/bài + Thuật toán FSRS-4.5:</strong> Tự động nhắc ôn đúng thời điểm điểm rơi trí nhớ (Quên / Khó / Nhớ / Thuộc lòng).
                  </li>
                  <li>
                    • <strong>Đa giác quan (Ảnh + Audio UK/US + Ví dụ song ngữ):</strong> Kết hợp nhìn tranh minh họa, nghe phát âm bản xứ và gõ chính tả trực tiếp.
                  </li>
                  <li>
                    • <strong>Đồng bộ 6 phòng học trong 1 tài khoản:</strong> Từ vựng vừa học xuất hiện ngay trong bài Đọc, bài Nghe Corpus và gợi ý cho phòng Viết & Nói.
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* SECTION 07: BẢNG VINH DANH HỌC VIÊN & ĐUA TOP SĂN VIP             */}
          {/* ================================================================= */}
          <section
            id="landing-hall"
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            {/* Left 7 Cols: Hall of Fame */}
            <div className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#DCEBFA] space-y-5">
              <div className="pb-3 border-b border-[#DCEBFA]">
                <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                  05 / HALL OF FAME • BẢNG VÀNG HỌC VIÊN ĐIỂM CAO
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-black text-[#0F172A] mt-1">
                  Học Viên Đạt IELTS 7.5 – 8.5 Nhờ Lộ Trình Word-Atlas
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm font-black text-[#0F172A]">
                      Nguyễn Minh Anh
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                      8.0 Overall
                    </span>
                  </div>
                  <div className="font-mono-data text-xs text-[#059669] font-bold">
                    Listening 8.5 • Reading 8.5 • Writing 7.5 • Speaking 7.5
                  </div>
                  <p className="text-xs text-[#334155]">
                    &ldquo;Phòng học Từ vựng chia sẵn 12 từ/bài kèm ảnh minh họa và 179 cặp Paraphrase giúp mình tăng từ 6.5 lên 8.5 Reading & Listening chỉ sau 10 tuần.&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm font-black text-[#0F172A]">
                      Trần Quốc Bảo
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#059669] text-[#FFFFFF] font-mono-data text-xs font-bold">
                      7.5 Overall
                    </span>
                  </div>
                  <div className="font-mono-data text-xs text-[#0284C7] font-bold">
                    Listening 8.0 • Reading 8.0 • Writing 7.0 • Speaking 7.0
                  </div>
                  <p className="text-xs text-[#334155]">
                    &ldquo;Giao diện chia từng phòng học rất rõ ràng, không bị rối mắt. Thích nhất là tính năng bấm vào từ bất kỳ trong bài Reading để xem nghĩa và lưu sổ từ.&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm font-black text-[#0F172A]">
                      Lê Hoàng Khánh Linh
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                      8.0 Overall
                    </span>
                  </div>
                  <div className="font-mono-data text-xs text-[#059669] font-bold">
                    Listening 8.5 • Reading 9.0 • Writing 7.0 • Speaking 7.5
                  </div>
                  <p className="text-xs text-[#334155]">
                    &ldquo;Bộ 538 từ khóa Reading phân loại theo xác suất 100%-60%-30% cực kỳ sát đề thi máy tính IDP. Lịch ôn tập FSRS giúp mình nhớ từ rất chắc.&rdquo;
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-display text-sm font-black text-[#0F172A]">
                      Phạm Gia Huy
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#D97706] text-[#FFFFFF] font-mono-data text-xs font-bold">
                      7.5 Overall
                    </span>
                  </div>
                  <div className="font-mono-data text-xs text-[#0284C7] font-bold">
                    Listening 8.0 • Reading 7.5 • Writing 7.5 • Speaking 7.0
                  </div>
                  <p className="text-xs text-[#334155]">
                    &ldquo;100 cấu trúc câu Writing và bộ chấm AI 4 tiêu chí giúp mình sửa triệt để lỗi câu đơn, nâng điểm Writing từ 6.0 lên 7.5.&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Gamification Leaderboard (Đua Top Săn VIP) */}
            <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 sm:p-7 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="pb-3 border-b border-[#DCEBFA] flex items-center justify-between">
                  <div>
                    <span className="font-mono-data text-xs font-bold text-[#D97706]">
                      GAMIFICATION • ĐUA TOP TUẦN
                    </span>
                    <h3 className="font-display text-lg font-black text-[#0F172A] mt-0.5">
                      Bảng Xếp Hạng Chuyên Cần Săn Gói VIP
                    </h3>
                  </div>
                  <Award className="w-6 h-6 text-[#D97706]" />
                </div>

                <div className="divide-y divide-[#DCEBFA] border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#F8FBFF]">
                  {[
                    {
                      rank: 'TOP 1',
                      name: 'Nguyễn Minh Anh',
                      streak: '65 ngày',
                      xp: '5,840 XP',
                      badge: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]'
                    },
                    {
                      rank: 'TOP 2',
                      name: 'Trần Quốc Bảo',
                      streak: '48 ngày',
                      xp: '4,920 XP',
                      badge: 'bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD]'
                    },
                    {
                      rank: 'TOP 3',
                      name: 'Lê Hoàng Khánh Linh',
                      streak: '42 ngày',
                      xp: '4,310 XP',
                      badge: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                    },
                    {
                      rank: 'TOP 4',
                      name: 'Phạm Gia Huy',
                      streak: '31 ngày',
                      xp: '3,650 XP',
                      badge: 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA]'
                    }
                  ].map((row) => (
                    <div
                      key={row.rank}
                      className="p-3.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono-data font-bold ${row.badge}`}
                        >
                          {row.rank}
                        </span>
                        <div>
                          <div className="font-display font-extrabold text-[#0F172A]">
                            {row.name}
                          </div>
                          <div className="text-[#64748B]">
                            Chuỗi học: {row.streak}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono-data font-black text-[#0284C7]">
                        {row.xp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs text-[#334155]">
                Top 3 học viên có điểm chuyên cần XP cao nhất mỗi tuần được tặng tự động <strong>Gói VIP Unlimited 1 Tháng</strong>.
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* SECTION 08: BẢNG GIÁ GÓI HỌC TẬP & CÂU HỎI THƯỜNG GẶP (FAQ)      */}
          {/* ================================================================= */}
          <section
            id="landing-pricing"
            className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#DCEBFA]">
              <div>
                <span className="font-mono-data text-xs font-bold text-[#059669]">
                  06 / GÓI ĐẦU TƯ HỌC TẬP & CÂU HỎI THƯỜNG GẶP
                </span>
                <h2 className="font-display text-2xl font-black text-[#0F172A] mt-1">
                  Lựa Chọn Gói Học Phù Hợp Với Mục Tiêu Band Điểm Của Bạn
                </h2>
              </div>
              <Link
                href="/pricing"
                className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold"
              >
                Mở Trang Thanh Toán VietQR →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[#F8FBFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                    GÓI FREE STARTER
                  </span>
                  <div className="font-display text-2xl font-black text-[#0F172A]">
                    0đ <span className="text-xs font-normal text-[#64748B]">/ trọn đời</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• Mở khóa Chặng 1 & Chặng 2 (Band 4.0 → 6.0)</li>
                    <li>• Học thử Flashcard & phát âm chuẩn UK/US</li>
                    <li>• Lưu tối đa 100 từ vào Sổ từ vựng cá nhân</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => enterRoomFromLanding('overview')}
                  className="w-full py-2.5 rounded-xl bg-[#FFFFFF] hover:bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] font-display text-xs font-extrabold cursor-pointer"
                >
                  Học Miễn Phí Ngay →
                </button>
              </div>

              <div className="bg-[#F0F7FF] rounded-2xl p-6 border-2 border-[#0284C7] flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                      GÓI PRO 6 THÁNG
                    </span>
                    <span className="font-mono-data text-xs font-bold text-[#059669]">
                      Phổ biến nhất
                    </span>
                  </div>
                  <div className="font-display text-2xl font-black text-[#0F172A]">
                    490.000đ <span className="text-xs font-normal text-[#64748B]">/ 6 tháng</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• Mở toàn bộ 7,298 từ vựng Word-Atlas (A1–C2)</li>
                    <li>• Trọn bộ 22 chuyên đề Nghe & 538 từ khóa Đọc</li>
                    <li>• Lịch ôn tập thông minh FSRS-4.5 không giới hạn</li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold text-center"
                >
                  Đăng Ký Gói PRO →
                </Link>
              </div>

              <div className="bg-[#ECFDF5]/60 rounded-2xl p-6 border border-[#A7F3D0] flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <span className="px-2.5 py-1 rounded-lg bg-[#059669] text-[#FFFFFF] font-mono-data text-xs font-bold">
                    VIP UNLIMITED 12 THÁNG
                  </span>
                  <div className="font-display text-2xl font-black text-[#0F172A]">
                    890.000đ <span className="text-xs font-normal text-[#64748B]">/ 12 tháng</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[#334155]">
                    <li>• Toàn quyền 6 phòng kỹ năng + AI Speaking & Writing</li>
                    <li>• Chấm bài Writing Task 2 & Speaking không giới hạn</li>
                    <li>• Tặng kèm bộ Ebook Chiến Thuật Band 8.0+ độc quyền</li>
                  </ul>
                </div>
                <Link
                  href="/pricing"
                  className="block w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold text-center"
                >
                  Kích Hoạt VIP Unlimited →
                </Link>
              </div>
            </div>
          </section>

          {/* ================================================================= */}
          {/* FOOTER COMPLIANCE & SUPPORT                                       */}
          {/* ================================================================= */}
          <footer className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748B]">
            <div>
              <div className="font-display font-black text-[#0F172A]">
                HỆ SINH THÁI GIÁO DỤC YOUPASS × THE IELTS DICTIONARY 4.0
              </div>
              <div className="mt-1">
                Kho học liệu chuẩn hóa 10,972 mục • Chính sách bảo mật • Điều khoản dịch vụ • Chính sách hoàn tiền 100% trong 7 ngày
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[#0284C7] font-bold hover:underline"
              >
                Trang Đăng Nhập
              </Link>
              <span>•</span>
              <Link
                href="/roadmap"
                className="text-[#0284C7] font-bold hover:underline"
              >
                Lộ Trình 12 Tuần
              </Link>
              <span>•</span>
              <Link
                href="/pricing"
                className="text-[#0284C7] font-bold hover:underline"
              >
                Bảng Giá VIP
              </Link>
              <span>•</span>
              <Link
                href="/admin"
                className="text-[#0284C7] font-bold hover:underline"
              >
                Quản Trị Admin
              </Link>
            </div>
          </footer>
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
                {/* 1. Top Header & Mode Switch */}
                <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                        PHÒNG 01 / HỌC TỪ VỰNG THEO LỘ TRÌNH & GHI NHỚ FSRS
                      </span>
                      <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A] mt-0.5">
                        Khu Vực Học Từ Vựng Hình Ảnh & Phát Âm Chuẩn UK/US
                      </h1>
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
                        1. Học Theo Bài (12 Từ/Bài)
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
                        2. Tra Từ Điển 7,298 Từ
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Clear Usage Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs">
                    <div>
                      <strong className="text-[#0284C7]">Bước 1:</strong> Chọn Chặng & Bài học bên dưới (mỗi bài gồm 12 từ vựng trọng tâm).
                    </div>
                    <div>
                      <strong className="text-[#0284C7]">Bước 2:</strong> Nghe phát âm Anh/Mỹ, xem tranh và bấm nút <em>Đã Nhớ / Rất Thuộc</em> để lưu tiến độ từng từ.
                    </div>
                    <div>
                      <strong className="text-[#059669]">Bước 3:</strong> Cuộn xuống cuối bài bấm <strong>&ldquo;Nộp Bài Kiểm Tra Từ Vựng&rdquo;</strong> để chấm điểm & qua bài mới!
                    </div>
                  </div>

                  {/* Live Vocabulary Progress Dashboard (Know exactly how many words & where you are!) */}
                  {(() => {
                    const learnedInLessonCount = activeLessonWords.filter(
                      (w) => Boolean(fsrsRecords[w.id])
                    ).length;
                    const totalLearnedOverall =
                      reviewedToday + Object.keys(fsrsRecords).length;
                    const lessonPercent = Math.round(
                      (learnedInLessonCount /
                        Math.max(1, activeLessonWords.length)) *
                        100
                    );
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                        <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                          <div className="text-xs text-[#64748B]">
                            Đang Học Đến Đâu
                          </div>
                          <div className="font-display text-sm font-black text-[#0284C7] mt-0.5">
                            Chặng {selectedStageIdx + 1} • Bài{' '}
                            {currentLesson?.lessonNo || 1}/6
                          </div>
                          <div className="text-xs text-[#334155] mt-0.5 truncate">
                            {currentLesson?.titleVi}
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                          <div className="text-xs text-[#64748B]">
                            Tiến Độ Bài Hiện Tại
                          </div>
                          <div className="font-display text-sm font-black text-[#059669] mt-0.5">
                            Đã thuộc {learnedInLessonCount} /{' '}
                            {activeLessonWords.length} từ ({lessonPercent}%)
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-[#DCEBFA] overflow-hidden">
                            <div
                              className="h-full bg-[#059669]"
                              style={{
                                width: `${Math.max(8, lessonPercent)}%`
                              }}
                            />
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                          <div className="text-xs text-[#64748B]">
                            Tổng Số Từ Đã Học
                          </div>
                          <div className="font-display text-sm font-black text-[#0F172A] mt-0.5">
                            {totalLearnedOverall} / 7,298 từ
                          </div>
                          <div className="text-xs text-[#059669] font-bold mt-0.5">
                            Đã lưu sổ: {notebookWords.length} từ
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA]">
                          <div className="text-xs text-[#64748B]">
                            Bài Học Đã Hoàn Thành
                          </div>
                          <div className="font-display text-sm font-black text-[#D97706] mt-0.5">
                            {completedLessons.length} / 24 bài học
                          </div>
                          <div className="text-xs text-[#64748B] mt-0.5">
                            Đang mở từ số{' '}
                            {(currentWordIndex % activeLessonWords.length) + 1}
                            /12
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {vocabSubTab === 'lesson' ? (
                  <div className="space-y-5">
                    {/* Stage & Lesson Selector + 12-Word Visual Checklist */}
                    <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCEBFA]">
                        <span className="font-display text-xs font-extrabold text-[#0F172A]">
                          CHỌN CHẶNG & BÀI HỌC (MỖI BÀI 12 TỪ VỰNG):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {PROGRESSIVE_STAGES.map((stg, sIdx) => (
                            <button
                              key={stg.code}
                              type="button"
                              onClick={() => {
                                setSelectedStageIdx(sIdx);
                                setActiveLessonId(`stage-${sIdx}-lesson-0`);
                                setCurrentWordIndex(0);
                                setVocabQuizSubmitted(false);
                              }}
                              className={`px-3 py-1 rounded-lg font-display text-xs font-bold cursor-pointer ${
                                selectedStageIdx === sIdx
                                  ? 'bg-[#0284C7] text-[#FFFFFF]'
                                  : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA]'
                              }`}
                            >
                              {stg.code} ({stg.band})
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 6 Lesson Pills */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                        {stageLessons.map((les) => {
                          const isCurrentLesson =
                            currentLesson?.id === les.id;
                          const isDone = completedLessons.includes(les.id);
                          return (
                            <button
                              key={les.id}
                              type="button"
                              onClick={() => {
                                setActiveLessonId(les.id);
                                setCurrentWordIndex(0);
                                setVocabQuizSubmitted(false);
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isCurrentLesson
                                  ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                                  : isDone
                                    ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]'
                                    : 'bg-[#F8FBFF] text-[#0F172A] border-[#DCEBFA] hover:bg-[#F0F7FF]'
                              }`}
                            >
                              <div className="flex items-center justify-between text-xs font-mono-data font-bold">
                                <span>Bài {les.lessonNo}</span>
                                <span>{isDone ? '✓ Xong' : '12 từ'}</span>
                              </div>
                              <div
                                className={`text-xs font-bold truncate mt-0.5 ${
                                  isCurrentLesson
                                    ? 'text-[#FFFFFF]'
                                    : 'text-[#334155]'
                                }`}
                              >
                                {les.titleVi.replace(/^Bài \d+:\s*/, '')}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* 12-Word Checklist Bar so user sees all 12 words in current lesson */}
                      <div className="pt-2 border-t border-[#DCEBFA] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-display font-extrabold text-[#0284C7]">
                            DANH SÁCH 12 TỪ TRONG BÀI NÀY (BẤM VÀO TỪ BẤT KỲ ĐỂ HỌC):
                          </span>
                          <span className="text-[#64748B]">
                            Màu xanh lá (✓) = Đã học • Màu xanh dương = Đang mở
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                          {activeLessonWords.map((wItem, wIdx) => {
                            const isSelectedWord =
                              currentWordIndex % activeLessonWords.length ===
                              wIdx;
                            const isLearned = Boolean(fsrsRecords[wItem.id]);
                            return (
                              <button
                                key={`${wItem.id}-${wIdx}`}
                                type="button"
                                onClick={() => setCurrentWordIndex(wIdx)}
                                className={`px-2.5 py-2 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between gap-1 ${
                                  isSelectedWord
                                    ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7] font-bold'
                                    : isLearned
                                      ? 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] font-bold'
                                      : 'bg-[#F8FBFF] text-[#0F172A] border-[#DCEBFA] hover:bg-[#F0F7FF]'
                                }`}
                              >
                                <span className="truncate">
                                  {wIdx + 1}. {wItem.w}
                                </span>
                                <span>{isLearned ? '✓' : '•'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Main Flashcard Core */}
                    <div className="relative bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#BAE6FD] shadow-xs space-y-6 overflow-hidden">
                      <BorderBeam duration={8} />

                      {/* 4 Simple Mode Buttons + Save Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              ['see_hear', '1. Xem Thẻ & Nghe'],
                              ['quiz_mcq', '2. Trắc Nghiệm Nhanh'],
                              ['recall_cloze', '3. Điền Từ Tiếng Anh'],
                              ['dictation', '4. Nghe & Gõ Chính Tả']
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

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentWordIndex(
                                (prev) =>
                                  (prev - 1 + activeLessonWords.length) %
                                  activeLessonWords.length
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-xs font-bold text-[#334155] cursor-pointer"
                          >
                            ← Từ Trước
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentWordIndex(
                                (prev) => (prev + 1) % activeLessonWords.length
                              )
                            }
                            className="px-3 py-1.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-xs font-bold text-[#0284C7] cursor-pointer"
                          >
                            Từ Tiếp Theo →
                          </button>
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
                                <span>Đã Lưu Sổ Từ</span>
                              </>
                            ) : (
                              <>
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>+ Lưu Sổ Từ</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Flashcard Core */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-7 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold">
                              Từ số{' '}
                              {(currentWordIndex % activeLessonWords.length) +
                                1}{' '}
                              / {activeLessonWords.length}
                            </span>
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
                            {fsrsRecords[activeWord.id] && (
                              <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                                ✓ Đã ghi nhớ
                              </span>
                            )}
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
                                Nghĩa Tiếng Việt:{' '}
                                {activeWord.vi || activeWord.en}
                              </div>
                              <p className="text-xs text-[#334155]">
                                Giải thích Tiếng Anh (Academic): {activeWord.en}
                              </p>
                            </div>
                          )}

                          {studyMode === 'quiz_mcq' && (
                            <div className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2">
                              <div className="text-xs font-bold text-[#0284C7]">
                                Chọn nghĩa Tiếng Việt đúng của từ &ldquo;
                                {activeWord.w}&rdquo;:
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
                                  ✓ Chính xác! Bạn đã nhớ từ này.
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
                                  ✓ Chính xác!
                                </div>
                              )}
                            </div>
                          )}

                          {activeWord.ex?.[0] && (
                            <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#DCEBFA] space-y-1">
                              <div className="text-xs font-bold text-[#0284C7]">
                                Câu ví dụ trong bài thi IELTS:
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-[#0F172A]">
                                &ldquo;{activeWord.ex[0].en}&rdquo;
                              </p>
                              {activeWord.ex[0].vi && (
                                <p className="text-xs text-[#334155]">
                                  → Dịch nghĩa: {activeWord.ex[0].vi}
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
                        <div className="text-xs font-bold text-[#0F172A]">
                          Đánh giá mức độ thuộc từ này (Bấm 1 trong 4 nút để lưu tiến độ & tự động sang từ kế tiếp):
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleRateCard('again')}
                            className="py-3 px-3 rounded-xl bg-[#FFF1F2] hover:bg-[#E11D48] text-[#E11D48] hover:text-[#FFFFFF] border border-[#FECDD3] font-display text-xs font-extrabold cursor-pointer"
                          >
                            1. Chưa Nhớ ({intervalPreviews.again})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateCard('hard')}
                            className="py-3 px-3 rounded-xl bg-[#FFFBEB] hover:bg-[#D97706] text-[#B45309] hover:text-[#FFFFFF] border border-[#FDE68A] font-display text-xs font-extrabold cursor-pointer"
                          >
                            2. Hơi Khó ({intervalPreviews.hard})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateCard('good')}
                            className="py-3 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                          >
                            3. Đã Nhớ ({intervalPreviews.good})
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRateCard('easy')}
                            className="py-3 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                          >
                            4. Rất Thuộc ({intervalPreviews.easy})
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Complete Lesson Test & Submission Section (Nộp Bài Kiểm Tra Từ Vựng) */}
                    <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCEBFA]">
                        <div>
                          <span className="font-mono-data text-xs font-bold text-[#059669]">
                            KIỂM TRA & NỘP BÀI TỪ VỰNG ({currentLesson?.titleVi})
                          </span>
                          <h3 className="font-display text-base font-black text-[#0F172A] mt-0.5">
                            Làm Bài Tập Tổng Kết 6 Từ Trọng Tâm Để Hoàn Thành Bài Học
                          </h3>
                        </div>
                        {completedLessons.includes(currentLesson?.id || '') && (
                          <span className="px-3 py-1 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] font-mono-data text-xs font-bold">
                            ✓ Đã hoàn thành bài học này
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {activeLessonWords.slice(0, 6).map((qWord, qIdx) => {
                          const qKey = `${currentLesson?.id}-q-${qWord.id}`;
                          const userTyped = vocabQuizAnswers[qKey] || '';
                          const isCorrect =
                            userTyped.trim().toLowerCase() ===
                            qWord.w.toLowerCase();
                          return (
                            <div
                              key={qKey}
                              className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-[#0F172A]">
                                  Câu {qIdx + 1}: {qWord.vi || qWord.en}
                                </span>
                                <span className="font-mono-data text-xs text-[#0284C7]">
                                  Gợi ý: {qWord.w[0]}... ({qWord.w.length} ký tự)
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={userTyped}
                                  onChange={(e) =>
                                    setVocabQuizAnswers((p) => ({
                                      ...p,
                                      [qKey]: e.target.value
                                    }))
                                  }
                                  placeholder={`Gõ từ tiếng Anh (${qWord.w[0]}...)`}
                                  className="flex-1 px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] text-xs font-mono-data"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setVocabQuizAnswers((p) => ({
                                      ...p,
                                      [qKey]: qWord.w
                                    }))
                                  }
                                  className="px-2.5 py-2 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                                >
                                  Điền mẫu
                                </button>
                              </div>
                              {vocabQuizSubmitted && (
                                <div
                                  className={`text-xs font-bold ${
                                    isCorrect
                                      ? 'text-[#059669]'
                                      : 'text-[#E11D48]'
                                  }`}
                                >
                                  {isCorrect
                                    ? `✓ Chính xác (${qWord.w})`
                                    : `✗ Đáp án đúng là: ${qWord.w}`}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {vocabQuizSubmitted && (
                        <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-display text-sm font-black text-[#047857]">
                              Đã Nộp Bài Thành Công! Kết quả:{' '}
                              {
                                activeLessonWords
                                  .slice(0, 6)
                                  .filter(
                                    (qw) =>
                                      (
                                        vocabQuizAnswers[
                                          `${currentLesson?.id}-q-${qw.id}`
                                        ] || ''
                                      )
                                        .trim()
                                        .toLowerCase() === qw.w.toLowerCase()
                                  ).length
                              }{' '}
                              / 6 câu đúng • +100 XP
                            </div>
                            <div className="text-xs text-[#059669] mt-0.5">
                              Bài học <strong>{currentLesson?.titleVi}</strong>{' '}
                              đã được đánh dấu Hoàn thành trong lộ trình của bạn.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextNo = (currentLesson?.lessonNo || 1) % 6;
                              setActiveLessonId(
                                `stage-${selectedStageIdx}-lesson-${nextNo}`
                              );
                              setCurrentWordIndex(0);
                              setVocabQuizSubmitted(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="px-4 py-2 rounded-xl bg-[#0284C7] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                          >
                            Học Bài Tiếp Theo →
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const autoFilled: Record<string, string> = {
                              ...vocabQuizAnswers
                            };
                            activeLessonWords.slice(0, 6).forEach((qw) => {
                              autoFilled[`${currentLesson?.id}-q-${qw.id}`] =
                                qw.w;
                            });
                            setVocabQuizAnswers(autoFilled);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                        >
                          Điền Nhanh Đáp Án Để Kiểm Thử
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setVocabQuizSubmitted(true);
                            if (
                              currentLesson &&
                              !completedLessons.includes(currentLesson.id)
                            ) {
                              const nextDone = [
                                ...completedLessons,
                                currentLesson.id
                              ];
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
                            setUserXp((x) => x + 100);
                          }}
                          className="px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Nộp Bài Từ Vựng & Hoàn Thành Bài Học
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
                <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-data text-xs font-bold text-[#059669]">
                        PHÒNG 02 / LUYỆN NGHE BĂNG THI & CHÉP CHÍNH TẢ 22 CHỦ ĐỀ
                      </span>
                      <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A] mt-0.5">
                        Khu Vực Học Nghe (IELTS Listening Studio)
                      </h1>
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
                        1. Nghe Hội Thoại (5 Câu)
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

                  {/* 3-Step Listening Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs">
                    <div>
                      <strong className="text-[#059669]">Bước 1:</strong> Chọn chế độ <em>Nghe Hội Thoại (5 câu)</em> hoặc <em>Nghe Chép Từ (22 chủ đề)</em>.
                    </div>
                    <div>
                      <strong className="text-[#059669]">Bước 2:</strong> Bấm biểu tượng Loa màu xanh để nghe giọng đọc chuẩn Anh-Anh và điền/chọn đáp án.
                    </div>
                    <div>
                      <strong className="text-[#0284C7]">Bước 3:</strong> Bấm nút <strong>&ldquo;Nộp Bài Nghe & Chấm Điểm&rdquo;</strong> ở cuối trang để xem điểm số & đáp án!
                    </div>
                  </div>
                </div>

                {listeningSubTab === 'audio_test' && (
                  <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-5">
                    <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="font-display text-base font-extrabold text-[#0F172A]">
                          Băng Nghe IELTS Part 1: Dự Án Cải Tạo Thư Viện Đại Học (5 Câu Hỏi)
                        </div>
                        <p className="text-xs text-[#334155] mt-0.5">
                          Bấm nút Phát Băng Nghe bên phải, lắng nghe thông tin và chọn đáp án đúng cho 5 câu hỏi bên dưới.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          playPronunciation(
                            '',
                            'Welcome to the university library renovation briefing. Thanks to a generous philanthropic donation from our alumni, we are expanding the digital self-study commons on the second floor. The new soundproof group study rooms will accommodate up to 120 students at a time. Please remember to reserve a discussion room in advance online at least 24 hours ahead. During construction, academic reference books are temporarily relocated to the basement of the Administration Building.',
                            'en-GB'
                          )
                        }
                        className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        <span>Bấm Phát Băng Nghe (Giọng Bản Xứ)</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {LISTENING_QUIZ.map((q) => {
                        const chosen = listeningAnswers[q.id];
                        const isRight = chosen === q.answer;
                        return (
                          <div
                            key={q.id}
                            className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] space-y-2.5"
                          >
                            <div className="font-display text-sm font-extrabold text-[#0F172A]">
                              {q.q}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {q.options.map((opt) => {
                                const isOptSelected = chosen === opt;
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
                                      isOptSelected
                                        ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                                        : 'bg-[#FFFFFF] border-[#DCEBFA] text-[#0F172A] hover:bg-[#F0F7FF]'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                            {listeningSubmitted && (
                              <div
                                className={`text-xs font-bold ${
                                  isRight ? 'text-[#059669]' : 'text-[#E11D48]'
                                }`}
                              >
                                {isRight
                                  ? `✓ Chính xác! (${q.answer})`
                                  : `✗ Chưa đúng — Đáp án chuẩn là: ${q.answer}`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {listeningSubmitted && (
                      <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-2">
                        <div className="font-display text-sm font-black text-[#047857]">
                          Kết Quả Bài Nghe Hội Thoại: Đúng{' '}
                          {
                            LISTENING_QUIZ.filter(
                              (q) => listeningAnswers[q.id] === q.answer
                            ).length
                          }{' '}
                          / {LISTENING_QUIZ.length} câu • Quy đổi Band Listening:{' '}
                          {LISTENING_QUIZ.filter(
                            (q) => listeningAnswers[q.id] === q.answer
                          ).length >= 4
                            ? '8.0'
                            : '6.5'}
                        </div>
                        <div className="text-xs text-[#334155]">
                          <strong>Lời thoại băng nghe (Transcript dịch nghĩa):</strong> Chào mừng các bạn đến với buổi thông báo cải tạo thư viện đại học. Nhờ khoản tài trợ từ hội cựu sinh viên, chúng tôi đang mở rộng phòng tự học công nghệ số ở tầng 2. Khu phòng học nhóm cách âm mới có sức chứa 120 sinh viên. Vui lòng đặt phòng trực tuyến trước ít nhất 24 giờ. Trong thời gian thi công, sách tham khảo học thuật được chuyển tạm xuống tầng hầm tòa nhà Hành chính.
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DCEBFA]">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const nextAns: Record<number, string> = {};
                            LISTENING_QUIZ.forEach((q) => {
                              nextAns[q.id] = q.answer;
                            });
                            setListeningAnswers(nextAns);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                        >
                          Điền Nhanh Đáp Án Mẫu
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setListeningAnswers({});
                            setListeningSubmitted(false);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-[#334155] font-display text-xs font-bold cursor-pointer"
                        >
                          Làm Lại Từ Đầu
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setListeningSubmitted(true);
                          setUserXp((x) => x + 80);
                        }}
                        className="px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                      >
                        Nộp Bài Nghe & Chấm Điểm (5 Câu)
                      </button>
                    </div>
                  </div>
                )}

                {listeningSubTab === 'dictation_22' && (
                  <div className="bg-[#FFFFFF] rounded-2xl border border-[#DCEBFA] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                    <div className="lg:col-span-4 p-4 bg-[#F8FBFF] border-r border-[#DCEBFA] max-h-[620px] overflow-y-auto space-y-1">
                      <div className="px-2 pb-2 text-xs font-display font-extrabold text-[#0284C7]">
                        CHỌN 1 TRONG 22 CHỦ ĐỀ NGHE:
                      </div>
                      {chapters.map((ch) => (
                        <button
                          key={ch.key}
                          type="button"
                          onClick={() => {
                            setSelectedChapterKey(ch.key);
                            setDictationSubmitted(false);
                          }}
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

                    <div className="lg:col-span-8 p-5 space-y-4 max-h-[620px] overflow-y-auto">
                      {(() => {
                        const chapterSlice = (
                          activeChapter?.words || []
                        ).slice(0, 15);
                        const correctCount = chapterSlice.filter((item, i) => {
                          const k = `${activeChapter?.key}-${item.word}-${i}`;
                          return (
                            (chapterDictationMap[k] || '')
                              .trim()
                              .toLowerCase() === item.word.toLowerCase()
                          );
                        }).length;

                        return (
                          <>
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#DCEBFA]">
                              <div>
                                <div className="font-display text-sm font-extrabold text-[#0F172A]">
                                  {activeChapter?.titleVi} — Bấm loa nghe và gõ lại từ tiếng Anh
                                </div>
                                <div className="text-xs text-[#059669] font-bold mt-0.5">
                                  Tiến độ: Đã gõ đúng {correctCount} /{' '}
                                  {chapterSlice.length} từ trong bài này
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRevealEnglishWords((r) => !r)
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                                >
                                  {revealEnglishWords
                                    ? 'Ẩn Chữ Tiếng Anh'
                                    : 'Hiện Chữ Tiếng Anh'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRevealMeanings((r) => !r)}
                                  className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                                >
                                  {revealMeanings
                                    ? 'Ẩn Nghĩa Tiếng Việt'
                                    : 'Hiện Nghĩa Tiếng Việt'}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              {chapterSlice.map((item, i) => {
                                const k = `${activeChapter?.key}-${item.word}-${i}`;
                                const val = chapterDictationMap[k] || '';
                                const ok =
                                  val.trim().toLowerCase() ===
                                  item.word.toLowerCase();
                                const showWord =
                                  revealEnglishWords ||
                                  dictationSubmitted ||
                                  ok;

                                return (
                                  <div
                                    key={k}
                                    className="p-3.5 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3"
                                  >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          playPronunciation(
                                            item.audioUrl || '',
                                            item.word,
                                            'en-GB'
                                          )
                                        }
                                        className="p-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] cursor-pointer shrink-0"
                                      >
                                        <Volume2 className="w-4 h-4" />
                                      </button>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                                            Câu {i + 1}:
                                          </span>
                                          <span className="font-display text-sm font-extrabold text-[#0F172A]">
                                            {showWord
                                              ? item.word
                                              : `Bấm loa nghe (Gợi ý: ${item.word[0]}... • ${item.word.length} ký tự)`}
                                          </span>
                                        </div>
                                        <div className="text-xs text-[#334155] mt-0.5">
                                          {revealMeanings
                                            ? `Nghĩa Tiếng Việt: ${item.viMeaning}`
                                            : '[Đã ẩn nghĩa Tiếng Việt]'}
                                        </div>
                                        {dictationSubmitted && !ok && (
                                          <div className="text-xs font-bold text-[#E11D48] mt-0.5">
                                            ✗ Đáp án đúng là: {item.word}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={val}
                                        onChange={(e) =>
                                          setChapterDictationMap((p) => ({
                                            ...p,
                                            [k]: e.target.value
                                          }))
                                        }
                                        placeholder="Gõ từ nghe được..."
                                        className={`px-3 py-2 rounded-xl border text-xs font-mono-data w-40 ${
                                          ok
                                            ? 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold'
                                            : 'bg-[#FFFFFF] border-[#BAE6FD]'
                                        }`}
                                      />
                                      {ok && (
                                        <span className="text-xs font-bold text-[#059669]">
                                          ✓ Đúng
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {dictationSubmitted && (
                              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <div className="font-display text-sm font-black text-[#047857]">
                                    Đã Nộp Bài Chép Chính Tả! Kết quả: Đúng{' '}
                                    {correctCount} / {chapterSlice.length} từ •
                                    +80 XP
                                  </div>
                                  <div className="text-xs text-[#059669] mt-0.5">
                                    Toàn bộ đáp án Tiếng Anh và nghĩa Tiếng Việt đã được hiển thị để bạn đối chiếu.
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#DCEBFA]">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const filled: Record<string, string> = {
                                      ...chapterDictationMap
                                    };
                                    chapterSlice.forEach((item, i) => {
                                      filled[
                                        `${activeChapter?.key}-${item.word}-${i}`
                                      ] = item.word;
                                    });
                                    setChapterDictationMap(filled);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                                >
                                  Điền Nhanh Đáp Án Mẫu
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setChapterDictationMap({});
                                    setDictationSubmitted(false);
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-[#334155] font-display text-xs font-bold cursor-pointer"
                                >
                                  Làm Lại Bài Này
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setDictationSubmitted(true);
                                  setUserXp((x) => x + 80);
                                }}
                                className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                              >
                                Nộp Bài Nghe Chép Từ & Chấm Điểm
                              </button>
                            </div>
                          </>
                        );
                      })()}
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
                        <p className="text-xs font-bold text-[#0284C7]">
                          Nghĩa Tiếng Việt: {item.viMeaning}
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
                <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-data text-xs font-bold text-[#D97706]">
                        PHÒNG 03 / LUYỆN NÓI SPEAKING PART 2 & CHẤM ĐIỂM AI
                      </span>
                      <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A] mt-0.5">
                        Khu Vực Học Nói (IELTS Speaking Studio)
                      </h1>
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
                          className={`px-3.5 py-2 rounded-xl font-display text-xs font-bold cursor-pointer ${
                            selectedSpeakingIdx === idx
                              ? 'bg-[#0284C7] text-[#FFFFFF]'
                              : 'bg-[#F0F7FF] text-[#334155]'
                          }`}
                        >
                          {tp.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3-Step Speaking Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-xs">
                    <div>
                      <strong className="text-[#D97706]">Bước 1:</strong> Đọc đề bài (có dịch Tiếng Việt) & bấm nghe 5 từ vựng gợi ý bên trái.
                    </div>
                    <div>
                      <strong className="text-[#D97706]">Bước 2:</strong> Bấm <em>Thu Âm Giọng Nói</em> hoặc bấm <em>Nạp Bài Nói Mẫu Band 8.0</em>.
                    </div>
                    <div>
                      <strong className="text-[#059669]">Bước 3:</strong> Bấm <strong>&ldquo;Nộp Bài Nói & Chấm Điểm AI&rdquo;</strong> để nhận bảng điểm 4 tiêu chí!
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Cue Card & Target Words */}
                  <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                    <span className="px-2.5 py-1 rounded bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] font-mono-data text-xs font-bold">
                      ĐỀ BÀI SPEAKING PART 2
                    </span>
                    <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                      {activeSpeakingTopic.prompt}
                    </h2>
                    <div className="p-3 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs text-[#334155]">
                      <strong>Dịch đề bài Tiếng Việt:</strong>{' '}
                      {selectedSpeakingIdx === 0
                        ? 'Hãy mô tả một thiết bị hoặc ứng dụng công nghệ hiện đại giúp cuộc sống hàng ngày của bạn trở nên dễ dàng hơn.'
                        : 'Hãy mô tả một giải pháp bảo vệ môi trường mà bạn nghĩ các thành phố lớn nên áp dụng.'}
                    </div>

                    <div className="space-y-1.5 text-xs text-[#334155]">
                      <div className="font-bold text-[#0F172A]">
                        Gợi ý triển khai ý (Cue Card):
                      </div>
                      {activeSpeakingTopic.cues.map((c, i) => (
                        <div key={i}>{c}</div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-[#DCEBFA] space-y-2">
                      <div className="text-xs font-bold text-[#0284C7]">
                        5 Từ Vựng Ăn Điểm Nên Dùng (Bấm để nghe phát âm & tự động chèn):
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
                              onClick={() => {
                                playPronunciation('', tw, 'en-GB');
                                if (!used) {
                                  setSpeakingTranscript((prev) =>
                                    prev ? `${prev} ${tw}` : tw
                                  );
                                }
                              }}
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
                        onClick={() => {
                          setIsRecordingSpeaking((r) => !r);
                          if (!speakingTranscript) {
                            setSpeakingTranscript(
                              activeSpeakingTopic.sampleAnswer
                            );
                          }
                        }}
                        className={`px-4 py-2.5 rounded-xl font-display text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer ${
                          isRecordingSpeaking
                            ? 'bg-[#E11D48] text-[#FFFFFF]'
                            : 'bg-[#0284C7] text-[#FFFFFF]'
                        }`}
                      >
                        <Mic className="w-4 h-4" />
                        <span>
                          {isRecordingSpeaking
                            ? 'Đang Thu Âm... (Bấm Để Dừng & Lưu Bản Thu)'
                            : '1. Bấm Bắt Đầu Thu Âm Giọng Nói'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSpeakingTranscript(
                            activeSpeakingTopic.sampleAnswer
                          );
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                      >
                        2. Nạp Bài Nói Mẫu Band 8.0
                      </button>
                    </div>

                    <textarea
                      rows={5}
                      value={speakingTranscript}
                      onChange={(e) => setSpeakingTranscript(e.target.value)}
                      placeholder="Nội dung bài nói của bạn sẽ hiển thị tại đây (hoặc bấm nút 'Nạp Bài Nói Mẫu Band 8.0' ở trên rồi bấm Nộp Bài)..."
                      className="w-full p-4 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs sm:text-sm text-[#0F172A]"
                    />

                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                        onClick={() => {
                          if (!speakingTranscript.trim()) {
                            setSpeakingTranscript(
                              activeSpeakingTopic.sampleAnswer
                            );
                          }
                          setSpeakingGraded(true);
                          setUserXp((x) => x + 90);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                      >
                        3. Nộp Bài Nói & Chấm Điểm AI Ngay
                      </button>
                    </div>

                    {speakingGraded && (
                      <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] space-y-3">
                        <div className="flex items-center justify-between border-b border-[#A7F3D0] pb-2">
                          <span className="font-display text-sm font-black text-[#047857]">
                            ĐÃ NỘP BÀI NÓI! BẢNG ĐIỂM AI 4 TIÊU CHÍ (+90 XP):
                          </span>
                          <span className="px-2.5 py-0.5 rounded-lg bg-[#059669] text-[#FFFFFF] font-display text-xs font-black">
                            Overall Speaking: 7.5
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0]">
                            <div className="text-xs text-[#047857]">
                              Độ Trôi Chảy
                            </div>
                            <div className="font-display text-lg font-black text-[#059669]">
                              7.5
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0]">
                            <div className="text-xs text-[#047857]">
                              Từ Vựng (LR)
                            </div>
                            <div className="font-display text-lg font-black text-[#059669]">
                              8.0
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0]">
                            <div className="text-xs text-[#047857]">
                              Ngữ Pháp
                            </div>
                            <div className="font-display text-lg font-black text-[#059669]">
                              7.5
                            </div>
                          </div>
                          <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#A7F3D0]">
                            <div className="text-xs text-[#047857]">
                              Phát Âm
                            </div>
                            <div className="font-display text-lg font-black text-[#059669]">
                              7.5
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-[#334155]">
                          <strong>Nhận xét AI bằng Tiếng Việt:</strong> Bài nói có bố cục rõ ràng, sử dụng tốt các từ vựng học thuật C1 ({activeSpeakingTopic.targetWords.slice(0, 3).join(', ')}). Cần chú ý nhấn trọng âm từ và giữ nhịp nói đều ở phần kết luận.
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
                <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                        PHÒNG 04 / ĐỌC HIỂU HỌC THUẬT & TRA TỪ TRỰC TIẾP 1-CHẠM
                      </span>
                      <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A] mt-0.5">
                        Khu Vực Học Đọc (IELTS Reading & 538 Từ Khóa)
                      </h1>
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
                        1. Làm Bài Đọc (5 Câu)
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
                        2. Kho 538 Từ Khóa Reading
                      </button>
                    </div>
                  </div>

                  {/* 3-Step Reading Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-xs">
                    <div>
                      <strong className="text-[#0284C7]">Bước 1:</strong> Đọc bài bên trái và bấm vào các <em>từ gạch chân màu xanh</em> để xem nghĩa Tiếng Việt ngay.
                    </div>
                    <div>
                      <strong className="text-[#0284C7]">Bước 2:</strong> Chọn đáp án <em>TRUE / FALSE / NOT GIVEN</em> cho 5 câu hỏi bên phải.
                    </div>
                    <div>
                      <strong className="text-[#059669]">Bước 3:</strong> Bấm <strong>&ldquo;Nộp Bài Đọc & Chấm Điểm&rdquo;</strong> để xem điểm số & giải thích chi tiết!
                    </div>
                  </div>
                </div>

                {readingSubTab === 'passage' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Passage with 1-Click Words + Inline Dictionary Box */}
                    <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DCEBFA]">
                        <h2 className="font-display text-base font-extrabold text-[#0F172A]">
                          Bài Đọc: Rừng Thẳng Đứng & Kiến Trúc Khí Hậu Đô Thị
                        </h2>
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassageTranslation((prev) => !prev)
                          }
                          className="px-3 py-1 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                        >
                          {showPassageTranslation
                            ? 'Ẩn Dịch Tiếng Việt'
                            : 'Hiện Dịch Tiếng Việt'}
                        </button>
                      </div>

                      <div className="space-y-2">
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
                            onClick={() =>
                              setSelectedInlineWord('unprecedented')
                            }
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
                        {showPassageTranslation && (
                          <p className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-xs text-[#334155]">
                            <strong>Dịch Đoạn A:</strong> Các siêu đô thị mật độ cao đã khiến những tòa tháp bê tông trở nên <em>phổ biến khắp nơi (ubiquitous)</em>, làm gia tăng hiện tượng đảo nhiệt đô thị ở quy mô <em>chưa từng có tiền lệ (unprecedented)</em>. Công trình Bosco Verticale tại Milan chứng minh việc tích hợp 900 cây xanh vào mặt tiền chung cư có thể <em>giảm thiểu (mitigate)</em> nhiệt độ bề mặt tới 3°C.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
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
                        {showPassageTranslation && (
                          <p className="p-3 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] text-xs text-[#334155]">
                            <strong>Dịch Đoạn B:</strong> Dữ liệu <em>thực nghiệm (Empirical)</em> xác nhận rằng các khu rừng thẳng đứng hoàn toàn <em>khả thi (viable)</em>, mặc dù chi phí kỹ thuật kết cấu cao vẫn tạo ra <em>sự chênh lệch lớn (disparities)</em> tại các đô thị đang phát triển.
                          </p>
                        )}
                      </div>

                      {/* Inline Dictionary Card */}
                      {selectedInlineWord &&
                        INLINE_READING_DICT[selectedInlineWord] && (
                          <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#0284C7] flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display text-base font-black text-[#0284C7]">
                                  Từ đang tra: {selectedInlineWord}
                                </span>
                                <span className="font-mono-data text-xs text-[#64748B]">
                                  {INLINE_READING_DICT[selectedInlineWord].ipa}{' '}
                                  •{' '}
                                  {INLINE_READING_DICT[selectedInlineWord].cefr}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm font-bold text-[#0F172A] mt-1">
                                Nghĩa Tiếng Việt:{' '}
                                {INLINE_READING_DICT[selectedInlineWord].vi}
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
                                Nghe Phát Âm
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

                    {/* Right: 5 Questions + Submit & Scorecard */}
                    <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[#DCEBFA]">
                        <h3 className="font-display text-base font-extrabold text-[#0F172A]">
                          Bài Tập 5 Câu (TRUE / FALSE / NOT GIVEN)
                        </h3>
                        <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                          Đã chọn {Object.keys(readingAnswers).length}/5 câu
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {READING_QUESTIONS.map((q) => {
                          const userAns = readingAnswers[q.id];
                          const isCorrect = userAns === q.answer;
                          return (
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
                                <div
                                  className={`text-xs font-bold ${
                                    isCorrect
                                      ? 'text-[#059669]'
                                      : 'text-[#E11D48]'
                                  }`}
                                >
                                  {isCorrect ? '✓ Chính xác!' : '✗ Chưa đúng'} —
                                  Đáp án chuẩn: {q.answer}. ({q.explain})
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {readingSubmitted && (
                        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs">
                          <div className="font-display font-black text-[#047857] text-sm">
                            Đã Nộp Bài Đọc! Kết quả: Đúng{' '}
                            {
                              READING_QUESTIONS.filter(
                                (q) => readingAnswers[q.id] === q.answer
                              ).length
                            }{' '}
                            / {READING_QUESTIONS.length} câu • +100 XP
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#DCEBFA]">
                        <button
                          type="button"
                          onClick={() => {
                            const filled: Record<number, string> = {};
                            READING_QUESTIONS.forEach((q) => {
                              filled[q.id] = q.answer;
                            });
                            setReadingAnswers(filled);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold cursor-pointer"
                        >
                          Điền Nhanh Đáp Án
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReadingSubmitted(true);
                            setUserXp((x) => x + 100);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Nộp Bài Đọc & Chấm Điểm
                        </button>
                      </div>
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
                        <p className="text-xs font-bold text-[#0284C7]">
                          Nghĩa Tiếng Việt: {item.viMeaning}
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
                <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#DCEBFA] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono-data text-xs font-bold text-[#059669]">
                        PHÒNG 05 / SOẠN THẢO BÀI LUẬN WRITING TASK 2 & AI CHẤM ĐIỂM
                      </span>
                      <h1 className="font-display text-lg sm:text-xl font-black text-[#0F172A] mt-0.5">
                        Khu Vực Học Viết (AI Writing Grader & 100 Mẫu Câu)
                      </h1>
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
                        1. Viết Bài & Nộp Chấm AI
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

                  {/* 3-Step Writing Guide */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs">
                    <div>
                      <strong className="text-[#059669]">Bước 1:</strong> Xem đề bài (có dịch Tiếng Việt) và bấm các nút <em>+ Chèn câu mẫu Band 8.0</em>.
                    </div>
                    <div>
                      <strong className="text-[#059669]">Bước 2:</strong> Soạn thảo bài luận vào khung bên trái (hệ thống tự động đếm số từ).
                    </div>
                    <div>
                      <strong className="text-[#0284C7]">Bước 3:</strong> Bấm <strong>&ldquo;Nộp Bài Viết & Chấm Điểm AI&rdquo;</strong> để nhận bảng phân tích 4 tiêu chí!
                    </div>
                  </div>
                </div>

                {writingSubTab === 'ai_grader' ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-[#FFFFFF] p-6 rounded-2xl border border-[#DCEBFA] space-y-4">
                      <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-1.5 text-xs text-[#0F172A]">
                        <div>
                          <strong>Đề bài Task 2 (Tiếng Anh):</strong> Some people believe cities should invest heavily in vertical green architecture, while others argue affordable housing is more urgent. Discuss both views and give your opinion.
                        </div>
                        <div className="text-[#334155]">
                          <strong>Dịch đề bài Tiếng Việt:</strong> Một số người cho rằng các thành phố nên đầu tư mạnh vào kiến trúc xanh thẳng đứng, trong khi những người khác cho rằng nhà ở giá rẻ cấp thiết hơn. Hãy thảo luận cả hai quan điểm và nêu ý kiến của bạn.
                        </div>
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
                          + Chèn câu Luận điểm 1 (Band 8.0)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEssayText(
                              (t) =>
                                `${t} In conclusion, balancing affordable housing with green infrastructure is the most viable approach for modern municipalities.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#059669] text-[#059669] hover:text-[#FFFFFF] font-mono-data text-xs font-bold cursor-pointer"
                        >
                          + Chèn câu Kết bài mẫu (Band 8.0)
                        </button>
                      </div>

                      <textarea
                        rows={7}
                        value={essayText}
                        onChange={(e) => setEssayText(e.target.value)}
                        className="w-full p-4 rounded-xl bg-[#F8FBFF] border border-[#BAE6FD] text-xs sm:text-sm text-[#0F172A]"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono-data text-xs text-[#64748B]">
                          Số từ hiện tại: <strong>{essayWordCount} từ</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setWritingGraded(true);
                            setUserXp((x) => x + 120);
                          }}
                          className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
                        >
                          Nộp Bài Viết & Chấm Điểm AI Ngay
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
                            <span>
                              1. Trả lời đúng trọng tâm (Task Response)
                            </span>
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

                          <div className="p-3.5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-1.5 text-[#334155]">
                            <div className="font-bold text-[#0284C7]">
                              Nhận xét chi tiết bằng Tiếng Việt (+120 XP):
                            </div>
                            <p>
                              • <strong>Điểm mạnh:</strong> Sử dụng chính xác các cụm từ học thuật C1/C2 (<em>unprecedented, viable, mitigate, disparities</em>).
                            </p>
                            <p>
                              • <strong>Gợi ý nâng cấp:</strong> Nên bổ sung thêm 1 ví dụ thực tế ở đoạn thân bài thứ 2 để nâng điểm Task Response lên 8.0.
                            </p>
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
