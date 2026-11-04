'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
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

interface ReadingPassageData {
  id: string;
  title: string;
  bandLabel: string;
  topic: string;
  segments: { id: number; text: string }[];
  clickableWords: string[];
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
    clickableWords: [
      'urbanization',
      'pragmatic',
      'mitigate',
      'resilient',
      'foster',
      'catalyst',
      'biodiversity'
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
    clickableWords: [
      'ubiquity',
      'cognitive',
      'mundane',
      'erode',
      'disparity',
      'scrutinize',
      'paradigm'
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
        prompt: '1. Degraded coral reefs fail to attract young fish primarily because they lack acoustic cues and have become ________.',
        answer: 'silent',
        questionKeyword: 'lack acoustic cues / no sound',
        transcriptParaphrase: 'eerily silent'
      },
      {
        id: 2,
        prompt: '2. Playing healthy reef sounds via underwater speakers can ________ the rate of juvenile fish settlement.',
        answer: 'double',
        questionKeyword: 'increase twofold',
        transcriptParaphrase: 'double fish settlement rates'
      },
      {
        id: 3,
        prompt: '3. Acoustic enrichment serves as a sensory ________ that guides marine larvae back to recovering habitats.',
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

const LEXICAL_UPGRADE_RULES: {
  weakPattern: RegExp;
  weakLabel: string;
  band75Upgrade: string;
  cefr: string;
  explanationVi: string;
  explanationEn: string;
}[] = [
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
  lang = 'vi'
}: Props) {
  const [activeSkill, setActiveSkill] = useState<'reading' | 'listening' | 'writing' | 'speaking'>('reading');

  // Reading state
  const [passageIdx, setPassageIdx] = useState<number>(0);
  const currentPassage = READING_PASSAGES[passageIdx] || READING_PASSAGES[0];
  const [secondsLeft, setSecondsLeft] = useState<number>(1200);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [highlightActive, setHighlightActive] = useState<boolean>(true);
  const [highlightedSentences, setHighlightedSentences] = useState<Record<string, boolean>>({
    'p1-1': true
  });
  const [answers, setAnswers] = useState<Record<string, string>>({
    'p1-1': 'TRUE'
  });
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Listening state
  const [listeningInputs, setListeningInputs] = useState<Record<number, string>>({});
  const [listeningSubmitted, setListeningSubmitted] = useState<boolean>(false);
  const [listeningPlaying, setListeningPlaying] = useState<boolean>(false);

  // Writing state
  const [writingPromptIdx, setWritingPromptIdx] = useState<number>(0);
  const currentWritingPrompt = WRITING_PROMPTS[writingPromptIdx] || WRITING_PROMPTS[0];
  const [essayText, setEssayText] = useState<string>(currentWritingPrompt.sampleUpgradeDraft);
  const [writingEvaluated, setWritingEvaluated] = useState<boolean>(true);

  // Speaking state
  const [speakingSeconds, setSpeakingSeconds] = useState<number>(120);
  const [speakingRunning, setSpeakingRunning] = useState<boolean>(false);
  const [speakingTranscript, setSpeakingTranscript] = useState<string>(
    SPEAKING_CUE_CARDS[0].modelSample
  );

  // Lead gen state
  const [leadName, setLeadName] = useState('');
  const [leadTarget, setLeadTarget] = useState('Band 7.5+');
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
    (acc, q) => acc + (answers[`${currentPassage.id}-${q.id}`] === q.answer ? 1 : 0),
    0
  );

  const estimatedReadingBand =
    scoreCount === 4 ? '8.5' : scoreCount === 3 ? '7.5' : scoreCount === 2 ? '6.5' : '5.5';

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
    const lrScore = hasAcademicMarkers ? 8.0 : matchedUpgrades.length > 2 ? 6.5 : 7.5;
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
    setWritingEvaluated(true);
  };

  return (
    <section id="exam-room" className="mt-14 space-y-12">
      {/* Split-Screen Computer-Delivered 4-Skill Exam Room */}
      <div className="concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]">
        {/* Exam Top Bar */}
        <div className="px-6 py-4 bg-[#121419] border-b border-[#2E3340] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-display text-lg md:text-xl font-extrabold text-[#F4F1EA]">
              {lang === 'vi'
                ? '06 / PHÒNG THI MÁY TÍNH 4 KỸ NĂNG (IDP / BC COMPUTER-DELIVERED SIMULATION)'
                : '06 / 4-SKILL COMPUTER-DELIVERED EXAM SIMULATOR (IDP / BC STANDARD)'}
            </h2>

            {/* 4-Skill Switcher Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSkill('reading')}
                className={`px-3.5 py-1.5 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer ${
                  activeSkill === 'reading'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA] border border-[#363B47]'
                }`}
              >
                01 • READING (SPLIT-SCREEN)
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('listening')}
                className={`px-3.5 py-1.5 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'listening'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA] border border-[#363B47]'
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>02 • LISTENING LAB</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('writing')}
                className={`px-3.5 py-1.5 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'writing'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA] border border-[#363B47]'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>03 • WRITING AI GRADER</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSkill('speaking')}
                className={`px-3.5 py-1.5 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                  activeSkill === 'speaking'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'bg-[#1F2229] text-[#B8B2A6] hover:text-[#F4F1EA] border border-[#363B47]'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>04 • SPEAKING PART 2/3</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeSkill === 'reading' && (
              <>
                <div className="flex items-center gap-1 bg-[#1F2229] p-1 rounded-lg border border-[#363B47]">
                  {READING_PASSAGES.map((p, idx) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setPassageIdx(idx);
                        setSubmitted(false);
                      }}
                      className={`px-2.5 py-1 rounded text-xs font-mono-data font-bold cursor-pointer ${
                        passageIdx === idx
                          ? 'bg-[#FACC15] text-[#16181D]'
                          : 'text-[#B8B2A6] hover:text-[#F4F1EA]'
                      }`}
                    >
                      Passage {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setHighlightActive((v) => !v)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono-data transition-colors cursor-pointer ${
                    highlightActive
                      ? 'bg-[#FACC15] text-[#16181D] font-bold'
                      : 'bg-[#252934] text-[#B8B2A6]'
                  }`}
                >
                  <Highlighter className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'vi' ? 'HIGHLIGHT:' : 'HIGHLIGHT:'}{' '}
                    {highlightActive ? 'ON' : 'OFF'}
                  </span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#252934] text-[#FACC15] font-mono-data text-xs cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs font-bold transition-colors cursor-pointer"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>
                  {lang === 'vi' ? 'NỘP BÀI & CHẤM BAND' : 'SUBMIT & GRADE BAND'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* SKILL 1: READING SPLIT-SCREEN */}
        {activeSkill === 'reading' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
            {/* Left Pane: Academic Reading Passage */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F4F1EA] text-[#16181D] flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-5 border-b border-[#16181D]/15">
                  <h3 className="font-display text-xl font-extrabold text-[#16181D]">
                    {currentPassage.title}
                  </h3>
                  <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] font-bold">
                    {currentPassage.bandLabel}
                  </span>
                </div>

                <p className="text-xs text-[#4A4740] mb-4">
                  {lang === 'vi'
                    ? 'Mẹo phòng thi: Nhấp vào câu bất kỳ để bôi vàng dẫn chứng (Highlight), hoặc nhấp vào các từ vựng bên dưới để đẩy lên Trạm FSRS 02.'
                    : 'Exam Tip: Click any sentence to highlight evidence in yellow, or click any academic keyword below to load it into Station 02 FSRS.'}
                </p>

                <div className="space-y-4 text-base leading-relaxed text-[#16181D]">
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
                              ? 'bg-[#FACC15]/65 text-[#16181D]'
                              : 'hover:bg-[#16181D]/5'
                          }`}
                        >
                          {seg.text}
                        </span>
                      );
                    })}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#16181D]/15">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-data text-xs font-bold text-[#16181D]">
                    {lang === 'vi'
                      ? 'TỪ VỰNG HỌC THUẬT TRONG BÀI (CHẠM ĐỂ ĐƯA VÀO TRẠM 02 FSRS):'
                      : 'ACADEMIC KEYWORDS IN PASSAGE (CLICK TO SEND TO STATION 02 FSRS):'}
                  </span>
                  {currentPassage.clickableWords.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => onSelectVocabFromPassage(w)}
                      className="px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] hover:bg-[#065F46] hover:text-[#F4F1EA] font-mono-data text-xs transition-colors cursor-pointer"
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Pane: Interactive Exam Questions */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#16181D] text-[#F4F1EA] flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#2E3340]">
                  <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                    Questions 1–{currentPassage.questions.length} ({currentPassage.topic})
                  </h3>
                  {submitted && (
                    <span className="font-mono-data text-xs px-3 py-1 rounded bg-[#FACC15] text-[#16181D] font-bold">
                      SCORE: {scoreCount}/{currentPassage.questions.length} • EST. BAND{' '}
                      {estimatedReadingBand}
                    </span>
                  )}
                </div>

                <div className="divide-y divide-[#2E3340]">
                  {currentPassage.questions.map((q) => {
                    const aKey = `${currentPassage.id}-${q.id}`;
                    const chosen = answers[aKey];
                    const isCorrect = chosen === q.answer;
                    return (
                      <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                        <p className="text-sm font-medium text-[#F4F1EA] leading-snug">
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
                                className={`px-3.5 py-1.5 rounded text-xs font-mono-data font-bold transition-colors border cursor-pointer ${
                                  active
                                    ? 'bg-[#FACC15] text-[#16181D] border-[#FACC15]'
                                    : 'bg-[#1F2229] text-[#B8B2A6] border-[#363B47] hover:text-[#F4F1EA]'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        {submitted && (
                          <div
                            className={`text-xs p-3 rounded border ${
                              isCorrect
                                ? 'bg-[#065F46]/25 border-[#10B981]/40 text-[#F4F1EA]'
                                : 'bg-[#EA580C]/20 border-[#EA580C]/40 text-[#F4F1EA]'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {isCorrect ? (
                                <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                              ) : (
                                <XCircle className="w-4 h-4 text-[#EA580C]" />
                              )}
                              <span>
                                {lang === 'vi'
                                  ? `Đáp án đúng: ${q.answer} — Giải thích chi tiết:`
                                  : `Correct Answer: ${q.answer} — Explanation:`}
                              </span>
                            </div>
                            <p className="text-[#B8B2A6]">
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
              <div className="mt-6 pt-4 border-t border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  {currentPassage.questions.map((q) => {
                    const answered = !!answers[`${currentPassage.id}-${q.id}`];
                    return (
                      <span
                        key={q.id}
                        className={`w-7 h-7 rounded flex items-center justify-center font-mono-data text-xs font-bold ${
                          answered
                            ? 'bg-[#FACC15] text-[#16181D]'
                            : 'bg-[#252934] text-[#B8B2A6]'
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
                  className="text-xs font-mono-data text-[#B8B2A6] hover:text-[#FACC15] cursor-pointer"
                >
                  {lang === 'vi' ? 'Làm lại đề này' : 'Reset Passage'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SKILL 2: LISTENING LAB (AUDIO LECTURE + PARAPHRASE DICTATION) */}
        {activeSkill === 'listening' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F4F1EA] text-[#16181D] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#16181D]/15">
                <h3 className="font-display text-xl font-extrabold text-[#16181D]">
                  {LISTENING_SECTIONS[0].title}
                </h3>
                <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] font-bold">
                  PART 4 ACADEMIC AUDIO
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#16181D] text-[#F4F1EA] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="font-mono-data text-xs text-[#FACC15]">
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
                    className="px-4 py-2 rounded-lg bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] font-display font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>
                      {listeningPlaying
                        ? lang === 'vi'
                          ? 'Đang phát băng nghe...'
                          : 'Playing Lecture Audio...'
                        : lang === 'vi'
                          ? 'Phát Băng Nghe Section 4'
                          : 'Play Section 4 Lecture Audio'}
                    </span>
                  </button>
                </div>

                <div className="pt-3 border-t border-[#2E3340] text-sm text-[#B8B2A6] leading-relaxed">
                  <span className="font-mono-data text-xs text-[#10B981] font-bold block mb-1">
                    {listeningSubmitted
                      ? 'TRANSCRIPT REVEALED (BẢN GHI LỜI THOẠI):'
                      : 'TRANSCRIPT PREVIEW (NỘP BÀI ĐỂ ĐỐI CHIẾU PARAPHRASE):'}
                  </span>
                  <p className="text-[#F4F1EA]">
                    {LISTENING_SECTIONS[0].audioScript}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 bg-[#16181D] text-[#F4F1EA] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#2E3340]">
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  {lang === 'vi'
                    ? 'Điền Từ Vào Chỗ Trống (NO MORE THAN ONE WORD)'
                    : 'Note Completion (NO MORE THAN ONE WORD)'}
                </h3>
                <button
                  type="button"
                  onClick={() => setListeningSubmitted(true)}
                  className="px-3.5 py-1.5 rounded bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs font-bold cursor-pointer"
                >
                  {lang === 'vi' ? 'Chấm Điểm Listening' : 'Check Answers'}
                </button>
              </div>

              <div className="divide-y divide-[#2E3340]">
                {LISTENING_SECTIONS[0].questions.map((q) => {
                  const userVal = (listeningInputs[q.id] || '').trim().toLowerCase();
                  const correct = userVal === q.answer.toLowerCase();
                  return (
                    <div key={q.id} className="py-4 first:pt-0 last:pb-0 space-y-2.5">
                      <p className="text-sm text-[#F4F1EA]">{q.prompt}</p>
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
                          className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2 text-sm text-[#FACC15] font-mono-data"
                        />
                        {listeningSubmitted && (
                          <span
                            className={`font-mono-data text-xs px-2.5 py-1 rounded font-bold ${
                              correct
                                ? 'bg-[#065F46] text-[#F4F1EA]'
                                : 'bg-[#EA580C] text-[#F4F1EA]'
                            }`}
                          >
                            {correct ? 'CORRECT' : `ANSWER: ${q.answer}`}
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono-data text-[#B8B2A6]">
                        Paraphrase Map: <span className="text-[#F4F1EA]">{q.questionKeyword}</span>{' '}
                        → <span className="text-[#10B981]">{q.transcriptParaphrase}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SKILL 3: WRITING TASK 2 AI BAND GRADER & LEXICAL UPGRADER */}
        {activeSkill === 'writing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
            {/* Left Pane: Essay Editor & Prompt Selector */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F4F1EA] text-[#16181D] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#16181D]/15">
                <h3 className="font-display text-xl font-extrabold text-[#16181D]">
                  IELTS WRITING TASK 2 WORKBENCH
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
                          ? 'bg-[#16181D] text-[#FACC15]'
                          : 'bg-[#16181D]/10 text-[#16181D]'
                      }`}
                    >
                      Topic {idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#16181D] text-[#F4F1EA] space-y-1.5">
                <div className="font-mono-data text-xs text-[#FACC15] font-bold">
                  PROMPT • {currentWritingPrompt.topic.toUpperCase()}
                </div>
                <p className="text-sm leading-relaxed">{currentWritingPrompt.prompt}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono-data text-[#4A4740]">
                  <span>
                    {lang === 'vi'
                      ? 'NHẬP BÀI LUẬN CỦA BẠN HOẶC THỬ NÂNG CẤP TỪ VỰNG BAND 7.5+:'
                      : 'WRITE YOUR ESSAY OR TEST LIVE C1/C2 LEXICAL UPGRADE:'}
                  </span>
                  <span className="font-bold text-[#16181D]">
                    {writingAnalysis.wordCount} words
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  className="w-full rounded-xl bg-[#EAE5D9] border border-[#16181D]/20 p-4 text-sm text-[#16181D] leading-relaxed focus:outline-none focus:border-[#16181D]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleApplyAllWritingUpgrades}
                  className="px-4 py-2.5 rounded-xl bg-[#065F46] hover:bg-[#047857] text-[#F4F1EA] font-display font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FACC15]" />
                  <span>
                    {lang === 'vi'
                      ? 'Nâng Cấp Toàn Bộ Lên Từ Vựng C1/C2 (Band 7.5+)'
                      : 'Auto-Upgrade Draft to C1/C2 Academic Lexicon (Band 7.5+)'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEssayText(currentWritingPrompt.sampleUpgradeDraft)}
                  className="px-3.5 py-2.5 rounded-xl bg-[#16181D]/10 hover:bg-[#16181D]/20 text-[#16181D] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Draft</span>
                </button>
              </div>
            </div>

            {/* Right Pane: Instant 4-Criteria Band Rubric & Lexical Suggestions */}
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#16181D] text-[#F4F1EA] space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#2E3340]">
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  {lang === 'vi'
                    ? 'Chấm Điểm 4 Tiêu Chí & Đề Xuất Từ Vựng C1/C2'
                    : '4-Criteria Band Diagnostic & C1/C2 Lexical Upgrades'}
                </h3>
                {writingEvaluated && (
                  <span className="font-mono-data text-sm px-3 py-1 rounded bg-[#FACC15] text-[#16181D] font-black">
                    OVERALL BAND: {writingAnalysis.overall}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <div className="font-mono-data text-xs text-[#B8B2A6]">Task Response</div>
                  <div className="font-display text-xl font-black text-[#FACC15] mt-1">
                    {writingAnalysis.trScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <div className="font-mono-data text-xs text-[#B8B2A6]">Coherence</div>
                  <div className="font-display text-xl font-black text-[#10B981] mt-1">
                    {writingAnalysis.ccScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <div className="font-mono-data text-xs text-[#B8B2A6]">Lexical Resource</div>
                  <div className="font-display text-xl font-black text-[#FACC15] mt-1">
                    {writingAnalysis.lrScore}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-[#1F2229] border border-[#2E3340]">
                  <div className="font-mono-data text-xs text-[#B8B2A6]">Grammar Range</div>
                  <div className="font-display text-xl font-black text-[#F4F1EA] mt-1">
                    {writingAnalysis.graScore}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="font-mono-data text-xs font-bold text-[#FACC15]">
                  {writingAnalysis.matchedUpgrades.length > 0
                    ? lang === 'vi'
                      ? `PHÁT HIỆN ${writingAnalysis.matchedUpgrades.length} CỤM TỪ BAND 5.5–6.0 CẦN NÂNG CẤP:`
                      : `DETECTED ${writingAnalysis.matchedUpgrades.length} BAND 5.5–6.0 PHRASES TO UPGRADE:`
                    : lang === 'vi'
                      ? 'TUYỆT VỜI! BÀI VIẾT ĐÃ SỬ DỤNG TỪ VỰNG HỌC THUẬT C1/C2 CHUẨN BAND 7.5+.'
                      : 'EXCELLENT! YOUR DRAFT USES C1/C2 ACADEMIC LEXICON AT BAND 7.5+.'}
                </div>

                <div className="divide-y divide-[#2E3340]">
                  {LEXICAL_UPGRADE_RULES.slice(0, 4).map((rule, idx) => (
                    <div key={idx} className="py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[#EA580C] line-through mr-2 font-mono-data">
                          {rule.weakLabel}
                        </span>
                        <span className="text-[#10B981] font-mono-data font-bold">
                          → {rule.band75Upgrade} ({rule.cefr})
                        </span>
                        <div className="text-[#B8B2A6] mt-0.5">
                          {lang === 'vi' ? rule.explanationVi : rule.explanationEn}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SKILL 4: SPEAKING PART 2 & 3 CUE CARD & COLLOCATION EVALUATOR */}
        {activeSkill === 'speaking' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
            <div className="lg:col-span-6 p-6 md:p-8 bg-[#F4F1EA] text-[#16181D] space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[#16181D]/15">
                <h3 className="font-display text-xl font-extrabold text-[#16181D]">
                  {SPEAKING_CUE_CARDS[0].part}
                </h3>
                <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] font-bold">
                  2:00 LONG TURN
                </span>
              </div>

              <div className="p-5 rounded-xl bg-[#16181D] text-[#F4F1EA] space-y-3">
                <div className="font-display text-base font-extrabold text-[#FACC15]">
                  {SPEAKING_CUE_CARDS[0].topic}
                </div>
                <ul className="space-y-1.5 text-xs text-[#B8B2A6] list-disc pl-5">
                  {SPEAKING_CUE_CARDS[0].bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <div className="font-mono-data text-xs font-bold text-[#16181D]">
                  {lang === 'vi'
                    ? 'CỤM COLLOCATIONS MỤC TIÊU CẦN ĐƯA VÀO BÀI NÓI (BAND 7.5+):'
                    : 'TARGET BAND 7.5+ COLLOCATIONS TO INCLUDE IN YOUR RESPONSE:'}
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
                            ? 'bg-[#065F46] text-[#F4F1EA] border-[#065F46]'
                            : 'bg-[#EAE5D9] text-[#16181D] border-[#16181D]/15'
                        }`}
                      >
                        <div>
                          <div className="font-mono-data font-bold">{col.phrase}</div>
                          <div className="opacity-80">{col.meaningVi}</div>
                        </div>
                        <span className="font-mono-data font-bold px-2 py-0.5 rounded bg-[#16181D] text-[#FACC15]">
                          {used ? 'USED ✓' : col.cefr}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 p-6 md:p-8 bg-[#16181D] text-[#F4F1EA] space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#2E3340]">
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  {lang === 'vi'
                    ? 'Phòng Luyện Nói & Kiểm Tra Phát Âm Mẫu'
                    : 'Speaking Practice & Model Pronunciation'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeakingRunning((r) => !r)}
                    className="px-3 py-1.5 rounded bg-[#EA580C] text-[#F4F1EA] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
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
                    className="px-3 py-1.5 rounded bg-[#FACC15] text-[#16181D] font-mono-data text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? 'Nghe Bài Mẫu 8.0' : 'Listen Model 8.0'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono-data text-xs text-[#B8B2A6]">
                  {lang === 'vi'
                    ? 'BẢN GHI LỜI NÓI CỦA BẠN (TỰ ĐỘNG ĐỐI CHIẾU COLLOCATIONS):'
                    : 'YOUR SPOKEN TRANSCRIPT (LIVE COLLOCATION MATCHER):'}
                </label>
                <textarea
                  rows={6}
                  value={speakingTranscript}
                  onChange={(e) => setSpeakingTranscript(e.target.value)}
                  className="w-full rounded-xl bg-[#1F2229] border border-[#363B47] p-4 text-sm text-[#F4F1EA] leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Generation Boarding Pass & Legal Footer */}
      <footer className="concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]">
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#2E3340]">
          <div className="lg:col-span-7 space-y-2">
            <h2 className="font-display text-2xl font-extrabold text-[#F4F1EA]">
              {lang === 'vi'
                ? 'NHẬN LỘ TRÌNH ADAPTIVE CÁ NHÂN HÓA & BỘ EBOOK 7,298 TỪ VỰNG WORD-ATLAS'
                : 'GET YOUR PERSONALIZED ADAPTIVE ROADMAP & 7,298-WORD IELTS EBOOK'}
            </h2>
            <p className="text-sm text-[#B8B2A6] max-w-2xl">
              {lang === 'vi'
                ? 'Hệ thống tự động thiết lập lịch ôn tập FSRS theo Band mục tiêu của bạn và gửi kèm kho PDF 538 từ khóa Reading + 179 nhóm Listening Paraphrase.'
                : 'Automatically configures your daily FSRS schedule by target Band score and sends the complete 538 Reading & 179 Listening Paraphrase PDF bundle.'}
            </p>
          </div>

          <div className="lg:col-span-5">
            {leadSubmitted ? (
              <div className="p-4 rounded-xl bg-[#065F46]/30 border border-[#10B981] text-[#F4F1EA] text-sm">
                {lang === 'vi' ? (
                  <>
                    Đã ghi nhận thông tin của <strong>{leadName}</strong> ({leadTarget}). Lộ trình FSRS cá nhân hóa đã được kích hoạt và lưu vào hệ thống CRM!
                  </>
                ) : (
                  <>
                    Registered <strong>{leadName}</strong> ({leadTarget}). Your personalized FSRS schedule is active and saved to our CRM!
                  </>
                )}
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
                    // ignore network error
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
                  placeholder={lang === 'vi' ? 'Họ và tên...' : 'Full name...'}
                  className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#B8B2A6]/70"
                />
                <input
                  type="text"
                  required
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  placeholder={lang === 'vi' ? 'Email hoặc SĐT Zalo...' : 'Email or phone...'}
                  className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#B8B2A6]/70"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] font-display font-extrabold text-sm rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{lang === 'vi' ? 'Nhận Lộ Trình' : 'Get Roadmap'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-[#111318] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B8B2A6]">
          <div>
            <span>
              THE IELTS DICTIONARY × WORD ATLAS • International Concourse Bento Grid & FSRS Spaced Repetition.
            </span>
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
