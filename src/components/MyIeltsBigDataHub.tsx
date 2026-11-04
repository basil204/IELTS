'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Headphones,
  Layers,
  PenTool,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Volume2
} from 'lucide-react';
import type {
  Listening179Item,
  MyIeltsChapter,
  Reading538Tier,
  Writing100Item
} from '@/types/atlas';
import { playPronunciation } from '@/lib/fsrs-engine';

interface Props {
  chapters: MyIeltsChapter[];
  readingTiers: Reading538Tier[];
  listening179: Listening179Item[];
  writing100: Writing100Item[];
  onSendWordToFsrs: (wordText: string) => void;
}

type HubTab = 'chapters22' | 'reading538' | 'listening179' | 'writing100';

export default function MyIeltsBigDataHub({
  chapters,
  readingTiers,
  listening179,
  writing100,
  onSendWordToFsrs
}: Props) {
  const [activeTab, setActiveTab] = useState<HubTab>('chapters22');
  const [selectedChapterKey, setSelectedChapterKey] = useState<string>(
    chapters[0]?.key || 'CH-01'
  );
  const [dictationInputs, setDictationInputs] = useState<Record<number, string>>({});
  const [selectedReadingTier, setSelectedReadingTier] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedWritingCategory, setSelectedWritingCategory] = useState<string>('ALL');
  const [revealedWritingIds, setRevealedWritingIds] = useState<Record<number, boolean>>({});

  const currentChapter = useMemo(
    () => chapters.find((c) => c.key === selectedChapterKey) || chapters[0],
    [chapters, selectedChapterKey]
  );

  const filteredChapterWords = useMemo(() => {
    if (!currentChapter) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return currentChapter.words.slice(0, 18);
    return currentChapter.words.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.enDefinition.toLowerCase().includes(q) ||
        (w.viMeaning && w.viMeaning.toLowerCase().includes(q)) ||
        w.example.toLowerCase().includes(q)
    );
  }, [currentChapter, searchQuery]);

  const currentReadingTier = useMemo(
    () => readingTiers.find((t) => t.tier === selectedReadingTier) || readingTiers[0],
    [readingTiers, selectedReadingTier]
  );

  const filteredReadingWords = useMemo(() => {
    if (!currentReadingTier) return [];
    const q = searchQuery.trim().toLowerCase();
    const list = currentReadingTier.words;
    if (!q) return list.slice(0, 24);
    return list.filter(
      (w) =>
        w.word.toLowerCase().includes(q) ||
        w.synonyms.some((s) => s.toLowerCase().includes(q)) ||
        (w.viMeaning && w.viMeaning.toLowerCase().includes(q))
    );
  }, [currentReadingTier, searchQuery]);

  const filteredListening179 = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return listening179.slice(0, 30);
    return listening179.filter(
      (item) =>
        item.word.toLowerCase().includes(q) ||
        item.replace.some((r) => r.toLowerCase().includes(q)) ||
        (item.viMeaning && item.viMeaning.toLowerCase().includes(q))
    );
  }, [listening179, searchQuery]);

  const writingCategories = useMemo(() => {
    const set = new Set(writing100.map((w) => w.category));
    return ['ALL', ...Array.from(set)];
  }, [writing100]);

  const filteredWriting100 = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return writing100
      .filter((item) => {
        if (selectedWritingCategory !== 'ALL' && item.category !== selectedWritingCategory) {
          return false;
        }
        if (q) {
          return (
            item.standardBand65.toLowerCase().includes(q) ||
            item.advancedBand75.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .slice(0, 20);
  }, [writing100, selectedWritingCategory, searchQuery]);

  return (
    <section
      id="my-ielts-hub"
      className="mt-14 concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]"
    >
      {/* Top Concourse Bar */}
      <div className="px-6 py-5 border-b border-[#2E3340] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl md:text-2xl font-extrabold tracking-tight text-[#F4F1EA]">
            05 / KHO HỌC LIỆU THỰC CHIẾN MY-IELTS (3,574 TỪ CHÂN KINH • 538 READING • 179 LISTENING • 100 WRITING)
          </h2>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-[#B8B2A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tra từ khóa, đồng nghĩa, cấu trúc câu..."
            className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg pl-10 pr-3.5 py-2 text-sm text-[#F4F1EA] placeholder:text-[#B8B2A6]/70 focus:border-[#FACC15]"
          />
        </div>
      </div>

      {/* 4 Dataset Switcher Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-[#2E3340] divide-y sm:divide-y-0 sm:divide-x divide-[#2E3340] bg-[#1A1D24]">
        <button
          type="button"
          onClick={() => setActiveTab('chapters22')}
          className={`px-5 py-4 text-left transition-colors flex items-center justify-between ${
            activeTab === 'chapters22'
              ? 'bg-[#FACC15] text-[#16181D] font-bold'
              : 'text-[#F4F1EA] hover:bg-[#232730]'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm">
            <Headphones className="w-4 h-4 shrink-0" />
            <span>22 Chuyên Đề Nghe Chép Từ Vựng</span>
          </span>
          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-black/15">
            3,574 từ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reading538')}
          className={`px-5 py-4 text-left transition-colors flex items-center justify-between ${
            activeTab === 'reading538'
              ? 'bg-[#FACC15] text-[#16181D] font-bold'
              : 'text-[#F4F1EA] hover:bg-[#232730]'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm">
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>538 Từ Khóa Trọng Tâm Reading</span>
          </span>
          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-black/15">
            3 Cấp độ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('listening179')}
          className={`px-5 py-4 text-left transition-colors flex items-center justify-between ${
            activeTab === 'listening179'
              ? 'bg-[#FACC15] text-[#16181D] font-bold'
              : 'text-[#F4F1EA] hover:bg-[#232730]'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm">
            <Layers className="w-4 h-4 shrink-0" />
            <span>179 Nhóm Paraphrase Listening</span>
          </span>
          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-black/15">
            179 nhóm
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('writing100')}
          className={`px-5 py-4 text-left transition-colors flex items-center justify-between ${
            activeTab === 'writing100'
              ? 'bg-[#FACC15] text-[#16181D] font-bold'
              : 'text-[#F4F1EA] hover:bg-[#232730]'
          }`}
        >
          <span className="flex items-center gap-2.5 text-sm">
            <PenTool className="w-4 h-4 shrink-0" />
            <span>100 Câu Mẫu Writing Task 2</span>
          </span>
          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-black/15">
            Band 7.5+
          </span>
        </button>
      </div>

      {/* Tab 1: 22 Thematic Chapters */}
      {activeTab === 'chapters22' && currentChapter && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#2E3340]">
          {/* Left Chapter Rail */}
          <div className="lg:col-span-4 max-h-[580px] overflow-y-auto divide-y divide-[#252934]">
            {chapters.map((ch) => {
              const isSelected = ch.key === selectedChapterKey;
              return (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setSelectedChapterKey(ch.key)}
                  className={`w-full px-5 py-3.5 text-left transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#252934] text-[#FACC15]'
                      : 'text-[#F4F1EA] hover:bg-[#1E212B]'
                  }`}
                >
                  <div>
                    <span className="font-mono-data text-xs text-[#B8B2A6] mr-2">
                      {ch.code}
                    </span>
                    <span className="text-sm font-semibold">{ch.titleVi}</span>
                  </div>
                  <span className="font-mono-data text-xs text-[#B8B2A6]">
                    {ch.wordCount} từ
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Chapter Dictation & Word Table */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="px-6 py-4 bg-[#1C1F27] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold text-[#F4F1EA]">
                  {currentChapter.code} — {currentChapter.titleVi} ({currentChapter.titleEn})
                </h3>
                <p className="text-xs text-[#B8B2A6] mt-0.5">
                  Nghe file âm thanh gốc và gõ lại chính tả từ vựng hoặc đẩy thẳng vào hàng đợi ôn tập FSRS.
                </p>
              </div>
              <div className="flex items-center gap-3 font-mono-data text-xs">
                <span className="px-2.5 py-1 rounded bg-[#272B35] text-[#FACC15]">
                  {currentChapter.wordCount} TỪ VỰNG
                </span>
                <span className="px-2.5 py-1 rounded bg-[#272B35] text-[#10B981]">
                  {currentChapter.groupCount} NHÓM NGỮ NGHĨA
                </span>
              </div>
            </div>

            <div className="divide-y divide-[#282C37] max-h-[500px] overflow-y-auto">
              {filteredChapterWords.map((w) => {
                const typed = dictationInputs[w.id] ?? '';
                const isExact =
                  typed.trim().toLowerCase() === w.word.toLowerCase();
                return (
                  <div
                    key={w.id}
                    className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1C1F27]/70 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            playPronunciation(w.audioUrl, w.word, 'en-GB')
                          }
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#272B35] hover:bg-[#FACC15] hover:text-[#16181D] text-[#FACC15] text-xs font-mono-data transition-colors"
                          title="Nghe phát âm chuẩn"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>#{w.id}</span>
                        </button>
                        <span className="font-display text-base font-bold text-[#F4F1EA]">
                          {w.word}
                        </span>
                        <span className="font-mono-data text-xs text-[#EA580C]">
                          {w.pos}
                        </span>
                        {w.viMeaning && (
                          <span className="text-sm font-medium text-[#10B981]">
                            • {w.viMeaning}
                          </span>
                        )}
                      </div>
                      {w.enDefinition && (
                        <p className="text-xs text-[#B8B2A6]">{w.enDefinition}</p>
                      )}
                      {w.example && (
                        <p className="text-xs text-[#F4F1EA]/85 italic">
                          “{w.example}”
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative">
                        <input
                          type="text"
                          value={typed}
                          onChange={(e) =>
                            setDictationInputs((prev) => ({
                              ...prev,
                              [w.id]: e.target.value
                            }))
                          }
                          placeholder="Gõ lại từ..."
                          aria-label={`Gõ chính tả từ ${w.word}`}
                          className={`w-36 bg-[#16181D] border rounded px-2.5 py-1.5 text-xs font-mono-data text-[#F4F1EA] ${
                            isExact
                              ? 'border-[#10B981] text-[#10B981]'
                              : 'border-[#363B47]'
                          }`}
                        />
                        {isExact && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] absolute right-2 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => onSendWordToFsrs(w.word)}
                        className="px-2.5 py-1.5 rounded bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] text-xs font-semibold transition-colors"
                      >
                        + FSRS
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Reading 538 Exam Keywords */}
      {activeTab === 'reading538' && currentReadingTier && (
        <div>
          <div className="px-6 py-4 bg-[#1C1F27] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {readingTiers.map((t) => (
                <button
                  key={t.tier}
                  type="button"
                  onClick={() => setSelectedReadingTier(t.tier)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-mono-data font-bold transition-colors ${
                    selectedReadingTier === t.tier
                      ? 'bg-[#EA580C] text-[#F4F1EA]'
                      : 'bg-[#262A34] text-[#B8B2A6] hover:text-[#F4F1EA]'
                  }`}
                >
                  {t.badge} • {t.count} TỪ
                </button>
              ))}
            </div>
            <span className="text-xs text-[#B8B2A6]">
              {currentReadingTier.titleVi} — Nắm chắc cụm đồng nghĩa (Paraphrase) để giải quyết True/False/Not Given & Matching Headings.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2E3340]">
            {filteredReadingWords.map((item) => (
              <div
                key={item.no}
                className="p-5 border-b border-[#2E3340] flex flex-col justify-between gap-3 hover:bg-[#1C1F27] transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-xs text-[#FACC15]">
                        #{item.no}
                      </span>
                      <span className="font-display text-lg font-extrabold text-[#F4F1EA]">
                        {item.word}
                      </span>
                      <span className="font-mono-data text-xs text-[#EA580C]">
                        {item.pos}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playPronunciation('', item.word, 'en-GB');
                        onSendWordToFsrs(item.word);
                      }}
                      className="text-xs font-mono-data text-[#10B981] hover:underline"
                    >
                      Đưa vào FSRS
                    </button>
                  </div>
                  <p className="text-xs text-[#B8B2A6] mt-1">
                    {item.viMeaning || item.enDefinition}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#282C37]">
                  <span className="block font-mono-data text-xs text-[#B8B2A6] mb-1.5">
                    ĐỒNG NGHĨA RA THI READING:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {item.synonyms.length > 0 ? (
                      item.synonyms.map((syn, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#252934] text-[#F4F1EA] font-mono-data text-xs"
                        >
                          {syn}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-[#B8B2A6]">
                        Từ khóa học thuật cốt lõi
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Listening 179 Synonym Replacements */}
      {activeTab === 'listening179' && (
        <div>
          <div className="px-6 py-4 bg-[#1C1F27] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-base font-bold text-[#F4F1EA]">
              179 Cặp Thay Thế Đồng Nghĩa (Paraphrase) Xuất Hiện Nhiều Nhất Trong IELTS Listening
            </h3>
            <span className="text-xs font-mono-data text-[#FACC15]">
              BẤM VÀO TỪ ĐỂ NGHE PHÁT ÂM UK/US
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#2E3340] max-h-[520px] overflow-y-auto">
            {filteredListening179.map((item) => (
              <div
                key={item.index}
                className="p-4 border-b border-[#2E3340] flex flex-col justify-between gap-2.5 hover:bg-[#1C1F27]"
              >
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => playPronunciation('', item.word, 'en-GB')}
                    className="flex items-center gap-2 text-left group"
                  >
                    <span className="font-mono-data text-xs text-[#B8B2A6]">
                      #{item.index}
                    </span>
                    <span className="font-display text-base font-bold text-[#FACC15] group-hover:underline">
                      {item.word}
                    </span>
                    <span className="font-mono-data text-xs text-[#EA580C]">
                      {item.type}
                    </span>
                    <Volume2 className="w-3.5 h-3.5 text-[#B8B2A6] group-hover:text-[#FACC15]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendWordToFsrs(item.word)}
                    className="text-xs font-mono-data text-[#10B981] hover:underline"
                  >
                    + FSRS
                  </button>
                </div>

                {item.viMeaning && (
                  <p className="text-xs text-[#B8B2A6]">{item.viMeaning}</p>
                )}

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-mono-data text-[#B8B2A6]">
                    Băng đọc thay bằng:
                  </span>
                  {item.replace.map((rep, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#065F46]/40 border border-[#10B981]/30 text-[#F4F1EA] font-mono-data text-xs"
                    >
                      {rep}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Writing 100 Essential Sentences */}
      {activeTab === 'writing100' && (
        <div>
          <div className="px-6 py-4 bg-[#1C1F27] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {writingCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedWritingCategory(cat)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                    selectedWritingCategory === cat
                      ? 'bg-[#FACC15] text-[#16181D]'
                      : 'bg-[#252934] text-[#B8B2A6] hover:text-[#F4F1EA]'
                  }`}
                >
                  {cat === 'ALL' ? 'Tất cả 7 chuyên đề ngữ pháp (100 câu)' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#2E3340] max-h-[520px] overflow-y-auto">
            {filteredWriting100.map((item) => {
              const showUpgrade = revealedWritingIds[item.no] ?? true;
              return (
                <div
                  key={item.no}
                  className="px-6 py-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center hover:bg-[#1C1F27]"
                >
                  <div className="lg:col-span-3">
                    <span className="font-mono-data text-xs text-[#FACC15]">
                      CÂU #{item.no}
                    </span>
                    <p className="text-xs text-[#B8B2A6] mt-0.5">
                      {item.category}
                    </p>
                  </div>

                  <div className="lg:col-span-4">
                    <span className="block font-mono-data text-xs text-[#B8B2A6]">
                      CẤU TRÚC TIÊU CHUẨN (BAND 6.5):
                    </span>
                    <p className="text-sm text-[#F4F1EA] mt-1">
                      {item.standardBand65}
                    </p>
                  </div>

                  <div className="lg:col-span-5 flex items-start justify-between gap-3">
                    <div>
                      <span className="block font-mono-data text-xs text-[#10B981]">
                        NÂNG CẤP HỌC THUẬT (BAND 7.5+):
                      </span>
                      {showUpgrade ? (
                        <p className="text-sm font-medium text-[#FACC15] mt-1">
                          {item.advancedBand75}
                        </p>
                      ) : (
                        <p className="text-xs text-[#B8B2A6] italic mt-1">
                          Đã ẩn để bạn tự viết thử...
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRevealedWritingIds((prev) => ({
                          ...prev,
                          [item.no]: !showUpgrade
                        }))
                      }
                      className="px-2.5 py-1 rounded bg-[#262A34] text-xs font-mono-data text-[#F4F1EA] hover:bg-[#FACC15] hover:text-[#16181D] shrink-0"
                    >
                      {showUpgrade ? 'Ẩn câu mẫu' : 'Hiện Band 7.5+'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
