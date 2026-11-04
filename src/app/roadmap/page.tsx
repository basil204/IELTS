'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Crown,
  Globe,
  Lock,
  Play,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { PlatformUser, RoadmapStage } from '@/lib/db';

const STORAGE_USER_KEY = 'tid_active_user_v1';

const PLACEMENT_QUESTIONS = [
  {
    id: 1,
    qVi: '1. Chọn từ học thuật C1 đồng nghĩa với "reduce the severity of climate impacts":',
    qEn: '1. Choose the C1 academic verb meaning "reduce the severity of climate impacts":',
    options: ['mitigate', 'proliferate', 'scrutinize', 'fluctuate'],
    answer: 'mitigate'
  },
  {
    id: 2,
    qVi: '2. Trong IELTS Reading, cụm từ "be similar to / look like" thường paraphrase cho động từ nào?',
    qEn: '2. In IELTS Reading, "be similar to / look like" typically paraphrases which verb?',
    options: ['resemble', 'exceed', 'inhibit', 'allocate'],
    answer: 'resemble'
  },
  {
    id: 3,
    qVi: '3. Chọn từ cấp độ C2 mang nghĩa "chỉ tồn tại trong thời gian rất ngắn, chóng tàn":',
    qEn: '3. Choose the C2 adjective meaning "lasting for a very short time":',
    options: ['ephemeral', 'ubiquitous', 'resilient', 'viable'],
    answer: 'ephemeral'
  }
];

export default function RoadmapPage() {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [user, setUser] = useState<Omit<PlatformUser, 'passwordHash'> | null>(null);
  const [roadmaps, setRoadmaps] = useState<RoadmapStage[]>([]);
  const [showPlacement, setShowPlacement] = useState(false);
  const [placementAnswers, setPlacementAnswers] = useState<Record<number, string>>({});
  const [placementDone, setPlacementDone] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      if (saved) setUser(JSON.parse(saved));
    } catch {
      // ignore
    }
    fetch('/api/admin')
      .then((r) => r.json())
      .then((data) => {
        if (data.roadmaps) setRoadmaps(data.roadmaps);
      })
      .catch(() => {});
  }, []);

  const handleToggleModule = async (moduleId: string) => {
    if (!user) return;
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'progress',
        userId: user.id,
        moduleId
      })
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    }
  };

  const handleFinishPlacement = async () => {
    const score = PLACEMENT_QUESTIONS.reduce(
      (acc, q) => acc + (placementAnswers[q.id] === q.answer ? 1 : 0),
      0
    );
    const assessedBand = score === 3 ? '6.5' : score === 2 ? '5.5' : '4.5';
    const recommendedTarget = score >= 2 ? '7.5' : '6.5';
    setPlacementDone(true);

    if (user) {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'progress',
          userId: user.id,
          currentBand: assessedBand,
          targetBand: recommendedTarget,
          xpDelta: 100
        })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      }
    }
  };

  const totalModules = roadmaps.reduce((a, s) => a + s.modules.length, 0);
  const completedCount = user?.completedModules?.length || 0;
  const progressPercent =
    totalModules > 0 ? Math.min(100, Math.round((completedCount / totalModules) * 100)) : 25;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Concourse Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#16181D]/15">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#16181D] text-[#F4F1EA] font-display text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4 text-[#FACC15]" />
            <span>{lang === 'vi' ? 'Trang Chủ Bento' : 'Bento Home'}</span>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#16181D]">
            {lang === 'vi'
              ? '01 / LỘ TRÌNH HỌC IELTS ADAPTIVE 12 TUẦN (BAND 4.0 → 8.0+)'
              : '01 / 12-WEEK ADAPTIVE IELTS ROADMAP (BAND 4.0 → 8.0+)'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#16181D] text-[#FACC15] font-mono-data text-xs font-bold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'VI / EN' : 'EN / VI'}</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 rounded-lg bg-[#16181D] text-[#F4F1EA] font-mono-data text-xs">
                {user.name} • <strong className="text-[#FACC15]">{user.plan}</strong> •{' '}
                {user.xp} XP
              </span>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="px-3 py-2 rounded-lg bg-[#EA580C] text-[#F4F1EA] font-display text-xs font-bold"
                >
                  Admin CMS
                </Link>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-[#065F46] text-[#F4F1EA] font-display text-xs font-bold"
            >
              {lang === 'vi' ? 'Đăng Nhập Đồng Bộ' : 'Sign In to Sync'}
            </Link>
          )}

          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#FACC15] text-[#16181D] font-display text-xs font-extrabold"
          >
            <Crown className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Nâng Cấp VIP' : 'Upgrade VIP'}</span>
          </Link>
        </div>
      </header>

      {/* Diagnostic Placement Banner & Overall Telemetry */}
      <section className="mt-6 concourse-panel rounded-2xl p-6 border border-[#2E3340] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-8 space-y-2">
          <h2 className="font-display text-xl font-extrabold text-[#F4F1EA]">
            {lang === 'vi'
              ? `HỒ SƠ LỘ TRÌNH: BAND HIỆN TẠI ${user?.currentBand || '5.0'} → MỤC TIÊU BAND ${user?.targetBand || '7.5'}`
              : `YOUR ADAPTIVE ROUTE: CURRENT BAND ${user?.currentBand || '5.0'} → TARGET BAND ${user?.targetBand || '7.5'}`}
          </h2>
          <p className="text-sm text-[#B8B2A6]">
            {lang === 'vi'
              ? 'Mỗi chặng kết hợp đồng bộ giữa từ vựng FSRS (Word-Atlas 7,298 từ), nghe chép chính tả 22 chuyên đề, 538 từ khóa Reading và 100 cấu trúc câu Writing.'
              : 'Each gate synchronizes FSRS vocabulary (7,298 Word-Atlas words), 22 thematic dictation chapters, 538 Reading keywords, and 100 Writing sentence patterns.'}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <div className="w-full sm:w-72 h-3.5 rounded-full bg-[#272B35] overflow-hidden">
              <div
                className="h-full bg-[#FACC15] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-mono-data text-xs text-[#FACC15] font-bold">
              {completedCount}/{totalModules} MODULES ({progressPercent}%)
            </span>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setShowPlacement((v) => !v)}
            className="w-full py-3 px-4 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] font-display text-xs sm:text-sm font-extrabold transition-colors cursor-pointer"
          >
            {lang === 'vi'
              ? 'Làm Bài Test Xếp Lớp Đầu Vào (Placement Test)'
              : 'Take Quick Diagnostic Placement Test'}
          </button>
          <Link
            href="/#station-02"
            className="w-full py-3 px-4 rounded-xl bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs sm:text-sm font-extrabold text-center transition-colors"
          >
            {lang === 'vi'
              ? 'Vào Trạm 02 Ôn Tập FSRS Hôm Nay'
              : 'Start Today FSRS Queue (Station 02)'}
          </Link>
        </div>
      </section>

      {/* Diagnostic Placement Test Drawer */}
      {showPlacement && (
        <section className="mt-6 concourse-panel rounded-2xl p-6 border border-[#FACC15]">
          <div className="flex items-center justify-between pb-4 border-b border-[#2E3340]">
            <h2 className="font-display text-lg font-extrabold text-[#FACC15]">
              {lang === 'vi'
                ? 'BÀI TEST CHẨN ĐOÁN NHANH TRÌNH ĐỘ TỪ VỰNG & PARAPHRASE (3 CÂU)'
                : 'DIAGNOSTIC LEXICAL & PARAPHRASE PLACEMENT TEST'}
            </h2>
            <button
              type="button"
              onClick={() => setShowPlacement(false)}
              className="text-xs font-mono-data text-[#B8B2A6] hover:text-[#F4F1EA]"
            >
              Đóng / Close
            </button>
          </div>

          <div className="divide-y divide-[#2E3340] mt-4">
            {PLACEMENT_QUESTIONS.map((q) => (
              <div key={q.id} className="py-4 space-y-2.5">
                <p className="text-sm font-semibold text-[#F4F1EA]">
                  {lang === 'vi' ? q.qVi : q.qEn}
                </p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        setPlacementAnswers((prev) => ({ ...prev, [q.id]: opt }))
                      }
                      className={`px-3.5 py-1.5 rounded font-mono-data text-xs font-bold border transition-colors cursor-pointer ${
                        placementAnswers[q.id] === opt
                          ? 'bg-[#FACC15] text-[#16181D] border-[#FACC15]'
                          : 'bg-[#1F2229] text-[#B8B2A6] border-[#363B47]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#2E3340] flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleFinishPlacement}
              className="px-5 py-2.5 rounded-xl bg-[#065F46] text-[#F4F1EA] font-display text-xs font-extrabold cursor-pointer"
            >
              {lang === 'vi'
                ? 'Chấm Điểm & Cập Nhật Lộ Trình (+100 XP)'
                : 'Calculate Band & Update Roadmap (+100 XP)'}
            </button>
            {placementDone && (
              <span className="font-mono-data text-xs text-[#10B981] font-bold">
                {lang === 'vi'
                  ? `Đã cập nhật trình độ hiện tại: Band ${user?.currentBand || '6.0'} → Mục tiêu Band ${user?.targetBand || '7.5'}!`
                  : `Updated Diagnostic Band: ${user?.currentBand || '6.0'} → Target ${user?.targetBand || '7.5'}!`}
              </span>
            )}
          </div>
        </section>
      )}

      {/* 4 Roadmap Stages */}
      <div className="mt-8 space-y-6">
        {roadmaps.map((stage) => {
          const isVipLocked =
            stage.access === 'VIP' &&
            user?.role !== 'vip' &&
            user?.role !== 'admin';

          return (
            <section
              key={stage.id}
              className="concourse-panel rounded-2xl overflow-hidden border border-[#2E3340]"
            >
              <div className="px-6 py-4 bg-[#1C1F27] border-b border-[#2E3340] flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 rounded bg-[#FACC15] text-[#16181D] font-mono-data text-xs font-black">
                    {stage.code} • {stage.bandRange}
                  </span>
                  <h2 className="font-display text-lg font-extrabold text-[#F4F1EA]">
                    {lang === 'vi' ? stage.titleVi : stage.titleEn}
                  </h2>
                </div>

                <div className="flex items-center gap-2 font-mono-data text-xs">
                  <span className="px-2.5 py-1 rounded bg-[#272B35] text-[#B8B2A6]">
                    {stage.durationWeeks} {lang === 'vi' ? 'Tuần' : 'Weeks'}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded font-bold ${
                      stage.access === 'VIP'
                        ? 'bg-[#EA580C] text-[#F4F1EA]'
                        : 'bg-[#065F46] text-[#F4F1EA]'
                    }`}
                  >
                    {stage.access === 'VIP' ? 'GÓI VIP UNLIMITED' : 'MIỄN PHÍ (FREE)'}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-[#2E3340]">
                {stage.modules.map((mod) => {
                  const isDone = user?.completedModules?.includes(mod.id) ?? false;
                  return (
                    <div
                      key={mod.id}
                      className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[#1C1F27]/60 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono-data text-xs text-[#FACC15] font-bold">
                            {mod.day}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-[#252934] text-[#10B981] font-mono-data text-xs">
                            {mod.skill}
                          </span>
                          <span className="font-mono-data text-xs text-[#B8B2A6]">
                            • {mod.targetWords} từ • {mod.durationMins} phút/ngày
                          </span>
                        </div>
                        <p className="text-sm sm:text-base font-bold text-[#F4F1EA]">
                          {lang === 'vi' ? mod.titleVi : mod.titleEn}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                          href="/#station-02"
                          className="px-3.5 py-2 rounded-lg bg-[#252934] hover:bg-[#FACC15] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs font-bold transition-colors"
                        >
                          {lang === 'vi' ? 'Vào Học Thực Hành' : 'Practice Now'}
                        </Link>

                        {isVipLocked ? (
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#EA580C] text-[#F4F1EA] font-mono-data text-xs font-bold"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>{lang === 'vi' ? 'Mở khóa VIP' : 'Unlock VIP'}</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleModule(mod.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg font-mono-data text-xs font-bold transition-colors cursor-pointer ${
                              isDone
                                ? 'bg-[#065F46] text-[#F4F1EA]'
                                : 'bg-[#FACC15] text-[#16181D] hover:bg-[#EAB308]'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>
                              {isDone
                                ? lang === 'vi'
                                  ? 'Đã Hoàn Thành (+50 XP)'
                                  : 'Completed (+50 XP)'
                                : lang === 'vi'
                                ? 'Đánh Dấu Hoàn Thành'
                                : 'Mark Complete'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
