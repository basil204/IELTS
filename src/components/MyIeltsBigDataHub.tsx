'use client';

import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Headphones,
  Layers,
  PenTool,
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
  onSendWordToFsrs: (word: string) => void;
  lang?: 'vi' | 'en';
}

export default function MyIeltsBigDataHub({
  chapters,
  readingTiers,
  listening179,
  writing100,
  onSendWordToFsrs,
  lang = 'vi'
}: Props) {
  const [activeTab, setActiveTab] = useState<
    'chapters' | 'reading538' | 'listening179' | 'writing100'
  >('chapters');

  const [selectedChapterKey, setSelectedChapterKey] = useState<string>(
    chapters[0]?.key || '01'
  );
  const [chapterSearch, setChapterSearch] = useState<string>('');
  const [dictationMap, setDictationMap] = useState<Record<string, string>>({});
  const [revealMeanings, setRevealMeanings] = useState<boolean>(true);

  const [selectedTierIdx, setSelectedTierIdx] = useState<number>(0);
  const [readingQuery, setReadingQuery] = useState<string>('');
  const [listeningQuery, setListeningQuery] = useState<string>('');
  const [writingQuery, setWritingQuery] = useState<string>('');

  const activeChapter = useMemo(
    () => chapters.find((c) => c.key === selectedChapterKey) || chapters[0],
    [chapters, selectedChapterKey]
  );

  const filteredChapterWords = useMemo(() => {
    if (!activeChapter) return [];
    const q = chapterSearch.trim().toLowerCase();
    const list = activeChapter.words || [];
    if (!q) return list.slice(0, 32);
    return list
      .filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          (item.viMeaning && item.viMeaning.toLowerCase().includes(q)) ||
          item.enDefinition.toLowerCase().includes(q)
      )
      .slice(0, 32);
  }, [activeChapter, chapterSearch]);

  const activeReadingTier = readingTiers[selectedTierIdx] || readingTiers[0];

  const filteredReadingWords = useMemo(() => {
    if (!activeReadingTier) return [];
    const q = readingQuery.trim().toLowerCase();
    const list = activeReadingTier.words || [];
    if (!q) return list.slice(0, 24);
    return list
      .filter(
        (w) =>
          w.word.toLowerCase().includes(q) ||
          (w.viMeaning && w.viMeaning.toLowerCase().includes(q)) ||
          w.enDefinition.toLowerCase().includes(q) ||
          w.synonyms.some((s) => s.toLowerCase().includes(q))
      )
      .slice(0, 24);
  }, [activeReadingTier, readingQuery]);

  const filteredListening = useMemo(() => {
    const q = listeningQuery.trim().toLowerCase();
    if (!q) return listening179.slice(0, 24);
    return listening179
      .filter(
        (item) =>
          item.word.toLowerCase().includes(q) ||
          (item.viMeaning && item.viMeaning.toLowerCase().includes(q)) ||
          item.enDefinition.toLowerCase().includes(q) ||
          item.replace.some((eq) => eq.toLowerCase().includes(q))
      )
      .slice(0, 24);
  }, [listening179, listeningQuery]);

  const filteredWriting = useMemo(() => {
    const q = writingQuery.trim().toLowerCase();
    if (!q) return writing100.slice(0, 20);
    return writing100
      .filter(
        (item) =>
          item.category.toLowerCase().includes(q) ||
          item.standardBand65.toLowerCase().includes(q) ||
          item.advancedBand75.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [writing100, writingQuery]);

  return (
    <section
      id="my-ielts-hub"
      className="mt-8 bg-[#FFFFFF] rounded-2xl border border-[#DCEBFA] overflow-hidden shadow-sm"
    >
      {/* Top Studio Header Bar */}
      <div className="px-6 py-5 bg-[#F0F7FF] border-b border-[#DCEBFA] flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display text-lg sm:text-xl font-black text-[#0F172A]">
            {lang === 'vi'
              ? '05 / KHO DỮ LIỆU THỰC CHIẾN MY-IELTS 4.0 (22 CHUYÊN ĐỀ • 538 READING • 179 LISTENING • 100 WRITING)'
              : '05 / MY-IELTS 4.0 EXAM CORPUS (22 CHAPTERS • 538 READING • 179 LISTENING • 100 WRITING)'}
          </h2>
          <p className="text-xs text-[#334155]">
            {lang === 'vi'
              ? 'Toàn bộ dữ liệu song ngữ Anh–Việt chuẩn hóa: Luyện gõ chính tả Listening Dictation, ẩn/hiện nghĩa tự kiểm tra (REVEAL Mode) và đẩy từ vựng lên Trạm 02 FSRS.'
              : 'Complete bilingual English–Vietnamese exam database: Practice Listening Dictation, toggle REVEAL self-testing mode, and send any word to Station 02 FSRS.'}
          </p>
        </div>

        {/* 4 Dataset Switcher Tabs + REVEAL Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setRevealMeanings((r) => !r)}
            className={`px-3 py-2 rounded-lg font-mono-data text-xs font-bold inline-flex items-center gap-1.5 border transition-colors cursor-pointer ${
              revealMeanings
                ? 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
                : 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A]'
            }`}
            title="Chế độ ẩn/hiện nghĩa Tiếng Việt để tự kiểm tra trí nhớ"
          >
            {revealMeanings ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
            <span>{revealMeanings ? 'REVEAL: ON' : 'REVEAL: HIDDEN'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chapters')}
            className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'chapters'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA] hover:bg-[#E0F2FE]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>22 Chuyên Đề (3,674 Từ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reading538')}
            className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'reading538'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA] hover:bg-[#E0F2FE]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>538 Reading Keywords</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('listening179')}
            className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'listening179'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA] hover:bg-[#E0F2FE]'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>179 Listening Paraphrase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('writing100')}
            className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'writing100'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'bg-[#FFFFFF] text-[#334155] border border-[#DCEBFA] hover:bg-[#E0F2FE]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>100 Writing Band 7.5+</span>
          </button>
        </div>
      </div>

      {/* TAB 1: 22 THEMATIC CHAPTERS (3,674 WORDS) */}
      {activeTab === 'chapters' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#DCEBFA]">
          {/* Left Rail: 22 Chapters List */}
          <div className="lg:col-span-4 p-5 bg-[#F8FBFF] max-h-[620px] overflow-y-auto divide-y divide-[#DCEBFA]">
            {chapters.map((ch) => {
              const selected = ch.key === selectedChapterKey;
              return (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => setSelectedChapterKey(ch.key)}
                  className={`w-full text-left px-3.5 py-3 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    selected
                      ? 'bg-[#0284C7] text-[#FFFFFF] rounded-lg font-bold'
                      : 'text-[#0F172A] hover:bg-[#EBF5FF]'
                  }`}
                >
                  <div>
                    <div className="font-display text-sm font-extrabold">
                      {ch.code}. {lang === 'vi' ? ch.titleVi : ch.titleEn}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        selected ? 'text-[#E0F2FE]' : 'text-[#64748B]'
                      }`}
                    >
                      {ch.titleEn}
                    </div>
                  </div>
                  <span
                    className={`font-mono-data text-xs px-2 py-0.5 rounded font-bold ${
                      selected
                        ? 'bg-[#FFFFFF] text-[#0284C7]'
                        : 'bg-[#E0F2FE] text-[#0284C7]'
                    }`}
                  >
                    {ch.totalWordsInChapter} từ
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Pane: Chapter Words & Listening Dictation */}
          <div className="lg:col-span-8 p-6 bg-[#FFFFFF] flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                    {activeChapter?.code}.{' '}
                    {lang === 'vi' ? activeChapter?.titleVi : activeChapter?.titleEn}{' '}
                    ({activeChapter?.totalWordsInChapter} từ)
                  </h3>
                  <p className="text-xs text-[#334155]">
                    {lang === 'vi'
                      ? 'Nghe phát âm chuẩn và gõ lại từ vựng vào ô Dictation bên cạnh để luyện phản xạ IELTS Listening.'
                      : 'Listen to the pronunciation and type the word in the Dictation box to train IELTS Listening spelling.'}
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={chapterSearch}
                    onChange={(e) => setChapterSearch(e.target.value)}
                    placeholder={
                      lang === 'vi'
                        ? 'Tìm từ trong chuyên đề...'
                        : 'Search in chapter...'
                    }
                    className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A] placeholder:text-[#64748B]"
                  />
                </div>
              </div>

              <div className="mt-4 max-h-[500px] overflow-y-auto divide-y divide-[#DCEBFA] border border-[#DCEBFA] rounded-xl">
                {filteredChapterWords.map((item, idx) => {
                  const key = `${activeChapter?.key}-${item.word}-${idx}`;
                  const typed = dictationMap[key] || '';
                  const matched =
                    typed.trim().toLowerCase() === item.word.toLowerCase();

                  return (
                    <div
                      key={key}
                      className="p-3.5 bg-[#FFFFFF] hover:bg-[#F8FBFF] transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              playPronunciation(item.audioUrl || '', item.word, 'en-GB')
                            }
                            className="p-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] transition-colors cursor-pointer"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-display text-base font-extrabold text-[#0F172A]">
                            {item.word}
                          </span>
                          <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#EBF5FF] text-[#0284C7] font-bold">
                            {item.pos}
                          </span>
                        </div>

                        <div className="text-xs text-[#334155]">
                          {revealMeanings ? (
                            <span>{item.viMeaning || item.enDefinition}</span>
                          ) : (
                            <span className="font-mono-data text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded">
                              [Đã ẩn nghĩa — Bật REVEAL để đối chiếu]
                            </span>
                          )}
                          {item.variants && item.variants.length > 0 && (
                            <span className="ml-2 font-mono-data text-[#059669]">
                              • Variants: {item.variants.slice(0, 3).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={typed}
                          onChange={(e) =>
                            setDictationMap((prev) => ({
                              ...prev,
                              [key]: e.target.value
                            }))
                          }
                          placeholder="Gõ Dictation..."
                          aria-label={`Luyện gõ từ ${item.word}`}
                          className={`px-3 py-1.5 rounded-lg border font-mono-data text-xs w-36 focus:outline-none ${
                            matched
                              ? 'bg-[#ECFDF5] border-[#059669] text-[#059669] font-bold'
                              : 'bg-[#F8FBFF] border-[#DCEBFA] text-[#0F172A]'
                          }`}
                        />
                        {matched && (
                          <Check className="w-4 h-4 text-[#059669] shrink-0" />
                        )}
                        <button
                          type="button"
                          onClick={() => onSendWordToFsrs(item.word)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#E0F2FE] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] font-mono-data text-xs font-bold transition-colors cursor-pointer shrink-0"
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
        </div>
      )}

      {/* TAB 2: 538 IELTS READING EXAM-POINT KEYWORDS */}
      {activeTab === 'reading538' && (
        <div className="p-6 bg-[#FFFFFF] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
            <div className="flex flex-wrap items-center gap-2">
              {readingTiers.map((tier, idx) => (
                <button
                  key={tier.tier}
                  type="button"
                  onClick={() => setSelectedTierIdx(idx)}
                  className={`px-3.5 py-2 rounded-lg font-display text-xs font-extrabold transition-colors cursor-pointer ${
                    selectedTierIdx === idx
                      ? 'bg-[#0284C7] text-[#FFFFFF]'
                      : 'bg-[#F0F7FF] text-[#334155] border border-[#DCEBFA] hover:bg-[#E0F2FE]'
                  }`}
                >
                  {tier.titleVi} ({tier.probability})
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={readingQuery}
                onChange={(e) => setReadingQuery(e.target.value)}
                placeholder="Tìm trong 538 từ khóa Reading..."
                className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#DCEBFA] rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#DCEBFA]">
            {filteredReadingWords.map((item) => (
              <div
                key={item.no}
                className="p-4 bg-[#FFFFFF] hover:bg-[#F8FBFF] transition-colors flex flex-col justify-between gap-3 border-b border-[#DCEBFA]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                        #{item.no}
                      </span>
                      <span className="font-display text-base font-extrabold text-[#0F172A]">
                        {item.word}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSendWordToFsrs(item.word)}
                      className="px-2.5 py-1 rounded bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-mono-data text-xs font-bold cursor-pointer"
                    >
                      Học FSRS
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-[#334155]">
                    {revealMeanings
                      ? item.viMeaning || item.enDefinition
                      : '[Đã ẩn nghĩa — Bật REVEAL]'}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#EBF5FF] flex flex-wrap items-center gap-1.5">
                  <span className="font-mono-data text-xs text-[#059669] font-bold">
                    Synonyms:
                  </span>
                  {item.synonyms.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#F0F7FF] text-[#0F172A] border border-[#DCEBFA] font-mono-data text-xs"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: 179 LISTENING PARAPHRASE GROUPS */}
      {activeTab === 'listening179' && (
        <div className="p-6 bg-[#FFFFFF] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
            <div>
              <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                179 Nhóm Đồng Nghĩa & Paraphrase IELTS Listening Cốt Lõi
              </h3>
              <p className="text-xs text-[#334155]">
                Đối chiếu từ khóa xuất hiện trên đề thi và cách người bản xứ biến đổi tương đương trong băng nghe.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={listeningQuery}
                onChange={(e) => setListeningQuery(e.target.value)}
                placeholder="Tìm cặp Paraphrase Listening..."
                className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-[#DCEBFA] rounded-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-[#DCEBFA]">
            {filteredListening.map((item) => (
              <div
                key={item.index}
                className="p-4 bg-[#FFFFFF] hover:bg-[#F8FBFF] transition-colors space-y-2 border-b border-[#DCEBFA]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                      #{item.index}
                    </span>
                    <span className="font-display text-base font-extrabold text-[#0F172A]">
                      {item.word}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => playPronunciation('', item.word, 'en-GB')}
                    className="p-1.5 rounded bg-[#F0F7FF] text-[#0284C7] hover:bg-[#0284C7] hover:text-[#FFFFFF] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-xs text-[#334155]">
                  {revealMeanings
                    ? item.viMeaning || item.enDefinition
                    : '[Đã ẩn nghĩa]'}
                </p>

                <div className="pt-2 border-t border-[#EBF5FF] flex flex-wrap gap-1.5">
                  {item.replace.map((eq, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] font-mono-data text-xs font-bold"
                    >
                      ≈ {eq}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: 100 WRITING TASK 2 SENTENCE UPGRADES */}
      {activeTab === 'writing100' && (
        <div className="p-6 bg-[#FFFFFF] space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[#DCEBFA]">
            <div>
              <h3 className="font-display text-lg font-extrabold text-[#0F172A]">
                100 Cấu Trúc Nâng Cấp Câu IELTS Writing Task 2 (Band 6.5 → Band 7.5+)
              </h3>
              <p className="text-xs text-[#334155]">
                So sánh trực diện cách diễn đạt thông thường và cấu trúc học thuật ăn điểm Lexical Resource & Grammatical Range.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={writingQuery}
                onChange={(e) => setWritingQuery(e.target.value)}
                placeholder="Tìm theo chủ điểm ngữ pháp..."
                className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-lg pl-9 pr-3 py-2 text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <div className="divide-y divide-[#DCEBFA] border border-[#DCEBFA] rounded-xl overflow-hidden">
            {filteredWriting.map((item) => (
              <div
                key={item.no}
                className="p-4 bg-[#FFFFFF] hover:bg-[#F8FBFF] transition-colors space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono-data text-xs px-2.5 py-1 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                    #{item.no} • {item.category}
                  </span>
                  <span className="font-mono-data text-xs text-[#059669] font-bold inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>BAND 7.5+ ACADEMIC UPGRADE</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
                  <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs space-y-1">
                    <div className="font-mono-data font-bold text-[#D97706]">
                      BAND 6.0–6.5 STANDARD:
                    </div>
                    <p className="text-[#0F172A]">{item.standardBand65}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs space-y-1">
                    <div className="font-mono-data font-bold text-[#059669]">
                      BAND 7.5–8.0+ UPGRADED:
                    </div>
                    <p className="text-[#0F172A] font-medium">{item.advancedBand75}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
