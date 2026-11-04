'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Crown,
  Globe
} from 'lucide-react';
import type { RoadmapStage } from '@/lib/db';

const PLACEMENT_QUESTIONS = [
  {
    id: 1,
    qVi: '1. Chọn từ học thuật C1 điền vào câu: "Strict municipal regulations were introduced to ________ the environmental impact of rapid urbanization."',
    qEn: '1. Choose the C1 academic verb: "Strict municipal regulations were introduced to ________ the environmental impact of rapid urbanization."',
    options: ['mitigate', 'exaggerate', 'proliferate', 'fluctuate'],
    answer: 'mitigate'
  },
  {
    id: 2,
    qVi: '2. Trong IELTS Listening, cụm "funded by a generous philanthropic donation" đồng nghĩa gần nhất với cụm nào?',
    qEn: '2. In IELTS Listening, "funded by a generous philanthropic donation" paraphrases which phrase?',
    options: [
      'money from a wealthy benefactor',
      'mandatory municipal taxation',
      'commercial bank loan',
      'annual tuition revenue'
    ],
    answer: 'money from a wealthy benefactor'
  },
  {
    id: 3,
    qVi: '3. Từ nào mang sắc thái C2 chỉ "sự hiện diện khắp mọi nơi của công nghệ số"?',
    qEn: '3. Which C2 noun denotes "the state of appearing everywhere in modern digital life"?',
    options: ['ubiquity', 'scarcity', 'ambiguity', 'disparity'],
    answer: 'ubiquity'
  }
];

export default function RoadmapPage() {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [stages, setStages] = useState<RoadmapStage[]>([]);
  const [completedModules, setCompletedModules] = useState<string[]>([
    'mod-101',
    'mod-102'
  ]);
  const [activeUser, setActiveUser] = useState<{
    id: string;
    name: string;
    plan: string;
    targetBand: string;
  } | null>(null);

  const [placementAnswers, setPlacementAnswers] = useState<
    Record<number, string>
  >({});
  const [placementSubmitted, setPlacementSubmitted] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('tid_active_user_v1');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setActiveUser(parsed);
        if (Array.isArray(parsed.completedModules)) {
          setCompletedModules(parsed.completedModules);
        }
      }
      const savedMods = localStorage.getItem('tid_roadmap_modules_v1');
      if (savedMods) {
        setCompletedModules(JSON.parse(savedMods));
      }
    } catch {
      // ignore
    }

    fetch('/api/admin')
      .then((r) => r.json())
      .then((d) => {
        if (d.roadmaps) setStages(d.roadmaps);
      })
      .catch(() => {});
  }, []);

  const toggleModuleCompletion = async (moduleId: string) => {
    const next = completedModules.includes(moduleId)
      ? completedModules.filter((m) => m !== moduleId)
      : [...completedModules, moduleId];

    setCompletedModules(next);
    localStorage.setItem('tid_roadmap_modules_v1', JSON.stringify(next));

    if (activeUser) {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleModule',
          userId: activeUser.id,
          moduleId
        })
      }).catch(() => {});
    }
  };

  const placementScore = PLACEMENT_QUESTIONS.reduce(
    (acc, q) => acc + (placementAnswers[q.id] === q.answer ? 1 : 0),
    0
  );

  const recommendedBand =
    placementScore === 3
      ? 'Band 6.5 → 8.0+ (Chặng 3 & 4)'
      : placementScore === 2
        ? 'Band 5.5 → 6.5 (Chặng 2)'
        : 'Band 4.0 → 5.5 (Chặng 1 Foundation)';

  const totalModulesCount = stages.reduce(
    (acc, s) => acc + s.modules.length,
    0
  );

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1440px] mx-auto space-y-8">
        {/* Top Bar */}
        <header className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F0F7FF] text-[#0284C7] border border-[#BAE6FD] font-display text-xs font-bold hover:bg-[#0284C7] hover:text-[#FFFFFF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Về Trang Chủ 4.0' : 'Back to Home'}</span>
            </Link>
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
              {lang === 'vi'
                ? 'LỘ TRÌNH LOGICAL FRAMEWORK 12 TUẦN (BAND 4.0 → 8.0+)'
                : '12-WEEK LOGICAL FRAMEWORK ROADMAP (BAND 4.0 → 8.0+)'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] font-mono-data text-xs font-bold cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'VI / EN' : 'EN / VI'}</span>
            </button>

            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold"
            >
              <Crown className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Nâng Cấp Tài Khoản PRO' : 'Upgrade to PRO'}</span>
            </Link>
          </div>
        </header>

        {/* Placement Diagnostic Section */}
        <section className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DCEBFA]">
            <div className="space-y-1">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#0F172A]">
                {lang === 'vi'
                  ? '01 / KIỂM TRA TRÌNH ĐỘ ĐẦU VÀO NHANH (QUICK PLACEMENT TEST)'
                  : '01 / QUICK ADAPTIVE PLACEMENT DIAGNOSTIC'}
              </h2>
              <p className="text-xs text-[#334155]">
                {lang === 'vi'
                  ? 'Hoàn thành 3 câu chẩn đoán nhanh để hệ thống xếp bạn vào đúng chặng từ vựng CEFR & My-IELTS phù hợp.'
                  : 'Answer 3 quick diagnostic questions to calibrate your starting stage.'}
              </p>
            </div>

            {placementSubmitted && (
              <div className="px-4 py-2 rounded-xl bg-[#E0F2FE] border border-[#0284C7] text-[#0284C7] font-mono-data text-xs font-extrabold">
                {lang === 'vi'
                  ? `KẾT QUẢ: ${placementScore}/3 • ĐỀ XUẤT: ${recommendedBand}`
                  : `SCORE: ${placementScore}/3 • RECOMMENDED: ${recommendedBand}`}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
            {PLACEMENT_QUESTIONS.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl bg-[#F8FBFF] border border-[#DCEBFA] flex flex-col justify-between space-y-3"
              >
                <p className="text-xs sm:text-sm font-semibold text-[#0F172A]">
                  {lang === 'vi' ? q.qVi : q.qEn}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const chosen = placementAnswers[q.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          setPlacementAnswers((prev) => ({
                            ...prev,
                            [q.id]: opt
                          }))
                        }
                        className={`px-2.5 py-2 rounded-lg text-xs font-mono-data font-bold transition-colors border cursor-pointer ${
                          chosen
                            ? 'bg-[#0284C7] text-[#FFFFFF] border-[#0284C7]'
                            : 'bg-[#FFFFFF] text-[#334155] border-[#DCEBFA] hover:bg-[#E0F2FE]'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="font-mono-data text-xs text-[#64748B]">
              {lang === 'vi'
                ? `Tiến độ học phần đã hoàn thành: ${completedModules.length}/${
                    totalModulesCount || 12
                  } modules`
                : `Completed Roadmap Progress: ${completedModules.length}/${
                    totalModulesCount || 12
                  } modules`}
            </span>

            <button
              type="button"
              onClick={() => setPlacementSubmitted(true)}
              className="px-5 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-extrabold text-xs cursor-pointer"
            >
              {lang === 'vi'
                ? 'Chấm Điểm & Gợi Ý Lộ Trình'
                : 'Evaluate & Recommend Stage'}
            </button>
          </div>
        </section>

        {/* 4 Stages / 12 Weeks Full Curriculum */}
        <section className="space-y-6">
          {stages.map((stage) => {
            const stageTotalWords = stage.modules.reduce(
              (acc, m) => acc + (m.targetWords || 0),
              0
            );
            return (
              <div
                key={stage.id}
                className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-5 border-b border-[#DCEBFA]">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-extrabold">
                        {stage.code} • {stage.bandRange}
                      </span>
                      <span className="font-mono-data text-xs text-[#059669] font-bold">
                        {stage.durationWeeks} Weeks • Target{' '}
                        {stageTotalWords.toLocaleString()} Words • {stage.access}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-extrabold text-[#0F172A] mt-2">
                      {lang === 'vi' ? stage.titleVi : stage.titleEn}
                    </h3>
                  </div>

                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F7FF] hover:bg-[#0284C7] text-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] font-display text-xs font-bold transition-colors self-start md:self-center"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {lang === 'vi'
                        ? 'Vào Học Từ Vựng Chặng Này'
                        : 'Practice Stage Vocabulary'}
                    </span>
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {stage.modules.map((mod) => {
                    const done = completedModules.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        className={`p-4 rounded-xl border flex flex-col justify-between gap-4 transition-colors ${
                          done
                            ? 'bg-[#ECFDF5] border-[#059669]'
                            : 'bg-[#F8FBFF] border-[#DCEBFA]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono-data text-xs font-bold text-[#0284C7]">
                              {mod.day} • {mod.skill}
                            </span>
                            <span className="font-mono-data text-xs px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-bold">
                              {mod.targetWords} words
                            </span>
                          </div>

                          <h4 className="font-display text-sm font-bold text-[#0F172A] mt-2">
                            {lang === 'vi' ? mod.titleVi : mod.titleEn}
                          </h4>

                          <div className="mt-2 text-xs font-mono-data text-[#64748B]">
                            Duration: {mod.durationMins} mins/session
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleModuleCompletion(mod.id)}
                          className={`w-full py-2 px-3 rounded-lg font-mono-data text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            done
                              ? 'bg-[#059669] text-[#FFFFFF]'
                              : 'bg-[#0284C7] text-[#FFFFFF] hover:bg-[#0369A1]'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {done
                              ? lang === 'vi'
                                ? 'Đã Hoàn Thành Module'
                                : 'Completed Module'
                              : lang === 'vi'
                                ? 'Đánh Dấu Hoàn Thành'
                                : 'Mark Module Complete'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
