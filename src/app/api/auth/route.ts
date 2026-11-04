import { NextRequest, NextResponse } from 'next/server';
import { readPlatformDb, writePlatformDb, type PlatformUser } from '@/lib/db';

function sanitizeUser(u: PlatformUser) {
  const { passwordHash: _omitted, ...safe } = u;
  void _omitted;
  return safe;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    const db = readPlatformDb();

    if (action === 'login') {
      const { email, password } = body;
      const found = db.users.find(
        (u) =>
          u.email.toLowerCase() === String(email || '').trim().toLowerCase() &&
          u.passwordHash === password
      );
      if (!found) {
        return NextResponse.json(
          { error: 'Email hoặc mật khẩu không chính xác / Invalid credentials.' },
          { status: 401 }
        );
      }
      return NextResponse.json({ user: sanitizeUser(found) });
    }

    if (action === 'register') {
      const { name, email, password, targetBand } = body;
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (!cleanEmail || !password || !name) {
        return NextResponse.json(
          { error: 'Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu.' },
          { status: 400 }
        );
      }
      const exists = db.users.some((u) => u.email.toLowerCase() === cleanEmail);
      if (exists) {
        return NextResponse.json(
          { error: 'Email này đã được đăng ký. Vui lòng đăng nhập.' },
          { status: 409 }
        );
      }
      const newUser: PlatformUser = {
        id: `usr-${Date.now()}`,
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash: String(password),
        provider: 'credentials',
        role: 'student',
        plan: 'Free',
        targetBand: targetBand || '7.0',
        currentBand: '5.0',
        xp: 100,
        streak: 1,
        completedModules: [],
        createdAt: new Date().toISOString()
      };
      db.users.unshift(newUser);
      writePlatformDb(db);
      return NextResponse.json({ user: sanitizeUser(newUser) });
    }

    if (action === 'google') {
      const { email, name } = body;
      const cleanEmail = String(email || 'google.learner@gmail.com')
        .trim()
        .toLowerCase();
      let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (!user) {
        user = {
          id: `usr-google-${Date.now()}`,
          name: String(name || 'Google Learner'),
          email: cleanEmail,
          passwordHash: 'google-oauth-token',
          provider: 'google',
          role: 'student',
          plan: 'Free',
          targetBand: '7.5',
          currentBand: '5.5',
          xp: 250,
          streak: 3,
          completedModules: ['mod-101'],
          createdAt: new Date().toISOString()
        };
        db.users.unshift(user);
        writePlatformDb(db);
      }
      return NextResponse.json({ user: sanitizeUser(user) });
    }

    if (action === 'progress') {
      const { userId, moduleId, xpDelta, targetBand, currentBand } = body;
      const user = db.users.find((u) => u.id === userId);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (moduleId) {
        if (user.completedModules.includes(moduleId)) {
          user.completedModules = user.completedModules.filter((m) => m !== moduleId);
        } else {
          user.completedModules.push(moduleId);
          user.xp += 50;
        }
      }
      if (typeof xpDelta === 'number') {
        user.xp += xpDelta;
      }
      if (targetBand) user.targetBand = targetBand;
      if (currentBand) user.currentBand = currentBand;
      writePlatformDb(db);
      return NextResponse.json({ user: sanitizeUser(user) });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Server error' },
      { status: 500 }
    );
  }
}
