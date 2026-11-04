'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Database,
  Layers,
  Settings,
  Users
} from 'lucide-react';
import type {
  PlatformLead,
  PlatformOrder,
  PlatformSettings,
  PlatformUser,
  RoadmapStage
} from '@/lib/db';
import type { CefrLevel, WordAtlasEntry } from '@/types/atlas';

type AdminTab = 'overview' | 'vocabulary' | 'roadmaps' | 'users' | 'orders_settings';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<Omit<PlatformUser, 'passwordHash'>[]>([]);
  const [roadmaps, setRoadmaps] = useState<RoadmapStage[]>([]);
  const [orders, setOrders] = useState<PlatformOrder[]>([]);
  const [leads, setLeads] = useState<PlatformLead[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Vocabulary Manager State
  const [vocabSearch, setVocabSearch] = useState('');
  const [vocabResults, setVocabResults] = useState<WordAtlasEntry[]>([]);
  const [editWord, setEditWord] = useState({
    w: '',
    pos: 'n.',
    cefr: 'C1' as CefrLevel,
    topic: 'technology',
    vi: '',
    en: '',
    exEn: '',
    exVi: ''
  });

  // Roadmap New Module State
  const [newModStageId, setNewModStageId] = useState('stage-01');
  const [newModDay, setNewModDay] = useState('Tuần Bổ Sung • Ngày 1–3');
  const [newModTitleVi, setNewModTitleVi] = useState('');
  const [newModTitleEn, setNewModTitleEn] = useState('');
  const [newModSkill, setNewModSkill] = useState('Vocabulary & Reading');
  const [newModWords, setNewModWords] = useState(350);

  const loadAdminData = async () => {
    const res = await fetch('/api/admin');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setRoadmaps(data.roadmaps || []);
      setOrders(data.orders || []);
      setLeads(data.leads || []);
      setSettings(data.settings || null);
    }
  };

  const searchVocab = async (q: string) => {
    const res = await fetch(`/api/atlas?q=${encodeURIComponent(q)}&limit=16`);
    if (res.ok) {
      const data = await res.json();
      setVocabResults(data.items || []);
    }
  };

  useEffect(() => {
    loadAdminData();
    searchVocab('');
  }, []);

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleRoleChange = async (userId: string, role: 'student' | 'vip' | 'admin') => {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateUserRole', userId, role })
    });
    await loadAdminData();
    showToast(`Đã cập nhật quyền người dùng thành ${role.toUpperCase()}!`);
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveWord',
        ...editWord
      })
    });
    if (res.ok) {
      showToast(`Đã lưu từ vựng "${editWord.w}" vào CSDL Word-Atlas (7,298 từ)!`);
      searchVocab(vocabSearch);
    }
  };

  const handleAddRoadmapModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModTitleVi.trim()) return;
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addRoadmapModule',
        stageId: newModStageId,
        day: newModDay,
        titleVi: newModTitleVi,
        titleEn: newModTitleEn || newModTitleVi,
        skill: newModSkill,
        targetWords: newModWords,
        durationMins: 60
      })
    });
    if (res.ok) {
      const data = await res.json();
      setRoadmaps(data.roadmaps || []);
      setNewModTitleVi('');
      setNewModTitleEn('');
      showToast('Đã thêm bài học mới vào lộ trình thành công!');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updateSettings', settings })
    });
    showToast('Đã lưu cấu hình hệ thống (Google OAuth, VietQR & CDN)!');
  };

  const totalRevenue = orders.reduce((acc, o) => acc + (o.amountVnd || 0), 0);
  const vipCount = users.filter((u) => u.role === 'vip' || u.role === 'admin').length;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Concourse Admin Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#DCEBFA]">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#FFFFFF] border border-[#BAE6FD] text-[#0284C7] font-display text-xs font-bold hover:bg-[#F0F7FF]"
          >
            <ArrowLeft className="w-4 h-4 text-[#0284C7]" />
            <span>Về Trang Chủ</span>
          </Link>
          <h1 className="font-display text-xl sm:text-2xl font-black text-[#0F172A]">
            ADMIN CMS & CONTROL CENTER — YOUPASS × WORD ATLAS 4.0
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {statusMessage && (
            <span className="px-3.5 py-2 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-mono-data text-xs font-bold">
              {statusMessage}
            </span>
          )}
          <Link
            href="/roadmap"
            className="px-3.5 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-bold"
          >
            Xem Trang Lộ Trình
          </Link>
        </div>
      </header>

      {/* Admin Navigation Tabs */}
      <div className="mt-6 concourse-panel rounded-2xl overflow-hidden border border-[#DCEBFA]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-b border-[#DCEBFA] divide-y sm:divide-y-0 sm:divide-x divide-[#DCEBFA] bg-[#F0F7FF]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-4 text-left font-display text-xs sm:text-sm font-extrabold flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'text-[#0F172A] hover:bg-[#E0F2FE]'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>01 / Tổng Quan & Big Data</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vocabulary')}
            className={`px-5 py-4 text-left font-display text-xs sm:text-sm font-extrabold flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'vocabulary'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'text-[#0F172A] hover:bg-[#E0F2FE]'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>02 / Quản Lý 10,972 Từ Vựng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roadmaps')}
            className={`px-5 py-4 text-left font-display text-xs sm:text-sm font-extrabold flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'roadmaps'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'text-[#0F172A] hover:bg-[#E0F2FE]'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>03 / Quản Lý Lộ Trình Học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-5 py-4 text-left font-display text-xs sm:text-sm font-extrabold flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'text-[#0F172A] hover:bg-[#E0F2FE]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>04 / Học Viên & Phân Quyền</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('orders_settings')}
            className={`px-5 py-4 text-left font-display text-xs sm:text-sm font-extrabold flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'orders_settings'
                ? 'bg-[#0284C7] text-[#FFFFFF]'
                : 'text-[#0F172A] hover:bg-[#E0F2FE]'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>05 / Đơn Hàng & Cấu Hình</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#DCEBFA] border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#F8FBFF]">
              <div className="p-5">
                <div className="font-mono-data text-xs text-[#64748B]">
                  TỔNG DOANH THU VIETQR
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-[#0284C7] mt-1 tabular-nums">
                  {totalRevenue.toLocaleString('vi-VN')}đ
                </div>
                <div className="text-xs text-[#059669] mt-1">
                  {orders.length} đơn hàng đã kích hoạt tự động
                </div>
              </div>

              <div className="p-5">
                <div className="font-mono-data text-xs text-[#64748B]">
                  HỌC VIÊN & TÀI KHOẢN VIP
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-[#0F172A] mt-1 tabular-nums">
                  {users.length} Học viên ({vipCount} VIP)
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  Hỗ trợ Google OAuth 2.0 & Email Auth
                </div>
              </div>

              <div className="p-5">
                <div className="font-mono-data text-xs text-[#64748B]">
                  KHO TỪ VỰNG WORD-ATLAS
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-[#059669] mt-1 tabular-nums">
                  7,298 Từ
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  19 Chủ đề • 14,596 Ví dụ • 22,905 Audio
                </div>
              </div>

              <div className="p-5">
                <div className="font-mono-data text-xs text-[#64748B]">
                  KHO DỮ LIỆU MY-IELTS
                </div>
                <div className="font-display text-2xl sm:text-3xl font-black text-[#D97706] mt-1 tabular-nums">
                  3,674 Từ
                </div>
                <div className="text-xs text-[#64748B] mt-1">
                  22 Chương • 538 Reading • 179 Listening
                </div>
              </div>
            </div>

            {/* Recent Orders & Leads */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#FFFFFF]">
                <div className="px-5 py-3.5 bg-[#F0F7FF] border-b border-[#DCEBFA] font-display text-sm font-extrabold text-[#0F172A]">
                  ĐƠN HÀNG NÂNG CẤP VIP GẦN ĐÂY
                </div>
                <div className="divide-y divide-[#DCEBFA]">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="px-5 py-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#0F172A]">
                          {ord.id} — {ord.userName} ({ord.userEmail})
                        </div>
                        <div className="text-[#64748B] mt-0.5">
                          {ord.planName} • {ord.paymentMethod} ({ord.transferCode})
                        </div>
                      </div>
                      <span className="font-mono-data font-bold text-[#0284C7]">
                        {ord.amountVnd.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#FFFFFF]">
                <div className="px-5 py-3.5 bg-[#F0F7FF] border-b border-[#DCEBFA] font-display text-sm font-extrabold text-[#0F172A]">
                  PHỄU ĐĂNG KÝ TƯ VẤN LỘ TRÌNH (LEADS CRM)
                </div>
                <div className="divide-y divide-[#DCEBFA]">
                  {leads.map((l) => (
                    <div
                      key={l.id}
                      className="px-5 py-3.5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#0F172A]">
                          {l.name} — <span className="text-[#0284C7]">{l.contact}</span>
                        </div>
                        <div className="text-[#64748B] mt-0.5">
                          Mục tiêu: {l.targetBand} • {l.note}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#047857] font-mono-data font-bold">
                        {l.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VOCABULARY CMS (7,298 WORD-ATLAS EDITOR) */}
        {activeTab === 'vocabulary' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Add / Edit Word Form */}
            <form
              onSubmit={handleSaveWord}
              className="lg:col-span-5 space-y-3.5 border border-[#DCEBFA] rounded-xl p-5 bg-[#F8FBFF]"
            >
              <h2 className="font-display text-base font-extrabold text-[#0284C7] border-b border-[#DCEBFA] pb-3">
                THÊM MỚI HOẶC CẬP NHẬT TỪ VỰNG SONG NGỮ (VI / EN)
              </h2>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                    TỪ VỰNG (HEADWORD)
                  </label>
                  <input
                    type="text"
                    required
                    value={editWord.w}
                    onChange={(e) => setEditWord({ ...editWord, w: e.target.value })}
                    placeholder="ubiquitous..."
                    className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                    TỪ LOẠI & CEFR
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editWord.pos}
                      onChange={(e) => setEditWord({ ...editWord, pos: e.target.value })}
                      className="w-16 bg-[#FFFFFF] border border-[#BAE6FD] rounded px-2 py-2 text-xs text-[#0F172A]"
                    />
                    <select
                      value={editWord.cefr}
                      onChange={(e) =>
                        setEditWord({ ...editWord, cefr: e.target.value as CefrLevel })
                      }
                      className="flex-1 bg-[#FFFFFF] border border-[#BAE6FD] rounded px-2 py-2 text-xs text-[#0F172A]"
                    >
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  NGHĨA TIẾNG VIỆT CHUẨN HỌC THUẬT
                </label>
                <input
                  type="text"
                  required
                  value={editWord.vi}
                  onChange={(e) => setEditWord({ ...editWord, vi: e.target.value })}
                  placeholder="Có mặt ở khắp mọi nơi; phổ biến rộng khắp..."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  ĐỊNH NGHĨA TIẾNG ANH (ENGLISH DEFINITION)
                </label>
                <input
                  type="text"
                  required
                  value={editWord.en}
                  onChange={(e) => setEditWord({ ...editWord, en: e.target.value })}
                  placeholder="Present, appearing, or found everywhere..."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  CÂU VÍ DỤ IELTS TIẾNG ANH
                </label>
                <input
                  type="text"
                  value={editWord.exEn}
                  onChange={(e) => setEditWord({ ...editWord, exEn: e.target.value })}
                  placeholder="Smartphones have become ubiquitous in daily life."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  DỊCH CÂU VÍ DỤ TIẾNG VIỆT
                </label>
                <input
                  type="text"
                  value={editWord.exVi}
                  onChange={(e) => setEditWord({ ...editWord, exVi: e.target.value })}
                  placeholder="Điện thoại thông minh đã trở nên phổ biến khắp nơi..."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold transition-colors cursor-pointer"
              >
                Lưu Vào Kho 7,298 Từ Vựng Word-Atlas
              </button>
            </form>

            {/* Right: Search & Click to Edit */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex gap-2">
                <input
                  type="search"
                  value={vocabSearch}
                  onChange={(e) => {
                    setVocabSearch(e.target.value);
                    searchVocab(e.target.value);
                  }}
                  placeholder="Tìm kiếm trong 7,298 từ để chỉnh sửa nhanh..."
                  className="flex-1 bg-[#F8FBFF] border border-[#BAE6FD] rounded-lg px-4 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div className="border border-[#DCEBFA] rounded-xl overflow-hidden divide-y divide-[#DCEBFA] max-h-[460px] overflow-y-auto bg-[#FFFFFF]">
                {vocabResults.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-[#F0F7FF]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-sm text-[#0284C7]">
                          {item.w}
                        </span>
                        <span className="font-mono-data text-xs text-[#D97706]">
                          {item.pos} • {item.cefr}
                        </span>
                      </div>
                      <div className="text-xs text-[#334155] mt-0.5">
                        {item.vi || item.en}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setEditWord({
                          w: item.w,
                          pos: item.pos,
                          cefr: item.cefr,
                          topic: item.topic,
                          vi: item.vi || '',
                          en: item.en || '',
                          exEn: item.ex[0]?.en || '',
                          exVi: item.ex[0]?.vi || ''
                        })
                      }
                      className="px-3 py-1 rounded bg-[#F0F7FF] hover:bg-[#0284C7] hover:text-[#FFFFFF] border border-[#BAE6FD] text-xs font-mono-data text-[#0284C7] shrink-0 cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROADMAP & CURRICULUM MANAGER */}
        {activeTab === 'roadmaps' && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleAddRoadmapModule}
              className="lg:col-span-4 space-y-3.5 border border-[#DCEBFA] rounded-xl p-5 bg-[#F8FBFF]"
            >
              <h2 className="font-display text-base font-extrabold text-[#0284C7] border-b border-[#DCEBFA] pb-3">
                THÊM BÀI HỌC VÀO LỘ TRÌNH 4 CHẶNG
              </h2>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  CHỌN CHẶNG LỘ TRÌNH
                </label>
                <select
                  value={newModStageId}
                  onChange={(e) => setNewModStageId(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                >
                  {roadmaps.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code} ({s.bandRange})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  TUẦN / NGÀY HỌC
                </label>
                <input
                  type="text"
                  value={newModDay}
                  onChange={(e) => setNewModDay(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  TIÊU ĐỀ BÀI HỌC (TIẾNG VIỆT)
                </label>
                <input
                  type="text"
                  required
                  value={newModTitleVi}
                  onChange={(e) => setNewModTitleVi(e.target.value)}
                  placeholder="Luyện chuyên sâu 200 từ vựng C1..."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  TIÊU ĐỀ BÀI HỌC (ENGLISH)
                </label>
                <input
                  type="text"
                  value={newModTitleEn}
                  onChange={(e) => setNewModTitleEn(e.target.value)}
                  placeholder="Intensive 200 C1 Academic Words..."
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                + Thêm Module Vào Lộ Trình
              </button>
            </form>

            <div className="lg:col-span-8 space-y-4 max-h-[500px] overflow-y-auto">
              {roadmaps.map((stage) => (
                <div
                  key={stage.id}
                  className="border border-[#DCEBFA] rounded-xl overflow-hidden bg-[#FFFFFF]"
                >
                  <div className="px-4 py-3 bg-[#F0F7FF] border-b border-[#DCEBFA] flex justify-between items-center">
                    <span className="font-display text-sm font-bold text-[#0284C7]">
                      {stage.code} • {stage.titleVi}
                    </span>
                    <span className="font-mono-data text-xs text-[#64748B]">
                      {stage.modules.length} modules
                    </span>
                  </div>
                  <div className="divide-y divide-[#DCEBFA]">
                    {stage.modules.map((m) => (
                      <div key={m.id} className="px-4 py-2.5 text-xs flex justify-between text-[#0F172A]">
                        <span>
                          <strong className="text-[#059669] mr-2">{m.day}:</strong>
                          {m.titleVi}
                        </span>
                        <span className="font-mono-data text-[#64748B]">
                          {m.targetWords} words
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="p-6">
            <div className="border border-[#DCEBFA] rounded-xl overflow-hidden divide-y divide-[#DCEBFA] bg-[#FFFFFF]">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F0F7FF]"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-display text-base font-bold text-[#0F172A]">
                        {u.name}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#E0F2FE] text-[#0284C7] font-mono-data text-xs font-bold">
                        {u.provider.toUpperCase()}
                      </span>
                      <span className="font-mono-data text-xs text-[#059669] font-bold">
                        {u.xp} XP • Streak {u.streak}d
                      </span>
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">
                      {u.email} • Band {u.currentBand} → {u.targetBand} • Gói: {u.plan}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {(['student', 'vip', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => handleRoleChange(u.id, r)}
                        className={`px-3 py-1.5 rounded font-mono-data text-xs font-bold cursor-pointer ${
                          u.role === r
                            ? 'bg-[#0284C7] text-[#FFFFFF]'
                            : 'bg-[#F0F7FF] border border-[#BAE6FD] text-[#334155] hover:text-[#0284C7]'
                        }`}
                      >
                        {r.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ORDERS & SETTINGS */}
        {activeTab === 'orders_settings' && settings && (
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveSettings}
              className="lg:col-span-6 space-y-4 border border-[#DCEBFA] rounded-xl p-5 bg-[#F8FBFF]"
            >
              <h2 className="font-display text-base font-extrabold text-[#0284C7] border-b border-[#DCEBFA] pb-3">
                CẤU HÌNH GOOGLE OAUTH, VIETQR & CLOUDFLARE R2 CDN
              </h2>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  GOOGLE OAUTH CLIENT ID
                </label>
                <input
                  type="text"
                  value={settings.googleClientId}
                  onChange={(e) =>
                    setSettings({ ...settings, googleClientId: e.target.value })
                  }
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                    NGÂN HÀNG VIETQR
                  </label>
                  <input
                    type="text"
                    value={settings.vietQrBankId}
                    onChange={(e) =>
                      setSettings({ ...settings, vietQrBankId: e.target.value })
                    }
                    className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                    SỐ TÀI KHOẢN NHẬN TIỀN
                  </label>
                  <input
                    type="text"
                    value={settings.vietQrAccountNo}
                    onChange={(e) =>
                      setSettings({ ...settings, vietQrAccountNo: e.target.value })
                    }
                    className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-data text-[#64748B] mb-1">
                  BASE URL KHO MEDIA (CLOUDFLARE R2 / S3 / GITHUB CDN)
                </label>
                <input
                  type="text"
                  value={settings.r2CdnBaseUrl}
                  onChange={(e) =>
                    setSettings({ ...settings, r2CdnBaseUrl: e.target.value })
                  }
                  className="w-full bg-[#FFFFFF] border border-[#BAE6FD] rounded px-3 py-2 text-xs text-[#0F172A]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-display text-xs font-extrabold cursor-pointer"
              >
                Lưu Cấu Hình Hệ Thống
              </button>
            </form>

            <div className="lg:col-span-6 border border-[#DCEBFA] rounded-xl p-5 bg-[#F8FBFF] space-y-3">
              <h2 className="font-display text-base font-extrabold text-[#0F172A] border-b border-[#DCEBFA] pb-3">
                TRẠNG THÁI CƠ SỞ DỮ LIỆU ĐÃ LƯU TRÊN SERVER
              </h2>
              <div className="divide-y divide-[#DCEBFA] text-xs font-mono-data text-[#334155]">
                <div className="py-2.5 flex justify-between">
                  <span>public/data/word-atlas-full.json</span>
                  <span className="text-[#059669] font-bold">7,298 Words (EN/VI)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>public/data/my-ielts-chapters.json</span>
                  <span className="text-[#059669] font-bold">22 Chapters • 3,674 Words</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>public/data/my-ielts-reading538.json</span>
                  <span className="text-[#059669] font-bold">3 Tiers • 376 Exam Words</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>public/data/my-ielts-listening179.json</span>
                  <span className="text-[#059669] font-bold">179 Synonym Chains</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>public/data/my-ielts-writing100.json</span>
                  <span className="text-[#059669] font-bold">100 Sentence Patterns</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>src/data/platform-db.json</span>
                  <span className="text-[#0284C7] font-bold">Users • Orders • Leads • Roadmaps</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
