'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Globe
} from 'lucide-react';
import type { PlatformUser } from '@/lib/db';

const STORAGE_USER_KEY = 'tid_active_user_v1';

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter (Freemium)',
    priceVnd: 0,
    duration: 'Trọn đời / Forever',
    badge: 'GATE 01–02',
    featuresVi: [
      'Truy cập 7,298 từ vựng Word-Atlas (See & Hear + Recall Cloze)',
      'Ôn tập lặp lại ngắt quãng FSRS hàng ngày (28 thẻ/ngày)',
      'Mở khóa Chặng 1 & Chặng 2 trong Lộ trình 12 tuần (Band 4.0 → 6.0)',
      'Tra cứu 179 nhóm Paraphrase Listening & 538 từ khóa Reading'
    ],
    featuresEn: [
      'Access 7,298 Word-Atlas entries (See & Hear + Recall Cloze)',
      'Daily FSRS spaced repetition queue (28 cards/day)',
      'Unlock Stage 1 & Stage 2 of the 12-week Roadmap (Band 4.0 → 6.0)',
      'Browse 179 Listening Paraphrases & 538 Reading Exam Keywords'
    ]
  },
  {
    id: 'pro',
    name: 'Pro Scholar (6 Tháng)',
    priceVnd: 790000,
    duration: '180 Ngày / 6 Months',
    badge: 'BAND 6.5–7.0',
    featuresVi: [
      'Toàn bộ quyền lợi gói Free Starter không giới hạn lượt FSRS/ngày',
      'Mở khóa Chặng 3 (Band 6.0 → 7.0) & 22 Chuyên đề Nghe chép 3,674 từ',
      'Luyện tập không giới hạn Phòng thi máy tính Reading & Listening',
      'Đồng bộ tiến độ đám mây qua Google OAuth & Bảng xếp hạng VIP'
    ],
    featuresEn: [
      'All Free Starter features with unlimited daily FSRS reviews',
      'Unlock Stage 3 (Band 6.0 → 7.0) & all 22 Dictation Chapters (3,674 words)',
      'Unlimited Split-Screen Computer-Delivered Reading & Listening Mock Tests',
      'Cloud progress sync via Google OAuth & VIP Leaderboard entry'
    ]
  },
  {
    id: 'vip',
    name: 'VIP Unlimited (12 Tháng)',
    priceVnd: 1490000,
    duration: '365 Ngày / 12 Months',
    badge: 'BAND 7.5–8.0+ BESTSELLER',
    highlight: true,
    featuresVi: [
      'Mở khóa toàn bộ 4 Chặng Lộ trình Adaptive (Band 4.0 → 8.0+)',
      'Toàn bộ 7,298 từ Word-Atlas + 3,674 từ Chân Kinh + 100 câu Writing Band 7.5+',
      'Chấm bài IELTS Writing & Speaking chi tiết theo 4 tiêu chí chuẩn IDP/BC',
      'Tặng bộ Ebook PDF độc quyền & Ưu tiên hỗ trợ học thuật 1-1'
    ],
    featuresEn: [
      'Unlock all 4 Adaptive Roadmap Stages (Band 4.0 → 8.0+)',
      'Full 7,298 Word-Atlas + 3,674 Chapter Words + 100 Band 7.5+ Writing Drills',
      'Automated IELTS Writing & Speaking evaluation across 4 official band criteria',
      'Exclusive downloadable PDF Ebooks & Priority 1-on-1 academic support'
    ]
  }
];

export default function PricingPage() {
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [user, setUser] = useState<Omit<PlatformUser, 'passwordHash'> | null>(null);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[2]);
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [transferCode, setTransferCode] = useState('TIDVIP 8899');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setTransferCode(`TIDVIP ${Math.floor(1000 + Math.random() * 9000)}`);
    try {
      const saved = localStorage.getItem(STORAGE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setBuyerName(parsed.name || '');
        setBuyerEmail(parsed.email || '');
      }
    } catch {
      // ignore
    }
  }, []);

  const handleConfirmPayment = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createOrder',
          userId: user?.id,
          userName: buyerName || user?.name || 'Học viên VIP',
          userEmail: buyerEmail || user?.email || 'vip@theieltsdictionary.vn',
          planName: selectedPlan.name,
          amountVnd: selectedPlan.priceVnd,
          transferCode
        })
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrderSuccess(data.order.id);
        if (user) {
          const updatedUser = {
            ...user,
            role: user.role === 'admin' ? ('admin' as const) : ('vip' as const),
            plan: selectedPlan.name
          };
          setUser(updatedUser);
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const vietQrUrl = `https://img.vietqr.io/image/MB-0988776655-compact2.png?amount=${selectedPlan.priceVnd}&addInfo=${encodeURIComponent(
    transferCode
  )}&accountName=${encodeURIComponent('THE IELTS DICTIONARY')}`;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DCEBFA]">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold hover:bg-[#F0F7FF]"
          >
            <ArrowLeft className="w-4 h-4 text-[#0284C7]" />
            <span>{lang === 'vi' ? 'Về Trang Chủ' : 'Back Home'}</span>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#0F172A]">
            {lang === 'vi'
              ? 'NÂNG CẤP TÀI KHOẢN PRO / VIP & KÍCH HOẠT TỰ ĐỘNG VIETQR'
              : 'PRO / VIP MEMBERSHIP & INSTANT VIETQR AUTO-ACTIVATION'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F0F7FF] border border-[#BAE6FD] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'VI / EN' : 'EN / VI'}</span>
          </button>
          <Link
            href="/roadmap"
            className="px-3.5 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold"
          >
            {lang === 'vi' ? 'Xem Lộ Trình 12 Tuần' : '12-Week Roadmap'}
          </Link>
        </div>
      </header>

      {/* 3 Pricing Tiers */}
      <section className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => {
          const isSelected = selectedPlan.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl p-6 flex flex-col justify-between border transition-all ${
                plan.highlight
                  ? 'wayfinding-hero-panel border-[#BAE6FD]'
                  : 'concourse-panel border-[#DCEBFA]'
              }`}
            >
              <div>
                <div
                  className={`flex items-center justify-between pb-4 border-b ${
                    plan.highlight ? 'border-[#BAE6FD]' : 'border-[#DCEBFA]'
                  }`}
                >
                  <h2 className="font-display text-lg font-black text-[#0F172A]">{plan.name}</h2>
                  <span
                    className={`px-2.5 py-1 rounded font-mono-data text-xs font-bold ${
                      plan.highlight
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'bg-[#F0F7FF] text-[#0284C7] border border-[#BAE6FD]'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="font-display text-3xl sm:text-4xl font-black text-[#0F172A] tabular-nums">
                    {plan.priceVnd === 0
                      ? '0đ'
                      : `${plan.priceVnd.toLocaleString('vi-VN')}đ`}
                  </div>
                  <div className="font-mono-data text-xs mt-1 text-[#64748B]">
                    {plan.duration}
                  </div>
                </div>

                <ul className="mt-6 space-y-3 text-sm text-[#334155]">
                  {(lang === 'vi' ? plan.featuresVi : plan.featuresEn).map(
                    (feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-[#059669]" />
                        <span>{feat}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                {plan.priceVnd === 0 ? (
                  <Link
                    href="/roadmap"
                    className="block w-full py-3 rounded-xl bg-[#F0F7FF] border border-[#DCEBFA] text-[#334155] font-display text-xs font-extrabold text-center hover:bg-[#E0F2FE]"
                  >
                    {lang === 'vi' ? 'Đang Sử Dụng Miễn Phí' : 'Current Free Plan'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPlan(plan)}
                    className={`w-full py-3.5 rounded-xl font-display text-sm font-extrabold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#0284C7] text-[#FFFFFF] hover:bg-[#0369A1]'
                        : 'bg-[#FFFFFF] border border-[#0284C7] text-[#0284C7] hover:bg-[#E0F2FE]'
                    }`}
                  >
                    {lang === 'vi'
                      ? `Chọn Gói ${plan.name} (VietQR)`
                      : `Select ${plan.name} (VietQR)`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Instant VietQR Checkout Concourse */}
      <section className="mt-10 concourse-panel rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-xl sm:text-2xl font-extrabold text-[#0F172A] border-b border-[#DCEBFA] pb-3">
            {lang === 'vi'
              ? `CỔNG THANH TOÁN TỰ ĐỘNG VIETQR (SEPAY / CASSO) — ${selectedPlan.name.toUpperCase()}`
              : `INSTANT VIETQR AUTO-CHECKOUT — ${selectedPlan.name.toUpperCase()}`}
          </h2>

          <p className="text-sm text-[#334155]">
            {lang === 'vi'
              ? 'Quét mã VietQR bên cạnh bằng ứng dụng ngân hàng bất kỳ. Hệ thống tự động nhận diện nội dung chuyển khoản và nâng cấp tài khoản lên VIP trong 3 giây.'
              : 'Scan the VietQR code with any banking app. The webhook automatically matches your transfer memo and activates VIP access within 3 seconds.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                {lang === 'vi' ? 'HỌ TÊN HỌC VIÊN' : 'STUDENT NAME'}
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nguyễn Văn A..."
                className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-lg px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                {lang === 'vi' ? 'EMAIL KÍCH HOẠT VIP' : 'ACTIVATION EMAIL'}
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="email@gmail.com..."
                className="w-full bg-[#F8FBFF] border border-[#BAE6FD] rounded-lg px-3.5 py-2 text-sm text-[#0F172A]"
              />
            </div>
          </div>

          <div className="divide-y divide-[#DCEBFA] border-t border-b border-[#DCEBFA] text-xs font-mono-data">
            <div className="py-2.5 flex justify-between">
              <span className="text-[#64748B]">NGÂN HÀNG THỤ HƯỞNG:</span>
              <span className="text-[#0F172A] font-bold">MB BANK • 0988776655</span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#64748B]">SỐ TIỀN CHUYỂN KHOẢN:</span>
              <span className="text-[#0284C7] font-bold">
                {selectedPlan.priceVnd.toLocaleString('vi-VN')} VND
              </span>
            </div>
            <div className="py-2.5 flex justify-between">
              <span className="text-[#64748B]">NỘI DUNG TỰ ĐỘNG KÍCH HOẠT:</span>
              <span className="text-[#059669] font-bold">{transferCode}</span>
            </div>
          </div>

          {orderSuccess ? (
            <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-sm text-[#047857] flex items-center justify-between">
              <span>
                Đã kích hoạt thành công mã đơn <strong>{orderSuccess}</strong>! Tài khoản của bạn đã lên <strong>VIP Unlimited</strong>.
              </span>
              <Link
                href="/roadmap"
                className="px-3.5 py-1.5 rounded bg-[#0284C7] text-[#FFFFFF] font-display text-xs font-extrabold shrink-0"
              >
                Vào Lộ Trình VIP →
              </Link>
            </div>
          ) : (
            <button
              type="button"
              disabled={processing}
              onClick={handleConfirmPayment}
              className="w-full py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-sm font-extrabold transition-colors cursor-pointer"
            >
              {processing
                ? 'Đang kiểm tra giao dịch...'
                : lang === 'vi'
                ? 'Xác Nhận Đã Chuyển Khoản & Kích Hoạt VIP Ngay'
                : 'Confirm Transfer & Activate VIP Now'}
            </button>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="bg-[#F0F7FF] border border-[#BAE6FD] p-4 rounded-2xl text-center max-w-xs w-full">
            <img
              src={vietQrUrl}
              alt="Mã thanh toán VietQR tự động"
              className="w-full h-auto rounded-lg"
            />
            <div className="mt-2 font-mono-data text-xs font-bold text-[#0F172A]">
              {transferCode} • {selectedPlan.priceVnd.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
