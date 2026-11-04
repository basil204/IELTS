'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileCheck,
  Highlighter,
  Send,
  Sparkles,
  XCircle
} from 'lucide-react';

interface Props {
  onSelectVocabFromPassage: (word: string) => void;
}

const QUESTIONS = [
  {
    id: 1,
    type: 'TFNG',
    prompt:
      '1. Urban micro-forests planted using the Miyawaki method grow significantly faster than conventional municipal plantations.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'TRUE',
    explanation:
      'Đoạn 1 nêu rõ: "Miyawaki micro-forests exhibit a tenfold acceleration in canopy establishment compared to standard monoculture municipal plantings."'
  },
  {
    id: 2,
    type: 'TFNG',
    prompt:
      '2. Municipal governments have universally replaced all public parks with high-density micro-forests.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'FALSE',
    explanation:
      'Đoạn 2 chỉ nói các dự án này đóng vai trò bổ trợ ("complementary ecological corridors"), không phải thay thế toàn bộ công viên công cộng.'
  },
  {
    id: 3,
    type: 'TFNG',
    prompt:
      '3. The cost of maintaining a mature micro-forest after five years is lower than the initial soil preparation expense.',
    options: ['TRUE', 'FALSE', 'NOT GIVEN'],
    answer: 'NOT GIVEN',
    explanation:
      'Bài đọc đề cập rừng tự duy trì sau 3 năm nhưng không so sánh chi phí bảo trì sau 5 năm với chi phí làm đất ban đầu.'
  },
  {
    id: 4,
    type: 'CLOZE',
    prompt:
      '4. Điền 1 từ học thuật trong bài đọc: Dense native vegetation acts as a natural ________ to accelerate local biodiversity recovery.',
    options: ['catalyst', 'disparity', 'paradigm'],
    answer: 'catalyst',
    explanation:
      'Đoạn 2: "...dense multi-layered native vegetation serves as an ecological catalyst for avian and pollinator biodiversity."'
  }
];

export default function SplitScreenExamPreview({ onSelectVocabFromPassage }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(1200);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [highlightActive, setHighlightActive] = useState<boolean>(true);
  const [highlightedSentences, setHighlightedSentences] = useState<Record<number, boolean>>({
    1: true
  });
  const [answers, setAnswers] = useState<Record<number, string>>({
    1: 'TRUE'
  });
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Lead gen state
  const [leadName, setLeadName] = useState('');
  const [leadTarget, setLeadTarget] = useState('Band 7.0+');
  const [leadContact, setLeadContact] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const scoreCount = QUESTIONS.reduce(
    (acc, q) => acc + (answers[q.id] === q.answer ? 1 : 0),
    0
  );

  const passageSegments = [
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
      text: ' Empirical field studies scrutiny confirms that dense multi-layered native vegetation serves as an ecological catalyst for avian and pollinator biodiversity, becoming self-sustaining within thirty-six months.'
    }
  ];

  const clickableWords = [
    'urbanization',
    'pragmatic',
    'mitigate',
    'resilient',
    'foster',
    'catalyst',
    'biodiversity'
  ];

  return (
    <section id="exam-room" className="mt-14 space-y-12">
      {/* Split-Screen Computer-Delivered Exam Room */}
      <div className="concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]">
        {/* Exam Top Bar */}
        <div className="px-6 py-4 bg-[#121419] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg md:text-xl font-extrabold text-[#F4F1EA]">
              06 / PHÒNG THI MÁY TÍNH CHIA ĐÔI MÀN HÌNH (IDP / BC COMPUTER-DELIVERED SIMULATION)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setHighlightActive((v) => !v)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono-data transition-colors ${
                highlightActive
                  ? 'bg-[#FACC15] text-[#16181D] font-bold'
                  : 'bg-[#252934] text-[#B8B2A6]'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>BÔI VÀNG GHI CHÚ: {highlightActive ? 'BẬT' : 'TẮT'}</span>
            </button>

            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#252934] text-[#FACC15] font-mono-data text-xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {mins}:{secs}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs font-bold transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>NỘP BÀI & CHẤM TỰ ĐỘNG</span>
            </button>
          </div>
        </div>

        {/* Split-Screen 2 Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
          {/* Left Pane: Academic Reading Passage */}
          <div className="lg:col-span-6 p-6 md:p-8 bg-[#F4F1EA] text-[#16181D] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#16181D]/15">
                <h3 className="font-display text-xl font-extrabold text-[#16181D]">
                  READING PASSAGE 1: Urban Micro-Forests & Climate Resilience
                </h3>
                <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15]">
                  BAND 6.5–8.0 ACADEMIC
                </span>
              </div>

              <p className="text-xs text-[#4A4740] mb-4">
                Mẹo phòng thi: Nhấp vào câu bất kỳ để bôi vàng dẫn chứng (Highlight), hoặc nhấp vào các từ vựng gạch chân để tra cứu ngay trên trạm FSRS.
              </p>

              <div className="space-y-4 text-base leading-relaxed text-[#16181D]">
                <p>
                  {passageSegments.map((seg) => {
                    const isHighlighted = !!highlightedSentences[seg.id];
                    return (
                      <span
                        key={seg.id}
                        onClick={() => {
                          if (highlightActive) {
                            setHighlightedSentences((prev) => ({
                              ...prev,
                              [seg.id]: !prev[seg.id]
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
                  TỪ VỰNG TRỌNG TÂM TRONG BÀI (CHẠM ĐỂ ĐƯA VÀO TRẠM 02 FSRS):
                </span>
                {clickableWords.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onSelectVocabFromPassage(w)}
                    className="px-2.5 py-1 rounded bg-[#16181D] text-[#FACC15] hover:bg-[#065F46] hover:text-[#F4F1EA] font-mono-data text-xs transition-colors"
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
              <div className="flex items-center justify-between pb-4 border-b border-[#2E3340]">
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  Questions 1–4 (True / False / Not Given & Summary Cloze)
                </h3>
                {submitted && (
                  <span className="font-mono-data text-xs px-3 py-1 rounded bg-[#FACC15] text-[#16181D] font-bold">
                    KẾT QUẢ: {scoreCount}/{QUESTIONS.length} CÂU ĐÚNG
                  </span>
                )}
              </div>

              <div className="divide-y divide-[#2E3340]">
                {QUESTIONS.map((q) => {
                  const chosen = answers[q.id];
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
                                setAnswers((prev) => ({ ...prev, [q.id]: opt }))
                              }
                              className={`px-3.5 py-1.5 rounded text-xs font-mono-data font-bold transition-colors border ${
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
                              Đáp án đúng: {q.answer} — Giải thích chi tiết:
                            </span>
                          </div>
                          <p className="text-[#B8B2A6]">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Palette Bar (1-40 Exam Navigation style) */}
            <div className="mt-6 pt-4 border-t border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {QUESTIONS.map((q) => {
                  const answered = !!answers[q.id];
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
                className="text-xs font-mono-data text-[#B8B2A6] hover:text-[#FACC15]"
              >
                Làm lại đề mẫu
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Generation Boarding Pass & Legal Footer */}
      <footer className="concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]">
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-[#2E3340]">
          <div className="lg:col-span-7 space-y-2">
            <h2 className="font-display text-2xl font-extrabold text-[#F4F1EA]">
              NHẬN LỘ TRÌNH ADAPTIVE CÁ NHÂN HÓA & BỘ EBOOK 7,298 TỪ VỰNG WORD-ATLAS
            </h2>
            <p className="text-sm text-[#B8B2A6] max-w-2xl">
              Hệ thống tự động thiết lập lịch ôn tập FSRS theo Band mục tiêu của bạn và gửi kèm kho PDF 538 từ khóa Reading + 179 nhóm Listening Paraphrase.
            </p>
          </div>

          <div className="lg:col-span-5">
            {leadSubmitted ? (
              <div className="p-4 rounded-xl bg-[#065F46]/30 border border-[#10B981] text-[#F4F1EA] text-sm">
                Đã ghi nhận thông tin của <strong>{leadName}</strong> ({leadTarget}). Lộ trình FSRS cá nhân hóa đã được kích hoạt trên trình duyệt của bạn!
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
                  placeholder="Họ và tên..."
                  className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#B8B2A6]/70"
                />
                <input
                  type="text"
                  required
                  value={leadContact}
                  onChange={(e) => setLeadContact(e.target.value)}
                  placeholder="Email hoặc SĐT Zalo..."
                  className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA] placeholder:text-[#B8B2A6]/70"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] font-display font-extrabold text-sm rounded-lg px-4 py-2.5 transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Nhận Lộ Trình</span>
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-[#111318] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#B8B2A6]">
          <div>
            <span>
              THE IELTS DICTIONARY × WORD ATLAS • Kiến trúc Bento Grid EdTech & FSRS Spaced Repetition.
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
