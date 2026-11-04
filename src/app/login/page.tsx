'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Globe,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  UserPlus
} from 'lucide-react';

const STORAGE_USER_KEY = 'tid_active_user_v1';

function GoogleLogoSvg() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.8c-.2-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.6 6.4C.6 8.4 0 10.6 0 12s.6 3.6 1.6 5.6l3.7-2.8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 20.4 7.4 23 12 23z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('minhanh@theieltsdictionary.vn');
  const [password, setPassword] = useState('Vip@123');
  const [targetBand, setTargetBand] = useState('7.5');
  const [googleEmailPrompt, setGoogleEmailPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('minhanh@theieltsdictionary.vn');
  const [googleName, setGoogleName] = useState('Nguyễn Minh Anh');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          name,
          email,
          password,
          targetBand
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        setLoading(false);
        return;
      }
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/roadmap');
      }
    } catch {
      setError('Lỗi kết nối máy chủ / Server connection error.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (customEmail?: string, customName?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          email: customEmail || googleEmail,
          name: customName || googleName
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        router.push('/roadmap');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPass: string, redirectUrl: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: demoEmail,
          password: demoPass
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
        router.push(redirectUrl);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Concourse Bar */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#16181D]/15">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#16181D] text-[#F4F1EA] hover:bg-[#272B35] font-display text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#FACC15]" />
            <span>{lang === 'vi' ? 'Về Trang Chủ Bento' : 'Back to Bento Home'}</span>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#16181D]">
            THE IELTS DICTIONARY × WORD ATLAS — GATEWAY AUTH
          </h1>
        </div>

        <button
          type="button"
          onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#16181D] text-[#FACC15] font-mono-data text-xs font-bold cursor-pointer"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'vi' ? 'NGÔN NGỮ: TIẾNG VIỆT (CHUYỂN EN)' : 'LANGUAGE: ENGLISH (SWITCH VI)'}</span>
        </button>
      </header>

      {/* Main 2-Column Concourse Auth Layout */}
      <main className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Passport Boarding Information & Quick Demo Accounts */}
        <section className="lg:col-span-6 concourse-panel rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-[#2E3340]">
          <div className="space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#F4F1EA] border-b border-[#2E3340] pb-4">
              {lang === 'vi'
                ? '01 / CỔNG ĐĂNG NHẬP & ĐỒNG BỘ TIẾN ĐỘ FSRS TOÀN CẦU'
                : '01 / GLOBAL FSRS PROGRESS & LEARNING CONCOURSE GATE'}
            </h2>

            <p className="text-sm sm:text-base text-[#B8B2A6] leading-relaxed">
              {lang === 'vi'
                ? 'Đăng nhập bằng tài khoản Google hoặc Email để lưu trữ vĩnh viễn lịch sử ôn tập 7,298 từ vựng Word-Atlas, mở khóa lộ trình 12 tuần cá nhân hóa (Band 4.0 → 8.0+), tham gia bảng xếp hạng Đua Top săn VIP và truy cập kho 3,674 từ vựng chuyên đề My-IELTS.'
                : 'Sign in with Google or Email to permanently sync your 7,298 Word-Atlas FSRS memory schedule, unlock the 12-week adaptive roadmap (Band 4.0 → 8.0+), compete on the VIP Leaderboard, and access all 3,674 My-IELTS thematic words.'}
            </p>

            <div className="divide-y divide-[#2E3340] border-t border-b border-[#2E3340] text-sm">
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[#F4F1EA] font-medium">
                  {lang === 'vi'
                    ? 'Kho từ vựng minh họa Word-Atlas (CC BY 4.0)'
                    : 'Illustrated Word-Atlas Corpus (CC BY 4.0)'}
                </span>
                <span className="font-mono-data text-[#FACC15] font-bold">
                  7,298 Words • 19 Topics
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[#F4F1EA] font-medium">
                  {lang === 'vi'
                    ? 'Kho chuyên đề My-IELTS (22 Chương + 538 Reading + 179 Listening)'
                    : 'My-IELTS Corpus (22 Chapters + 538 Reading + 179 Listening)'}
                </span>
                <span className="font-mono-data text-[#10B981] font-bold">
                  4,487 Exam Items
                </span>
              </div>
              <div className="py-3.5 flex items-center justify-between">
                <span className="text-[#F4F1EA] font-medium">
                  {lang === 'vi'
                    ? 'Ngôn ngữ giao diện & giải nghĩa chuẩn hóa'
                    : 'Standardized Bilingual Interface & Lexicon'}
                </span>
                <span className="font-mono-data text-[#F4F1EA] font-bold">
                  Tiếng Việt & English
                </span>
              </div>
            </div>
          </div>

          {/* 1-Click Quick Demo Accounts */}
          <div className="mt-8 pt-5 border-t border-[#2E3340] space-y-3">
            <h3 className="font-display text-sm font-extrabold text-[#FACC15]">
              {lang === 'vi'
                ? 'ĐĂNG NHẬP NHANH TÀI KHOẢN MẪU (1-CLICK DEMO ACCESS):'
                : '1-CLICK DEMO ACCOUNTS FOR INSTANT TESTING:'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    'admin@theieltsdictionary.vn',
                    'Admin@123',
                    '/admin'
                  )
                }
                className="px-3.5 py-3 rounded-xl bg-[#EA580C] hover:bg-[#D9460F] text-[#F4F1EA] font-display text-xs font-extrabold text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>ADMIN PORTAL</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="font-mono-data text-xs opacity-90 mt-1">
                  Quản trị toàn hệ thống
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    'minhanh@theieltsdictionary.vn',
                    'Vip@123',
                    '/roadmap'
                  )
                }
                className="px-3.5 py-3 rounded-xl bg-[#FACC15] hover:bg-[#EAB308] text-[#16181D] font-display text-xs font-extrabold text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>HỌC VIÊN VIP</span>
                  <UserCheck className="w-4 h-4" />
                </div>
                <div className="font-mono-data text-xs opacity-85 mt-1">
                  Mở khóa Full 4 Chặng
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    'hocvien@theieltsdictionary.vn',
                    'Student@123',
                    '/roadmap'
                  )
                }
                className="px-3.5 py-3 rounded-xl bg-[#272B35] hover:bg-[#323744] text-[#F4F1EA] font-display text-xs font-extrabold text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span>HỌC VIÊN FREE</span>
                  <KeyRound className="w-4 h-4 text-[#10B981]" />
                </div>
                <div className="font-mono-data text-xs text-[#B8B2A6] mt-1">
                  Học thử Chặng 1 & 2
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Google OAuth & Email/Password Form */}
        <section className="lg:col-span-6 concourse-panel rounded-2xl p-6 sm:p-8 border border-[#2E3340] flex flex-col justify-between">
          <div>
            {/* Mode Switcher */}
            <div className="grid grid-cols-2 rounded-xl bg-[#1F2229] p-1 border border-[#2E3340] mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`py-2.5 rounded-lg font-display text-sm font-extrabold transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'text-[#B8B2A6] hover:text-[#F4F1EA]'
                }`}
              >
                {lang === 'vi' ? 'Đăng Nhập (Sign In)' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`py-2.5 rounded-lg font-display text-sm font-extrabold transition-colors cursor-pointer ${
                  mode === 'register'
                    ? 'bg-[#FACC15] text-[#16181D]'
                    : 'text-[#B8B2A6] hover:text-[#F4F1EA]'
                }`}
              >
                {lang === 'vi' ? 'Đăng Ký Mới (Register)' : 'Create Account'}
              </button>
            </div>

            {/* Google OAuth Button */}
            <div className="space-y-3 pb-6 border-b border-[#2E3340]">
              <button
                type="button"
                onClick={() => setGoogleEmailPrompt((prev) => !prev)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#F4F1EA] hover:bg-[#FFFFFF] text-[#16181D] font-display text-sm font-extrabold flex items-center justify-center gap-3 transition-colors cursor-pointer"
              >
                <GoogleLogoSvg />
                <span>
                  {lang === 'vi'
                    ? 'Tiếp tục với tài khoản Google (Google OAuth 2.0)'
                    : 'Continue with Google Account (Google OAuth 2.0)'}
                </span>
              </button>

              {googleEmailPrompt && (
                <div className="pt-3 space-y-3 border-t border-[#2E3340]">
                  <p className="text-xs text-[#FACC15] font-mono-data">
                    {lang === 'vi'
                      ? 'CHỌN HOẶC NHẬP EMAIL GOOGLE CỦA BẠN ĐỂ ĐĂNG NHẬP NGAY:'
                      : 'SELECT OR ENTER YOUR GOOGLE ACCOUNT TO CONTINUE:'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="Tên hiển thị Google..."
                      className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3 py-2 text-xs text-[#F4F1EA]"
                    />
                    <input
                      type="email"
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="your.email@gmail.com"
                      className="bg-[#1F2229] border border-[#363B47] rounded-lg px-3 py-2 text-xs text-[#F4F1EA]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGoogleLogin()}
                    className="w-full py-2.5 rounded-lg bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-xs font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'vi'
                      ? `Xác thực Google cho ${googleEmail}`
                      : `Authenticate Google as ${googleEmail}`}
                  </button>
                </div>
              )}
            </div>

            {/* Email & Password Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono-data text-[#B8B2A6] mb-1.5">
                    {lang === 'vi' ? 'HỌ VÀ TÊN HỌC VIÊN' : 'FULL NAME'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nguyễn Văn A..."
                    className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono-data text-[#B8B2A6] mb-1.5">
                  {lang === 'vi' ? 'ĐỊA CHỈ EMAIL' : 'EMAIL ADDRESS'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#B8B2A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#F4F1EA]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#B8B2A6] mb-1.5">
                  {lang === 'vi' ? 'MẬT KHẨU' : 'PASSWORD'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#B8B2A6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg pl-10 pr-3.5 py-2.5 text-sm text-[#F4F1EA]"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-mono-data text-[#B8B2A6] mb-1.5">
                    {lang === 'vi' ? 'MỤC TIÊU BAND IELTS' : 'TARGET IELTS BAND'}
                  </label>
                  <select
                    value={targetBand}
                    onChange={(e) => setTargetBand(e.target.value)}
                    className="w-full bg-[#1F2229] border border-[#363B47] rounded-lg px-3.5 py-2.5 text-sm text-[#F4F1EA]"
                  >
                    <option value="6.5">Band 6.5 (Academic / General)</option>
                    <option value="7.0">Band 7.0 (Học bổng / Du học)</option>
                    <option value="7.5">Band 7.5 (Chuyên sâu C1)</option>
                    <option value="8.0+">Band 8.0+ (Mastery C2)</option>
                  </select>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-[#EA580C]/20 border border-[#EA580C] text-xs text-[#F4F1EA]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-[#065F46] hover:bg-[#10B981] hover:text-[#16181D] text-[#F4F1EA] font-display text-sm font-extrabold transition-colors cursor-pointer"
              >
                {loading
                  ? 'Đang xử lý...'
                  : mode === 'login'
                  ? lang === 'vi'
                    ? 'Đăng Nhập Vào Lộ Trình Học'
                    : 'Sign In to Learning Roadmap'
                  : lang === 'vi'
                  ? 'Tạo Tài Khoản & Bắt Đầu Học Ngay'
                  : 'Create Account & Start Learning'}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2E3340] flex items-center justify-between text-xs text-[#B8B2A6]">
            <span>
              {lang === 'vi'
                ? 'Tài khoản Admin: admin@theieltsdictionary.vn / Admin@123'
                : 'Admin Login: admin@theieltsdictionary.vn / Admin@123'}
            </span>
            <Link href="/pricing" className="text-[#FACC15] hover:underline font-mono-data">
              {lang === 'vi' ? 'Bảng giá VIP →' : 'VIP Pricing →'}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
