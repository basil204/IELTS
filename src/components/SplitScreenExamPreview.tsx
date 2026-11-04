'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  BookmarkPlus,
  CheckCircle2,
  Clock,
  FileCheck,
  Headphones,
  Highlighter,
  Mic,
  PenTool,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Volume2,
  XCircle
} from 'lucide-react';
import { playPronunciation } from '@/lib/fsrs-engine';

interface Props {
  onSelectVocabFromPassage: (word: string) => void;
  onSaveToNotebook?: (word: string, meaning: string, ipa: string, cefr: string) => void;
  lang?: 'vi' | 'en';
}

interface ReadingQuestion {
  id: number;
  type: 'TFNG' | 'CLOZE' | 'MCQ';
  prompt: string;
  options: string[];
  answer: string;
  explanationVi: string;
  explanationEn: string;
}

interface InlineWordDict {
  word: string;
  ipa: string;
  pos: string;
  cefr: string;
  meaningVi: string;
  meaningEn: string;
}

interface ReadingPassageData {
  id: string;
  title: string;
  bandLabel: string;
  topic: string;
  segments: { id: number; text: string }[];
  glossary: InlineWordDict[];
  questions: ReadingQuestion[];
}

const READING_PASSAGES: ReadingPassageData[] = [
  {
    id: 'p1',
    title: 'PASSAGE 1: Urban Micro-Forests & Climate Resilience',
    bandLabel: 'BAND 6.5–8.0 ACADEMIC',
    topic: 'Environment & Urban Planning',
    segments: [
      {
        id: 0,
        text: 'As accelerating urbanization intensifies the urban heat island effect across metropolitan regions, municipal planners are increasingly adopting a pragmatic approach to ecological restoration.'
      },
      {
        id: 1,
        text: ' Pioneered by botanist Akira Miyawaki, high-density urban micro-forests exhibit a tenfold acceleration in canopy establishment compared to standard monoculture municipal plantings, helping to mitigate extreme summer temperatures.'
      },
      {
        id: 2,
        text: ' Rather than replacing traditional recreational parks, these compact woodlands function as complementary ecological corridors that foster resilient habitats within concrete-heavy districts.'
      },
      {
        id: 3,
        text: ' Empirical field scrutiny confirms that dense multi-layered native vegetation serves as an ecological catalyst for avian and pollinator biodiversity, becoming self-sustaining within thirty-six months.'
      }
    ],
    glossary: [
      {
        word: 'urbanization',
        ipa: '/ˌɜːbənaɪˈzeɪʃn/',
        pos: 'n.',
        cefr: 'B2',
        meaningVi: 'sự đô thị hóa nhanh chóng',
        meaningEn: 'the process of making an area more urban'
      },
      {
        word: 'pragmatic',
        ipa: '/præɡˈmætɪk/',
        pos: 'adj.',
        cefr: 'C1',
        meaningVi: 'thực tế, thực dụng, giải quyết vấn đề hiệu quả',
        meaningEn: 'dealing with things sensibly and realistically'
      },
      {
        word: 'mitigate',
        ipa: '/ˈmɪtɪɡeɪt/',
        pos: 'v.',
        cefr: 'C1',
        meaningVi: 'giảm thiểu, làm dịu bớt tác động tiêu cực',
        meaningEn: 'make less severe, serious, or painful'
      },
      {
        word: 'resilient',
        ipa: '/rɪˈzɪliənt/',
        pos: 'adj.',
        cefr: 'C1',
        meaningVi: 'có sức chống chịu cao, phục hồi nhanh',
        meaningEn: 'able to withstand or recover quickly from difficult conditions'
      },
      {
        word: 'foster',
        ipa: '/ˈfɒstə(r)/',
        pos: 'v.',
        cefr: 'C1',
        meaningVi: 'thúc đẩy, nuôi dưỡng sự phát triển',
        meaningEn: 'encourage or promote the development of'
      },
      {
        word: 'catalyst',
        ipa: '/ˈkætəlɪst/',
        pos: 'n.',
        cefr: 'C1',
        meaningVi: 'chất xúc tác, nhân tố thúc đẩy đột phá',
        meaningEn: 'an agent that provokes or speeds significant change'
      },
      {
        word: 'biodiversity',
        ipa: '/ˌbaɪəʊdaɪˈvɜːsəti/',
        pos: 'n.',
        cefr: 'B2',
        meaningVi: 'đa dạng sinh học trong hệ sinh thái',
        meaningEn: 'the variety of plant and animal life in the world'
      }
    ],
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt:
          '1. Urban micro-forests planted using the Miyawaki method grow significantly faster than conventional municipal plantations.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        answer: 'TRUE',
        explanationVi:
          'Đoạn 1 nêu rõ: "Miyawaki micro-forests exhibit a tenfold acceleration in canopy establishment compared to standard monoculture municipal plantings."',
        explanationEn:
          'Paragraph 1 states: "Miyawaki micro-forests exhibit a tenfold acceleration in canopy establishment compared to standard monoculture municipal plantings."'
      },
      {
        id: 2,
        type: 'TFNG',
        prompt:
          '2. Municipal governments have universally replaced all public parks with high-density micro-forests.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        answer: 'FALSE',
        explanationVi:
          'Đoạn 2 chỉ nói các dự án này đóng vai trò bổ trợ ("complementary ecological corridors"), không phải thay thế toàn bộ công viên công cộng.',
        explanationEn:
          'Paragraph 2 notes they act as "complementary ecological corridors" rather than replacing traditional parks.'
      },
      {
        id: 3,
        type: 'TFNG',
        prompt:
          '3. The cost of maintaining a mature micro-forest after five years is lower than the initial soil preparation expense.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        answer: 'NOT GIVEN',
        explanationVi:
          'Bài đọc đề cập rừng tự duy trì sau 36 tháng nhưng không so sánh chi phí bảo trì sau 5 năm với chi phí làm đất ban đầu.',
        explanationEn:
          'The passage mentions self-sustainability within 36 months but never compares 5-year maintenance costs with initial soil preparation.'
      },
      {
        id: 4,
        type: 'CLOZE',
        prompt:
          '4. Summary Cloze: Dense native vegetation acts as a natural ________ to accelerate local biodiversity recovery.',
        options: ['catalyst', 'disparity', 'paradigm'],
        answer: 'catalyst',
        explanationVi:
          'Đoạn 2: "...dense multi-layered native vegetation serves as an ecological catalyst for avian and pollinator biodiversity."',
        explanationEn:
          'Segment 3: "...dense multi-layered native vegetation serves as an ecological catalyst for avian and pollinator biodiversity."'
      }
    ]
  },
  {
    id: 'p2',
    title: 'PASSAGE 2: Algorithmic Governance & Cognitive Offloading',
    bandLabel: 'BAND 7.0–8.5 ACADEMIC',
    topic: 'Technology & Cognition',
    segments: [
      {
        id: 0,
        text: 'The ubiquity of generative artificial intelligence in contemporary workplaces has triggered intense debate regarding cognitive offloading—the tendency to delegate complex analytical synthesis to automated systems.'
      },
      {
        id: 1,
        text: ' While proponents contend that algorithmic assistance liberates professionals from mundane clerical routines, neurocognitive longitudinal studies suggest that habitual reliance on predictive text engines may erode autonomous critical reasoning.'
      },
      {
        id: 2,
        text: ' Crucially, researchers observed a pronounced disparity between novice and seasoned analysts: senior specialists utilized AI outputs as a devil’s advocate to scrutinize their own hypotheses, whereas novices passively ratified machine-generated conclusions.'
      },
      {
        id: 3,
        text: ' Consequently, educational policymakers advocate a pedagogical paradigm shift that prioritizes epistemic vigilance over rote procedural speed.'
      }
    ],
    glossary: [
      {
        word: 'ubiquity',
        ipa: '/juːˈbɪkwəti/',
        pos: 'n.',
        cefr: 'C2',
        meaningVi: 'sự hiện diện khắp mọi nơi, tính phổ biến toàn diện',
        meaningEn: 'the fact of appearing everywhere or of being very common'
      },
      {
        word: 'cognitive',
        ipa: '/ˈkɒɡnətɪv/',
        pos: 'adj.',
        cefr: 'C1',
        meaningVi: 'thuộc về nhận thức và tư duy não bộ',
        meaningEn: 'relating to cognition and mental processes'
      },
      {
        word: 'mundane',
        ipa: '/mʌnˈdeɪn/',
        pos: 'adj.',
        cefr: 'C1',
        meaningVi: 'nhàm chán, lặp đi lặp lại thường nhật',
        meaningEn: 'lacking interest or excitement; dull'
      },
      {
        word: 'erode',
        ipa: '/ɪˈrəʊd/',
        pos: 'v.',
        cefr: 'C1',
        meaningVi: 'xói mòn, làm suy giảm dần theo thời gian',
        meaningEn: 'gradually destroy or be gradually destroyed'
      },
      {
        word: 'disparity',
        ipa: '/dɪˈspærəti/',
        pos: 'n.',
        cefr: 'C1',
        meaningVi: 'sự chênh lệch lớn, sự bất bình đẳng',
        meaningEn: 'a great difference or inequality'
      },
      {
        word: 'scrutinize',
        ipa: '/ˈskruːtənaɪz/',
        pos: 'v.',
        cefr: 'C2',
        meaningVi: 'xem xét kỹ lưỡng, kiểm tra tỉ mỉ từng chi tiết',
        meaningEn: 'examine or inspect closely and thoroughly'
      },
      {
        word: 'paradigm',
        ipa: '/ˈpærədaɪm/',
        pos: 'n.',
        cefr: 'C2',
        meaningVi: 'mô hình tư duy, hệ quy chiếu chuẩn mực',
        meaningEn: 'a typical example or pattern of something; a model'
      }
    ],
    questions: [
      {
        id: 1,
        type: 'TFNG',
        prompt:
          '1. Longitudinal studies indicate that frequent dependence on predictive AI tools always improves independent critical thinking.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        answer: 'FALSE',
        explanationVi:
          'Bài đọc chỉ ra sự phụ thuộc thường xuyên có thể làm suy giảm tư duy phản biện độc lập ("may erode autonomous critical reasoning").',
        explanationEn:
          'The passage states habitual reliance "may erode autonomous critical reasoning", contradicting the claim.'
      },
      {
        id: 2,
        type: 'MCQ',
        prompt:
          '2. How did experienced analysts differ from novices when using AI systems?',
        options: [
          'They used AI to challenge and verify their own hypotheses',
          'They avoided using automated tools entirely',
          'They accepted machine conclusions faster than novices'
        ],
        answer: 'They used AI to challenge and verify their own hypotheses',
        explanationVi:
          'Đoạn 3 nêu rõ chuyên gia giàu kinh nghiệm dùng AI để phản biện và kiểm chứng giả thuyết ("scrutinize their own hypotheses").',
        explanationEn:
          'Senior specialists used AI outputs as a devil’s advocate to scrutinize their own hypotheses.'
      },
      {
        id: 3,
        type: 'CLOZE',
        prompt:
          '3. Summary Cloze: Policymakers call for a pedagogical ________ shift focusing on epistemic vigilance.',
        options: ['paradigm', 'anomaly', 'monopoly'],
        answer: 'paradigm',
        explanationVi:
          'Câu cuối: "...advocate a pedagogical paradigm shift that prioritizes epistemic vigilance."',
        explanationEn:
          'Final sentence: "...advocate a pedagogical paradigm shift that prioritizes epistemic vigilance."'
      },
      {
        id: 4,
        type: 'TFNG',
        prompt:
          '4. Novice analysts were paid lower salaries than senior specialists during the longitudinal study.',
        options: ['TRUE', 'FALSE', 'NOT GIVEN'],
        answer: 'NOT GIVEN',
        explanationVi:
          'Bài đọc chỉ so sánh hành vi sử dụng AI giữa người mới và chuyên gia, không đề cập tới mức lương.',
        explanationEn:
          'No salary or compensation figures are mentioned anywhere in the text.'
      }
    ]
  }
];

const LISTENING_SECTIONS = [
  {
    id: 'l1',
    title: 'SECTION 4 LECTURE: Bio-Acoustic Reef Restoration',
    audioScript:
      'Welcome to today’s marine ecology lecture. Over the past decade, degraded coral reefs have become eerily silent, deterring juvenile fish from settling. However, marine biologists have discovered that broadcasting recordings of healthy reef acoustics through underwater loudspeakers can double fish settlement rates, acting as a vital sensory beacon for marine regeneration.',
    questions: [
      {
        id: 1,
        prompt:
          '1. Degraded coral reefs fail to attract young fish primarily because they lack acoustic cues and have become ________.',
        answer: 'silent',
        questionKeyword: 'lack acoustic cues / no sound',
        transcriptParaphrase: 'eerily silent'
      },
      {
        id: 2,
        prompt:
          '2. Playing healthy reef sounds via underwater speakers can ________ the rate of juvenile fish settlement.',
        answer: 'double',
        questionKeyword: 'increase twofold',
        transcriptParaphrase: 'double fish settlement rates'
      },
      {
        id: 3,
        prompt:
          '3. Acoustic enrichment serves as a sensory ________ that guides marine larvae back to recovering habitats.',
        answer: 'beacon',
        questionKeyword: 'guiding signal',
        transcriptParaphrase: 'vital sensory beacon'
      }
    ]
  }
];

const WRITING_PROMPTS = [
  {
    id: 'w1',
    topic: 'Technology & Education',
    prompt:
      'Some people believe that artificial intelligence will eventually replace human teachers in classrooms, while others argue that the social and emotional guidance of a teacher is irreplaceable. Discuss both views and give your own opinion.',
    sampleUpgradeDraft:
      'Nowadays, many people think that AI technology is very good for education and can replace teachers. On the other hand, I think teachers are still very important because they help students develop social skills and critical thinking. If schools use AI too much, it can cause a big problem for young learners.'
  },
  {
    id: 'w2',
    topic: 'Environment & Urbanization',
    prompt:
      'Governments should prioritize investing in public transportation and urban green spaces rather than expanding highways for private vehicles. To what extent do you agree or disagree?',
    sampleUpgradeDraft:
      'Many big cities have a lot of traffic congestion and air pollution. I agree that governments should spend money on public transit and green parks instead of building more roads. This policy can reduce carbon emissions and make cities better places for citizens.'
  }
];

const LEXICAL_UPGRADE_RULES = [
  {
    weakPattern: /\b(nowadays|today)\b/i,
    weakLabel: 'Nowadays / Today (Band 5.5)',
    band75Upgrade: 'In the contemporary era / Increasingly',
    cefr: 'C1',
    explanationVi: 'Thay trạng từ thời gian sáo rỗng bằng cụm học thuật mở đầu đoạn.',
    explanationEn: 'Replace generic time adverbs with formal academic framing.'
  },
  {
    weakPattern: /\b(very good|really good|better)\b/i,
    weakLabel: 'very good / better (Band 5.5)',
    band75Upgrade: 'profoundly beneficial / conducive to',
    cefr: 'C1',
    explanationVi: 'Sử dụng tính từ học thuật chỉ tác động tích cực sâu sắc.',
    explanationEn: 'Use precise C1 collocations to express positive impact.'
  },
  {
    weakPattern: /\b(very important|important)\b/i,
    weakLabel: 'very important (Band 5.5)',
    band75Upgrade: 'indispensable / of paramount significance',
    cefr: 'C1',
    explanationVi: 'Nâng cấp từ vựng chỉ tầm quan trọng thiết yếu không thể thay thế.',
    explanationEn: 'Upgrade basic adjectives to C1 lexical items.'
  },
  {
    weakPattern: /\b(big problem|bad)\b/i,
    weakLabel: 'big problem / bad (Band 5.5)',
    band75Upgrade: 'systemic challenge / detrimental consequence',
    cefr: 'C2',
    explanationVi: 'Thay thế cụm danh từ thông tục bằng thuật ngữ nghị luận Band 8.0.',
    explanationEn: 'Replace conversational phrasing with C2 analytical collocations.'
  },
  {
    weakPattern: /\b(a lot of|many)\b/i,
    weakLabel: 'a lot of / many (Band 5.5)',
    band75Upgrade: 'a myriad of / a proliferation of',
    cefr: 'C1',
    explanationVi: 'Tăng điểm Lexical Resource bằng cụm định lượng học thuật.',
    explanationEn: 'Boost Lexical Resource score using formal quantifiers.'
  },
  {
    weakPattern: /\b(i think|in my opinion)\b/i,
    weakLabel: 'I think (Band 6.0)',
    band75Upgrade: 'I contend that / Empirical evidence suggests that',
    cefr: 'C1',
    explanationVi: 'Chuyển sang giọng văn khách quan học thuật cho IELTS Writing Task 2.',
    explanationEn: 'Shift to authoritative academic register for Task 2.'
  }
];

const SPEAKING_CUE_CARDS = [
  {
    id: 's1',
    part: 'PART 2 CUE CARD & PART 3 FOLLOW-UP',
    topic: 'Describe an innovative technology or app that has helped you learn a skill.',
    bullets: [
      'What the technology or application is',
      'How you first discovered and started using it',
      'How it structures your daily learning routine',
      'And explain why it is more effective than conventional study methods'
    ],
    targetCollocations: [
      { phrase: 'spaced repetition algorithm', cefr: 'C1', meaningVi: 'thuật toán lặp lại ngắt quãng' },
      { phrase: 'cognitive retention', cefr: 'C1', meaningVi: 'khả năng duy trì trí nhớ' },
      { phrase: 'ubiquitous accessibility', cefr: 'C2', meaningVi: 'khả năng tiếp cận mọi lúc mọi nơi' },
      { phrase: 'mitigate forgetting curves', cefr: 'C1', meaningVi: 'giảm thiểu đường cong lãng quên' }
    ],
    modelSample:
      'I would like to talk about an indispensable EdTech platform called Word Atlas, which leverages a spaced repetition algorithm to optimize my cognitive retention of academic IELTS vocabulary. Because of its ubiquitous accessibility, I can review contextual flashcards daily and effectively mitigate forgetting curves.'
  }
];

export default function SplitScreenExamPreview({
  onSelectVocabFromPassage,
  onSaveToNotebook,
  lang = 'vi'
}: Props) {
  const [activeSkill, setActiveSkill] = useState<
    'reading' | 'listening' | 'writing' | 'speaking'
  >('reading');

  // Reading state
  const [passageIdx, setPassageIdx] = useState<number>(0);
  const currentPassage = READING_PASSAGES[passageIdx] || READING_PASSAGES[0];
  const [secondsLeft, setSecondsLeft] = useState<number>(1200);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [highlightActive, setHighlightActive] = useState<boolean>(true);
  const [highlightedSentences, setHighlightedSentences] = useState<
    Record<string, boolean>
  >({
    'p1-1': true
  });
  const [selectedGlossaryWord, setSelectedGlossaryWord] =
    useState<InlineWordDict | null>(READING_PASSAGES[0].glossary[0]);
  const [answers, setAnswers] = useState<Record<string, string>>({
    'p1-1': 'TRUE'
  });
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Listening state
  const [listeningInputs, setListeningInputs] = useState<Record<number, string>>(
    {}
  );
  const [listeningSubmitted, setListeningSubmitted] = useState<boolean>(false);
  const [listeningPlaying, setListeningPlaying] = useState<boolean>(false);

  // Writing state
  const [writingPromptIdx, setWritingPromptIdx] = useState<number>(0);
  const currentWritingPrompt =
    WRITING_PROMPTS[writingPromptIdx] || WRITING_PROMPTS[0];
  const [essayText, setEssayText] = useState<string>(
    currentWritingPrompt.sampleUpgradeDraft
  );

  // Speaking state
  const [speakingSeconds, setSpeakingSeconds] = useState<number>(120);
  const [speakingRunning, setSpeakingRunning] = useState<boolean>(false);
  const [speakingTranscript, setSpeakingTranscript] = useState<string>(
    SPEAKING_CUE_CARDS[0].modelSample
  );

  // Lead gen state
  const [leadName, setLeadName] = useState('');
  const [leadTarget] = useState('Band 7.5+');
  const [leadContact, setLeadContact] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  useEffect(() => {
    if (!speakingRunning) return;
    const t = setInterval(() => {
      setSpeakingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [speakingRunning]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const spkMins = String(Math.floor(speakingSeconds / 60)).padStart(2, '0');
  const spkSecs = String(speakingSeconds % 60).padStart(2, '0');

  const scoreCount = currentPassage.questions.reduce(
    (acc, q) =>
      acc + (answers[`${currentPassage.id}-${q.id}`] === q.answer ? 1 : 0),
    0
  );

  const estimatedReadingBand =
    scoreCount === 4
      ? '8.5'
      : scoreCount === 3
        ? '7.5'
        : scoreCount === 2
          ? '6.5'
          : '5.5';

  // Writing AI analysis
  const writingAnalysis = useMemo(() => {
    const words = essayText
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const wordCount = words.length;
    const matchedUpgrades = LEXICAL_UPGRADE_RULES.filter((rule) =>
      rule.weakPattern.test(essayText)
    );
    const hasAcademicMarkers =
      /\b(consequently|furthermore|indispensable|mitigate|paradigm|ubiquitous|empirical|conducive|detrimental)\b/i.test(
        essayText
      );

    const trScore = wordCount >= 60 ? 7.5 : 6.5;
    const ccScore = hasAcademicMarkers ? 8.0 : 7.0;
    const lrScore = hasAcademicMarkers
      ? 8.0
      : matchedUpgrades.length > 2
        ? 6.5
        : 7.5;
    const graScore = essayText.includes(',') && essayText.length > 120 ? 7.5 : 6.5;
    const overall = (
      Math.round(((trScore + ccScore + lrScore + graScore) / 4) * 2) / 2
    ).toFixed(1);

    return {
      wordCount,
      matchedUpgrades,
      trScore: trScore.toFixed(1),
      ccScore: ccScore.toFixed(1),
      lrScore: lrScore.toFixed(1),
      graScore: graScore.toFixed(1),
      overall
    };
  }, [essayText]);

  const handleApplyAllWritingUpgrades = () => {
    let upgraded = essayText;
    upgraded = upgraded.replace(/\bNowadays\b/gi, 'In the contemporary era');
    upgraded = upgraded.replace(/\bvery good\b/gi, 'profoundly beneficial');
    upgraded = upgraded.replace(/\bvery important\b/gi, 'indispensable');
    upgraded = upgraded.replace(/\bbig problem\b/gi, 'systemic challenge');
    upgraded = upgraded.replace(/\bMany\b/g, 'A myriad of');
    upgraded = upgraded.replace(/\ba lot of\b/gi, 'a proliferation of');
    upgraded = upgraded.replace(/\bI think\b/gi, 'Empirical evidence suggests that');
    setEssayText(upgraded);
  };

  return (
    <section id="exam-room" className="mt-10 space-y-10">
      {/* Split-Screen Computer-Delivered 4-Skill Exam Room (Sky-Blue & White 4.0) */}
      <div className="bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#DCEBFA] shadow-sm">
        {/* Exam Top Bar */}
        <div className="px-6 py-4 bg-[#F0F7FF] border-b border-[#DCEBFA] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-2.5">
            <h2 className="font-display text-lg md:text-xl font-black text-[#0F172A]">
              {lang === 'vi'
                ? '06 / PHÒNG THI MÁY TÍNH 4 KỸ NĂNG CHUẨN YOUPASS 4.0 (TRA TỪ TRỰC TIẾP • CHẤM AI)'
                : '06 / YOUPASS 4.0 COMPUTER-DELIVERED 4-SKILL EXAM ROOM (INLINE DICTIONARY • AI GRADER)'}
            </h2>

            {/* 4-Skill Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSkill('reading')}
                className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer ${
                  activeSkill === 'reading'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#334155] hover:bg-[#E0F2FE] border border-[#DCEBFA]'
                }`}
              >
                01 • READING (TRA TỪ 1-CHẠM)
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('listening')}
                className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'listening'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#334155] hover:bg-[#E0F2FE] border border-[#DCEBFA]'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>02 • LISTENING LAB</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('writing')}
                className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'writing'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#334155] hover:bg-[#E0F2FE] border border-[#DCEBFA]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>03 • WRITING AI GRADER</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('speaking')}
                className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'speaking'
                    ? 'bg-[#0284C7] text-[#FFFFFF]'
                    : 'bg-[#FFFFFF] text-[#334155] hover:bg-[#E0F2FE] border border-[#DCEBFA]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>04 • SPEAKING PART 2/3</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeSkill === 'reading' && (
              <>
                <div className="flex items-center gap-1 bg-[#FFFFFF] p-1 rounded-lg border border-[#DCEBFA]">
                  {READING_PASSAGES.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPassageIdx(idx);
                        setSelectedGlossaryWord(p.glossary[0]);
                        setSubmitted(false);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono-data font-bold cursor-pointer ${
                        passageIdx === idx
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'text-[#334155] hover:bg-[#EBF5FF]'
                      }`}
                    >
                      Passage {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setHighlightActive((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono-data transition-colors cursor-pointer border ${
                    highlightActive
                      ? 'bg-[#E0F2FE] text-[#0284C7] border-[#0284C7] font-bold'
                      : 'bg-[#FFFFFF] text-[#64748B] border-[#DCEBFA]'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>HIGHLIGHT: {highlightActive ? 'ON' : 'OFF'}</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#DCEBFA] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {mins}:{secs}
              </span>
            </button>

            {activeSkill === 'reading' && (
              <button
                type="button"
                onClick={() => setSubmitted(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold transition-colors cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>
                  {lang === 'vi' ? 'NỘP BÀI & CHẤM BAND' : 'SUBMIT & GRADE BAND'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* SKILL 1: READING SPLIT-SCREEN WITH YOUPASS INLINE DICTIONARY */}
        {activeSkill === 'reading' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DCEBFA]">
            {/* Left Pane: Academic Reading Passage + Inline Dictionary Popover */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#FFFFFF] text-[#0F172A] flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-[#DCEBFA]">
                  <h3 className="font-display text-xl font-extrabold text-[#0F172A]">
                    {currentPassage.title}
                  </h3>
                  <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                    {currentPassage.bandLabel}
                  </span>
                </div>

                <p className="text-xs text-[#334155] mb-4">
                  {lang === 'vi'
                    ? 'Tính năng YouPass 4.0: Nhấp vào câu để bôi xanh dẫn chứng (Highlight), hoặc chạm vào từ vựng bên dưới để Tra từ trực tiếp & Lưu vào Sổ Từ Vựng Cá Nhân.'
                    : 'YouPass 4.0 Feature: Click any sentence to highlight evidence, or click any keyword below for Instant Dictionary Lookup & Personal Notebook saving.'}
                </p>

                <div className="space-y-4 text-base leading-relaxed text-[#0F172A]">
                  <p>
                    {currentPassage.segments.map((seg) => {
                      const key = `${currentPassage.id}-${seg.id}`;
                      const isHighlighted = !!highlightedSentences[key];
                      return (
                        <span
                          key={seg.id}
                          onClick={() => {
                            if (highlightActive) {
                              setHighlightedSentences((prev) => ({
                                ...prev,
                                [key]: !prev[key]
                              }));
                            }
                          }}
                          className={`cursor-pointer transition-colors rounded px-1 ${
                            isHighlighted
                              ? 'bg-[#BAE6FD]/60 text-[#0F172A] font-medium'
                              : 'hover:bg-[#F0F7FF]'
                          }`}
                        >
                          {seg.text}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>

              {/* YouPass 4.0 Inline Dictionary Lookup Bar */}
              <div className="mt-6 pt-5 border-t border-[#DCEBFA] space-y-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-data text-xs font-bold text-[#0284C7] mr-1">
                    {lang === 'vi'
                      ? 'TRA TỪ TRỰC TIẾP TRONG BÀI ĐỌC:'
                      : 'INLINE PASSAGE DICTIONARY:'}
                  </span>
                  {currentPassage.glossary.map((g) => {
                    const active = selectedGlossaryWord?.word === g.word;
                    return (
                      <button
                        key={g.word}
                        type="button"
                        onClick={() => setSelectedGlossaryWord(g)}
                        className={`px-2.5 py-1 rounded-md font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#0284C7] text-[#FFFFFF]'
                            : 'bg-[#F0F7FF] text-[#0284C7] hover:bg-[#E0F2FE]'
                        }`}
                      >
                        {g.word}
                      </button>
                    );
                  })}
                </div>

                {selectedGlossaryWord && (
                  <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-black text-[#0F172A]">
                          {selectedGlossaryWord.word}
                        </span>
                        <span className="font-mono-data text-xs text-[#334155]">
                          {selectedGlossaryWord.ipa}
                        </span>
                        <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF] font-bold">
                          {selectedGlossaryWord.cefr} • {selectedGlossaryWord.pos}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#0F172A]">
                        {selectedGlossaryWord.meaningVi}
                      </p>
                      <p className="text-xs text-[#334155]">
                        {selectedGlossaryWord.meaningEn}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          playPronunciation('', selectedGlossaryWord.word, 'en-GB')
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#DCEBFA] text-[#0284C7] font-mono-data text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>UK</span>
                      </button>
                      {onSaveToNotebook && (
                        <button
                          type="button"
                          onClick={() =>
                            onSaveToNotebook(
                              selectedGlossaryWord.word,
                              selectedGlossaryWord.meaningVi,
                              selectedGlossaryWord.ipa,
                              selectedGlossaryWord.cefr
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7] font-display text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>+ Sổ Từ Vựng</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          onSelectVocabFromPassage(selectedGlossaryWord.word)
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold cursor-pointer"
                      >
                        Học ở Trạm 02
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Pane: Interactive Exam Questions */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F8FBFF] text-[#0F172A] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCEBFA]">
                  <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                    Questions 1–{currentPassage.questions.length} ({currentPassage.topic})
                  </h3>
                  {submitted && (
                    <span className="font-mono-data text-xs px-3 py-1 rounded bg-[#0284C7] text-[#FFFFFF] font-bold">
                      SCORE: {scoreCount}/{currentPassage.questions.length} • EST. BAND{' '}
                      {estimatedReadingBand}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#DCEBFA]">
                  {currentPassage.questions.map((q) => {
                    const aKey = `${currentPassage.id}-${q.id}`;
                    const chosen = answers[aKey];
                    const isCorrect = chosen === q.answer;
                    return (
                      <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <p className="text-sm font-semibold text-[#0F172A] leading-snug">
                          {q.prompt}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((opt) => {
                            const active = chosen === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() =>
                                  setAnswers((prev) => ({ ...prev, [aKey]: opt }))
                                }
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono-data font-bold transition-colors border cursor-pointer ${
                                  active
                                    ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                                    : 'bg-[#FFFFFF] text-[#334155] border-[#DCEBFA] hover:bg-[#E0F2FE]'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {submitted && (
                          <div
                            className={`text-xs p-3.5 rounded-xl border ${
                              isCorrect
                                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#0F172A]'
                                : 'bg-[#FFF1F2] border-[#FECDD3] text-[#0F172A]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                              ) : (
                                <XCircle className="w-4 h-4 text-[#E11D48]" />
                              )}
                              <span>
                                {lang === 'vi'
                                  ? `Đáp án đúng: ${q.answer} — Giải thích vị trí thông tin:`
                                  : `Correct Answer: ${q.answer} — Detailed Explanation:`}
                              </span>
                            </div>
                            <p className="text-[#334155]">
                              {lang === 'vi' ? q.explanationVi : q.explanationEn}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Question Palette Bar */}
              <div className="mt-6 pt-4 border-t border-[#DCEBFA] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {currentPassage.questions.map((q) => {
                    const answered = !!answers[`${currentPassage.id}-${q.id}`];
                    return (
                      <span
                        key={q.id}
                        className={`w-7 h-7 rounded-md flex items-center justify-center font-mono-data text-xs font-bold border ${
                          answered
                            ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                            : 'bg-[#FFFFFF] text-[#64748B] border-[#DCEBFA]'
                        }`}
                      >
                        {q.id}
                      </span>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setAnswers({});
                  }}
                  className="text-xs font-mono-data font-bold text-[#0284C7] hover:underline cursor-pointer"
                >
                  {lang === 'vi' ? 'Làm lại đề này' : 'Reset Passage'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SKILL 2: LISTENING LAB */}
        {activeSkill === 'listening' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DCEBFA]">
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#FFFFFF] text-[#0F172A] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-xl font-extrabold text-[#0F172A]">
                  {LISTENING_SECTIONS[0].title}
                </h3>
                <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                  PART 4 ACADEMIC AUDIO
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono-data text-xs text-[#0284C7] font-bold">
                    AUDIO STREAM • BRITISH ACADEMIC LECTURER
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setListeningPlaying(true);
                      playPronunciation(
                        '',
                        LISTENING_SECTIONS[0].audioScript,
                        'en-GB'
                      );
                      setTimeout(() => setListeningPlaying(false), 6000);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {listeningPlaying
                        ? 'Đang phát băng nghe...'
                        : 'Phát Băng Nghe Section 4'}
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#DCEBFA] text-sm text-[#334155] leading-relaxed">
                  <span className="font-mono-data text-xs text-[#059669] font-bold block mb-1">
                    TRANSCRIPT & PARAPHRASE EVIDENCE:
                  </span>
                  <p className="text-[#0F172A]">
                    {LISTENING_SECTIONS[0].audioScript}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F8FBFF] text-[#0F172A] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Điền Từ Vào Chỗ Trống (NO MORE THAN ONE WORD)
                </h3>
                <button
                  type="button"
                  onClick={() => setListeningSubmitted(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold cursor-pointer"
                >
                  Chấm Điểm Listening
                </button>
              </div>

              <div className="divide-y divide-[#DCEBFA]">
                {LISTENING_SECTIONS[0].questions.map((q) => {
                  const userVal = (listeningInputs[q.id] || '').trim().toLowerCase();
                  const correct = userVal === q.answer.toLowerCase();
                  return (
                    <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                      <p className="text-sm font-medium text-[#0F172A]">{q.prompt}</p>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          value={listeningInputs[q.id] || ''}
                          onChange={(e) =>
                            setListeningInputs((prev) => ({
                              ...prev,
                              [q.id]: e.target.value
                            }))
                          }
                          placeholder="Gõ 1 từ tiếng Anh..."
                          className="bg-[#FFFFFF] border border-[#DCEBFA] rounded-lg px-3.5 py-2 text-sm text-[#0284C7] font-mono-data font-bold"
                        />
                        {listeningSubmitted && (
                          <span
                            className={`font-mono-data text-xs px-2.5 py-1 rounded font-bold ${
                              correct
                                ? 'bg-[#059669] text-[#FFFFFF]'
                                : 'bg-[#E11D48] text-[#FFFFFF]'
                            }`}
                          >
                            {correct ? 'CORRECT' : `ANSWER: ${q.answer}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono-data text-[#64748B]">
                        Paraphrase Map:{' '}
                        <span className="text-[#0F172A] font-bold">
                          {q.questionKeyword}
                        </span>{' '}
                        →{' '}
                        <span className="text-[#059669] font-bold">
                          {q.transcriptParaphrase}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SKILL 3: WRITING TASK 2 AI BAND GRADER */}
        {activeSkill === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DCEBFA]">
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#FFFFFF] text-[#0F172A] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-xl font-extrabold text-[#0F172A]">
                  IELTS WRITING TASK 2 AI WORKBENCH
                </h3>
                <div className="flex items-center gap-1.5">
                  {WRITING_PROMPTS.map((wp, idx) => (
                    <button
                      key={wp.id}
                      type="button"
                      onClick={() => {
                        setWritingPromptIdx(idx);
                        setEssayText(wp.sampleUpgradeDraft);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono-data font-bold cursor-pointer ${
                        writingPromptIdx === idx
                          ? 'bg-[#0284C7] text-[#FFFFFF]'
                          : 'bg-[#F0F7FF] text-[#334155]'
                      }`}
                    >
                      Topic {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-1.5">
                <div className="font-mono-data text-xs text-[#0284C7] font-bold">
                  PROMPT • {currentWritingPrompt.topic.toUpperCase()}
                </div>
                <p className="text-sm text-[#0F172A] leading-relaxed">
                  {currentWritingPrompt.prompt}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#334155]">
                  <span>NHẬP BÀI LUẬN HOẶC BẤM NÂNG CẤP TỪ VỰNG C1/C2:</span>
                  <span className="font-bold text-[#0284C7]">
                    {writingAnalysis.wordCount} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  className="w-full rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] p-4 text-sm text-[#0F172A] leading-relaxed focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyAllWritingUpgrades}
                  className="px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Nâng Cấp 1-Chạm Lên Từ Vựng C1/C2 (Band 7.5+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEssayText(currentWritingPrompt.sampleUpgradeDraft)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0F172A] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F8FBFF] text-[#0F172A] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Chấm Điểm AI 4 Tiêu Chí & Gợi Ý Nâng Cấp Từ Vựng
                </h3>
                <span className="font-mono-data text-sm px-3 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-black">
                  OVERALL BAND: {writingAnalysis.overall}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DCEBFA]">
                  <div className="font-mono-data text-xs text-[#64748B]">Task Response</div>
                  <div className="font-display text-xl font-black text-[#0284C7] mt-1">
                    {writingAnalysis.trScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DCEBFA]">
                  <div className="font-mono-data text-xs text-[#64748B]">Coherence</div>
                  <div className="font-display text-xl font-black text-[#059669] mt-1">
                    {writingAnalysis.ccScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DCEBFA]">
                  <div className="font-mono-data text-xs text-[#64748B]">Lexical Resource</div>
                  <div className="font-display text-xl font-black text-[#0284C7] mt-1">
                    {writingAnalysis.lrScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#DCEBFA]">
                  <div className="font-mono-data text-xs text-[#64748B]">Grammar Range</div>
                  <div className="font-display text-xl font-black text-[#0F172A] mt-1">
                    {writingAnalysis.graScore}
                  </div>
                </div>
              </div>

              <div className="divide-y divide-[#DCEBFA] bg-[#FFFFFF] rounded-xl border border-[#DCEBFA] p-4">
                {LEXICAL_UPGRADE_RULES.slice(0, 4).map((rule, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                    <span className="text-[#E11D48] line-through mr-2 font-mono-data">
                      {rule.weakLabel}
                    </span>
                    <span className="text-[#059669] font-mono-data font-bold">
                      → {rule.band75Upgrade} ({rule.cefr})
                    </span>
                    <div className="text-[#334155] mt-0.5">{rule.explanationVi}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SKILL 4: SPEAKING PART 2 & 3 */}
        {activeSkill === 'speaking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DCEBFA]">
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#FFFFFF] text-[#0F172A] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-xl font-extrabold text-[#0F172A]">
                  {SPEAKING_CUE_CARDS[0].part}
                </h3>
                <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                  2:00 LONG TURN
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#F0F7FF] border border-[#BAE6FD] space-y-3">
                <div className="font-display text-base font-extrabold text-[#0284C7]">
                  {SPEAKING_CUE_CARDS[0].topic}
                </div>
                <ul className="space-y-1.5 text-xs text-[#334155] list-disc pl-5">
                  {SPEAKING_CUE_CARDS[0].bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SPEAKING_CUE_CARDS[0].targetCollocations.map((col, idx) => {
                  const used = speakingTranscript
                    .toLowerCase()
                    .includes(col.phrase.toLowerCase());
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                        used
                          ? 'bg-[#ECFDF5] text-[#0F172A] border-[#059669]'
                          : 'bg-[#F8FBFF] text-[#334155] border-[#DCEBFA]'
                      }`}
                    >
                      <div>
                        <div className="font-mono-data font-bold text-[#0F172A]">
                          {col.phrase}
                        </div>
                        <div>{col.meaningVi}</div>
                      </div>
                      <span className="font-mono-data font-bold px-2 py-0.5 rounded bg-[#0284C7] text-[#FFFFFF]">
                        {used ? 'USED ✓' : col.cefr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F8FBFF] text-[#0F172A] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#DCEBFA]">
                <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                  Phòng Luyện Nói & Kiểm Tra Phát Âm Mẫu
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakingRunning((r) => !r)}
                    className="px-3 py-1.5 rounded-lg bg-[#D97706] text-[#FFFFFF] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {speakingRunning ? 'PAUSE' : 'START'} ({spkMins}:{spkSecs})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      playPronunciation('', speakingTranscript, 'en-GB')
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Nghe Bài Mẫu 8.0</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                value={speakingTranscript}
                onChange={(e) => setSpeakingTranscript(e.target.value)}
                className="w-full rounded-xl bg-[#FFFFFF] border border-[#DCEBFA] p-4 text-sm text-[#0F172A] leading-relaxed"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lead Generation & Commercial Footer (Sky-Blue & White 4.0) */}
      <footer className="bg-[#FFFFFF] rounded-2xl overflow-hidden border border-[#DCEBFA] shadow-sm">
        <div className="p-6 md:p-8 bg-[#F0F7FF] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#DCEBFA]">
          <div className="lg:col-span-7 space-y-2">
            <h2 className="font-display text-2xl font-black text-[#0F172A]">
              {lang === 'vi'
                ? 'NHẬN LỘ TRÌNH CÁ NHÂN HÓA YOUPASS 4.0 & BỘ EBOOK 10,972 TỪ VỰNG IELTS'
                : 'GET YOUR PERSONALIZED YOUPASS 4.0 STUDY PLAN & 10,972-WORD IELTS EBOOK'}
            </h2>
            <p className="text-sm text-[#334155] max-w-2xl">
              {lang === 'vi'
                ? 'Hệ thống tự động thiết lập lịch ôn tập FSRS theo Band mục tiêu của bạn và gửi kèm kho PDF 538 từ khóa Reading + 179 nhóm Listening Paraphrase.'
                : 'Automatically configures your daily FSRS schedule by target Band score and sends the complete 538 Reading & 179 Listening Paraphrase PDF bundle.'}
            </p>
          </div>

          <div className="lg:col-span-5">
            {leadSubmitted ? (
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#059669] text-[#0F172A] text-sm">
                Đã ghi nhận thông tin của <strong>{leadName}</strong> ({leadTarget}). Lộ trình FSRS cá nhân hóa đã được kích hoạt!
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!leadContact.trim()) return;
                  try {
                    await fetch('/api/admin', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'createLead',
                        name: leadName.trim() || 'Học viên IELTS',
                        contact: leadContact.trim(),
                        targetBand: leadTarget
                      })
                    });
                  } catch {
                    // ignore
                  }
                  setLeadSubmitted(true);
                }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
              >
                <input
                  type="text"
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Họ và tên..."
                  className="bg-[#FFFFFF] border border-[#DCEBFA] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B]"
                />
                <input
                  type="text"
                  required
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  placeholder="Email hoặc SĐT Zalo..."
                  className="bg-[#FFFFFF] border border-[#DCEBFA] rounded-lg px-3.5 py-2.5 text-sm text-[#0F172A] placeholder:text-[#64748B]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-extrabold text-sm rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Nhận Lộ Trình</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-[#FFFFFF] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div>
            <span className="font-semibold text-[#0F172A]">
              YOUPASS × WORD ATLAS 4.0
            </span>{' '}
            • Nền tảng Luyện thi IELTS & Từ vựng FSRS Thương mại.
          </div>
          <div className="font-mono-data text-xs text-right">
            <span>
              Open Dataset Attribution: Word Atlas Contributors (CC BY 4.0 / MIT) & hefengxian/my-ielts.
            </span>
          </div>
        </div>
      </footer>
    </section>
  );
}
