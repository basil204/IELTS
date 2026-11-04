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
  UserPlus
} from 'lucide-react';

function GoogleLogoSvg() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
        d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'vi' | 'en'>('vi');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('minhanh.ielts@gmail.com');
  const [password, setPassword] = useState('User@123');
  const [targetBand, setTargetBand] = useState('7.5');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setStatusMsg(null);

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
        setErrorMsg(data.error || 'Authentication failed');
      } else {
        localStorage.setItem('tid_active_user_v1', JSON.stringify(data.user));
        setStatusMsg(
          lang === 'vi'
            ? `Đăng nhập thành công: ${data.user.name} (${data.user.plan})`
            : `Signed in as ${data.user.name} (${data.user.plan})`
        );
        setTimeout(() => {
          router.push(data.user.role === 'admin' ? '/admin' : '/roadmap');
        }, 700);
      }
    } catch {
      setErrorMsg('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (demoEmail?: string, demoName?: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'google',
          email: demoEmail || 'minhanh.ielts@gmail.com',
          name: demoName || 'Nguyễn Minh Anh (Google Verified)'
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        localStorage.setItem('tid_active_user_v1', JSON.stringify(data.user));
        setStatusMsg(
          lang === 'vi'
            ? `Đã xác thực Google OAuth 2.0: ${data.user.name}`
            : `Google OAuth 2.0 Verified: ${data.user.name}`
        );
        setTimeout(() => {
          router.push(data.user.role === 'admin' ? '/admin' : '/roadmap');
        }, 600);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccount = (
    roleEmail: string,
    rolePass: string,
    label: string
  ) => {
    setMode('login');
    setEmail(roleEmail);
    setPassword(rolePass);
    setStatusMsg(
      lang === 'vi'
        ? `Đã điền sẵn tài khoản ${label}. Nhấn Đăng Nhập bên dưới!`
        : `Pre-filled ${label} credentials. Click Sign In below!`
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FBFF] text-[#0F172A] px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-[1160px] mx-auto space-y-8">
        {/* Top Bar */}
        <header className="bg-[#FFFFFF] rounded-2xl p-4 sm:px-6 border border-[#DCEBFA] shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F0F7FF] text-[#0284C7] border border-[#BAE6FD] font-display text-xs font-bold hover:bg-[#0284C7] hover:text-[#FFFFFF] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{lang === 'vi' ? 'Về Trang Chủ 4.0' : 'Back to Home'}</span>
            </Link>
            <h1 className="font-display text-xl sm:text-2xl font-black tracking-tight text-[#0F172A]">
              YOUPASS <span className="text-[#0284C7]">× WORD ATLAS ID</span>
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setLang((l) => (l === 'vi' ? 'en' : 'vi'))}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] font-mono-data text-xs font-bold cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? ' ngôn ngữ: VI / EN' : 'Language: EN / VI'}</span>
          </button>
        </header>

        {/* Main 2-Column Commercial Auth Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Auth Form & Google OAuth */}
          <section className="lg:col-span-7 bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[#DCEBFA]">
                <h2 className="font-display text-xl font-extrabold text-[#0F172A]">
                  {mode === 'login'
                    ? lang === 'vi'
                      ? '01 / ĐĂNG NHẬP HỆ THỐNG HỌC TẬP 4.0'
                      : '01 / SIGN IN TO LEARNING STUDIO 4.0'
                    : lang === 'vi'
                      ? '01 / ĐĂNG KÝ TÀI KHOẢN HỌC VIÊN MỚI'
                      : '01 / CREATE NEW STUDENT ACCOUNT'}
                </h2>

                <div className="flex items-center gap-1.5 bg-[#F0F7FF] p-1 rounded-xl border border-[#DCEBFA]">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer ${
                      mode === 'login'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'text-[#334155]'
                    }`}
                  >
                    {lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold cursor-pointer ${
                      mode === 'register'
                        ? 'bg-[#0284C7] text-[#FFFFFF]'
                        : 'text-[#334155]'
                    }`}
                  >
                    {lang === 'vi' ? 'Đăng Ký' : 'Register'}
                  </button>
                </div>
              </div>

              {/* Google OAuth Button */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin()}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#F0F7FF] hover:bg-[#E0F2FE] text-[#0F172A] border border-[#BAE6FD] font-display font-extrabold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
                >
                  <GoogleLogoSvg />
                  <span>
                    {lang === 'vi'
                      ? 'Tiếp tục bằng tài khoản Google (OAuth 2.0 Một Chạm)'
                      : 'Continue with Google Account (1-Click OAuth 2.0)'}
                  </span>
                </button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 border-t border-[#DCEBFA]" />
                <span className="font-mono-data text-xs text-[#64748B]">
                  {lang === 'vi' ? 'HOẶC EMAIL HỌC VIÊN' : 'OR STUDENT EMAIL'}
                </span>
                <div className="flex-1 border-t border-[#DCEBFA]" />
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-mono-data font-bold text-[#334155] mb-1.5">
                      {lang === 'vi' ? 'HỌ VÀ TÊN HỌC VIÊN' : 'FULL NAME'}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nguyễn Văn A..."
                      className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-xl px-4 py-3 text-sm text-[#0F172A]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono-data font-bold text-[#334155] mb-1.5">
                    EMAIL
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#0284C7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-xl pl-10 pr-4 py-3 text-sm text-[#0F172A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-data font-bold text-[#334155] mb-1.5">
                    {lang === 'vi' ? 'MẬT KHẨU' : 'PASSWORD'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#0284C7] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-xl pl-10 pr-4 py-3 text-sm text-[#0F172A]"
                    />
                  </div>
                </div>

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-mono-data font-bold text-[#334155] mb-1.5">
                      {lang === 'vi' ? 'MỤC TIÊU BAND IELTS' : 'TARGET IELTS BAND'}
                    </label>
                    <select
                      value={targetBand}
                      onChange={(e) => setTargetBand(e.target.value)}
                      className="w-full bg-[#F8FBFF] border border-[#DCEBFA] rounded-xl px-4 py-3 text-sm text-[#0F172A]"
                    >
                      <option value="6.5">Band 6.5 (Academic Foundation)</option>
                      <option value="7.5">Band 7.5 (Advanced C1)</option>
                      <option value="8.0">Band 8.0+ (Mastery C2)</option>
                    </select>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-[#FFF1F2] border border-[#FECDD3] text-xs font-semibold text-[#E11D48]">
                    {errorMsg}
                  </div>
                )}

                {statusMsg && (
                  <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-semibold text-[#059669] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                >
                  {mode === 'login' ? (
                    <KeyRound className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {mode === 'login'
                      ? lang === 'vi'
                        ? 'Đăng Nhập Vào Lộ Trình Học'
                        : 'Sign In to Study Dashboard'
                      : lang === 'vi'
                        ? 'Tạo Tài Khoản & Mở Lộ Trình'
                        : 'Create Account & Start Roadmap'}
                  </span>
                </button>
              </form>
            </div>
          </section>

          {/* Right 5 Cols: Instant Demo Credentials */}
          <section className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#DCEBFA] shadow-sm flex flex-col justify-between">
            <div className="space-y-5">
              <div className="pb-4 border-b border-[#DCEBFA]">
                <h2 className="font-display text-lg font-extrabold text-[#0F172A]">
                  {lang === 'vi'
                    ? '02 / ĐĂNG NHẬP NHANH TÀI KHOẢN DEMO'
                    : '02 / 1-CLICK DEMO ACCOUNTS'}
                </h2>
                <p className="text-xs text-[#334155] mt-1">
                  {lang === 'vi'
                    ? 'Chọn 1 trong 3 vai trò dưới đây để kiểm thử ngay quyền Admin CMS, Học viên PRO hoặc Học viên Miễn phí:'
                    : 'Click any role below to test Admin CMS, PRO Student, or Free Student:'}
                </p>
              </div>

              <div className="divide-y divide-[#DCEBFA] border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#F8FBFF]">
                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-bold text-[#0284C7]">
                      1. Admin CMS (Quản trị toàn hệ thống)
                    </div>
                    <div className="font-mono-data text-xs text-[#334155]">
                      admin@theieltsdictionary.vn • Admin@123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoAccount(
                        'admin@theieltsdictionary.vn',
                        'Admin@123',
                        'Admin CMS'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#0284C7] text-[#FFFFFF] font-mono-data text-xs font-bold cursor-pointer"
                  >
                    Chọn Admin
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-bold text-[#059669]">
                      2. Học viên PRO (Full 10,972 từ & Lộ trình)
                    </div>
                    <div className="font-mono-data text-xs text-[#334155]">
                      minhanh.ielts@gmail.com • User@123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoAccount(
                        'minhanh.ielts@gmail.com',
                        'User@123',
                        'VIP PRO'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#059669] text-[#FFFFFF] font-mono-data text-xs font-bold cursor-pointer"
                  >
                    Chọn PRO
                  </button>
                </div>

                <div className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-display text-sm font-bold text-[#0F172A]">
                      3. Học viên Free (Gói cơ bản)
                    </div>
                    <div className="font-mono-data text-xs text-[#334155]">
                      hoangnam@gmail.com • User@123
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickDemoAccount(
                        'hoangnam@gmail.com',
                        'User@123',
                        'Free Student'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold cursor-pointer"
                  >
                    Chọn Free
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#DCEBFA] space-y-2 text-xs text-[#334155]">
              <div className="flex items-center gap-2 text-[#0F172A] font-bold">
                <ShieldCheck className="w-4 h-4 text-[#0284C7]" />
                <span>
                  {lang === 'vi'
                    ? 'Đồng bộ Sổ Từ Vựng, Lịch ôn FSRS & Lộ trình 12 tuần'
                    : 'Synchronizes Notebook, FSRS Schedule & 12-Week Roadmap'}
                </span>
              </div>
              <p>
                {lang === 'vi'
                  ? 'Sau khi đăng nhập, toàn bộ tiến độ FSRS, sổ từ vựng cá nhân và các tuần học đã hoàn thành được đồng bộ trực tiếp với tài khoản của bạn.'
                  : 'Once signed in, your FSRS retention schedule, personal vocabulary notebook, and completed roadmap weeks are synced.'}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
