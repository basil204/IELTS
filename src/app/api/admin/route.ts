import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readPlatformDb, writePlatformDb } from '@/lib/db';
import type { WordAtlasEntry } from '@/types/atlas';

export async function GET() {
  const db = readPlatformDb();
  const safeUsers = db.users.map(({ passwordHash: _o, ...rest }) => rest);
  return NextResponse.json({
    users: safeUsers,
    roadmaps: db.roadmaps,
    orders: db.orders,
    leads: db.leads,
    settings: db.settings,
    datasetStats: {
      wordAtlasTotal: 7298,
      myIeltsChaptersTotal: 3674,
      reading538Total: 376,
      listening179Total: 179,
      writing100Total: 100
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = readPlatformDb();

    if (action === 'updateUserRole') {
      const { userId, role, plan } = body;
      const user = db.users.find((u) => u.id === userId);
      if (user) {
        user.role = role;
        user.plan = plan || (role === 'vip' || role === 'admin' ? 'VIP Unlimited' : 'Free');
        writePlatformDb(db);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'createOrder') {
      const { userId, userName, userEmail, planName, amountVnd, transferCode } = body;
      const newOrder = {
        id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        userId: userId || 'guest',
        userName: userName || 'Học viên IELTS',
        userEmail: userEmail || 'learner@theieltsdictionary.vn',
        planName: planName || 'VIP Unlimited (12 Tháng)',
        amountVnd: Number(amountVnd) || 1490000,
        paymentMethod: 'VietQR SePay Auto',
        transferCode: transferCode || `TIDVIP ${Date.now().toString().slice(-4)}`,
        status: 'completed' as const,
        createdAt: new Date().toISOString()
      };
      db.orders.unshift(newOrder);

      if (userId) {
        const u = db.users.find((x) => x.id === userId);
        if (u) {
          if (u.role === 'student') u.role = 'vip';
          u.plan = planName || 'VIP Unlimited';
        }
      }
      writePlatformDb(db);
      return NextResponse.json({ order: newOrder });
    }

    if (action === 'createLead') {
      const { name, contact, targetBand, note } = body;
      const newLead = {
        id: `LEAD-${Date.now().toString().slice(-4)}`,
        name: String(name || 'Học viên'),
        contact: String(contact || ''),
        targetBand: String(targetBand || 'Band 7.0+'),
        note: String(note || 'Đăng ký nhận lộ trình Adaptive & Ebook 7,298 từ'),
        status: 'new' as const,
        createdAt: new Date().toISOString()
      };
      db.leads.unshift(newLead);
      writePlatformDb(db);
      return NextResponse.json({ lead: newLead });
    }

    if (action === 'updateLeadStatus') {
      const { leadId, status } = body;
      const lead = db.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.status = status;
        writePlatformDb(db);
      }
      return NextResponse.json({ ok: true });
    }

    if (action === 'addRoadmapModule') {
      const { stageId, day, titleVi, titleEn, skill, targetWords, durationMins } = body;
      const stage = db.roadmaps.find((s) => s.id === stageId);
      if (stage) {
        stage.modules.push({
          id: `mod-${Date.now().toString().slice(-4)}`,
          day: String(day || 'Tuần mới'),
          titleVi: String(titleVi || 'Bài học mới'),
          titleEn: String(titleEn || titleVi || 'New Lesson Module'),
          skill: String(skill || 'Vocabulary & FSRS'),
          targetWords: Number(targetWords) || 300,
          durationMins: Number(durationMins) || 60
        });
        writePlatformDb(db);
      }
      return NextResponse.json({ roadmaps: db.roadmaps });
    }

    if (action === 'updateSettings') {
      db.settings = { ...db.settings, ...(body.settings || {}) };
      writePlatformDb(db);
      return NextResponse.json({ settings: db.settings });
    }

    if (action === 'saveWord') {
      const { w, pos, cefr, topic, en, vi, exEn, exVi } = body;
      const cleanWord = String(w || '').trim();
      if (!cleanWord) {
        return NextResponse.json({ error: 'Word is required' }, { status: 400 });
      }
      const fullPath = path.join(process.cwd(), 'public/data/word-atlas-full.json');
      const prioPath = path.join(process.cwd(), 'public/data/word-atlas-priority.json');
      const fullList = JSON.parse(fs.readFileSync(fullPath, 'utf8')) as WordAtlasEntry[];
      const prioList = JSON.parse(fs.readFileSync(prioPath, 'utf8')) as WordAtlasEntry[];

      const updateOrInsert = (list: WordAtlasEntry[], insertIfMissing: boolean) => {
        const idx = list.findIndex((x) => x.w.toLowerCase() === cleanWord.toLowerCase());
        if (idx >= 0) {
          list[idx] = {
            ...list[idx],
            pos: pos || list[idx].pos,
            cefr: cefr || list[idx].cefr,
            topic: topic || list[idx].topic,
            en: en ?? list[idx].en,
            vi: vi ?? list[idx].vi,
            ex: exEn
              ? [{ en: exEn, vi: exVi || null }, ...(list[idx].ex.slice(1) || [])]
              : list[idx].ex
          };
          return list[idx];
        } else if (insertIfMissing) {
          const newEntry: WordAtlasEntry = {
            id: cleanWord.toLowerCase(),
            w: cleanWord,
            uk: `/${cleanWord.toLowerCase()}/`,
            us: `/${cleanWord.toLowerCase()}/`,
            pos: pos || 'n.',
            en: en || '',
            vi: vi || null,
            ex: [{ en: exEn || `The term ${cleanWord} is widely used in IELTS.`, vi: exVi || null }],
            col: [],
            fam: [],
            syn: [],
            ant: [],
            tip: null,
            cefr: cefr || 'C1',
            topic: topic || 'education',
            imgUrl: `https://raw.githubusercontent.com/designfuchen/word-atlas/main/public/atlas/img/${encodeURIComponent(cleanWord.toLowerCase())}.webp`,
            audioUkUrl: `https://raw.githubusercontent.com/designfuchen/word-atlas/main/public/atlas/audio/uk/${encodeURIComponent(cleanWord.toLowerCase())}.mp3`,
            audioUsUrl: `https://raw.githubusercontent.com/designfuchen/word-atlas/main/public/atlas/audio/us/${encodeURIComponent(cleanWord.toLowerCase())}.mp3`,
            audioExUrl: `https://raw.githubusercontent.com/designfuchen/word-atlas/main/public/atlas/audio/ex/${encodeURIComponent(cleanWord.toLowerCase())}.mp3`
          };
          list.unshift(newEntry);
          return newEntry;
        }
        return null;
      };

      const saved = updateOrInsert(fullList, true);
      updateOrInsert(prioList, true);
      try {
        fs.writeFileSync(fullPath, JSON.stringify(fullList));
        fs.writeFileSync(prioPath, JSON.stringify(prioList, null, 2));
      } catch {
        // ignore read-only fs in serverless
      }
      return NextResponse.json({ word: saved });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Admin error' },
      { status: 500 }
    );
  }
}
