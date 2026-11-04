import fs from 'fs';
import path from 'path';
import defaultDb from '../../public/data/platform-db.json';

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  provider: 'credentials' | 'google';
  role: 'student' | 'vip' | 'admin';
  plan: string;
  targetBand: string;
  currentBand: string;
  xp: number;
  streak: number;
  completedModules: string[];
  createdAt: string;
}

export interface RoadmapModule {
  id: string;
  day: string;
  titleVi: string;
  titleEn: string;
  skill: string;
  targetWords: number;
  durationMins: number;
}

export interface RoadmapStage {
  id: string;
  code: string;
  bandRange: string;
  titleVi: string;
  titleEn: string;
  durationWeeks: number;
  access: 'Free' | 'VIP';
  modules: RoadmapModule[];
}

export interface PlatformOrder {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  amountVnd: number;
  paymentMethod: string;
  transferCode: string;
  status: 'pending' | 'completed';
  createdAt: string;
}

export interface PlatformLead {
  id: string;
  name: string;
  contact: string;
  targetBand: string;
  note: string;
  status: 'new' | 'contacted';
  createdAt: string;
}

export interface PlatformSettings {
  siteName: string;
  defaultLang: 'vi' | 'en';
  googleOAuthEnabled: boolean;
  googleClientId: string;
  vietQrBankId: string;
  vietQrAccountNo: string;
  vietQrAccountName: string;
  r2CdnBaseUrl: string;
  proPriceVnd: number;
  vipPriceVnd: number;
}

export interface PlatformDb {
  users: PlatformUser[];
  roadmaps: RoadmapStage[];
  orders: PlatformOrder[];
  leads: PlatformLead[];
  settings: PlatformSettings;
}

let inMemoryDb: PlatformDb | null = null;

export function readPlatformDb(): PlatformDb {
  if (!inMemoryDb) {
    try {
      const DB_PATH = path.join(process.cwd(), 'public/data/platform-db.json');
      if (fs.existsSync(DB_PATH)) {
        inMemoryDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      } else {
        inMemoryDb = JSON.parse(JSON.stringify(defaultDb));
      }
    } catch {
      inMemoryDb = JSON.parse(JSON.stringify(defaultDb));
    }
  }
  return inMemoryDb!;
}

export function writePlatformDb(db: PlatformDb): void {
  inMemoryDb = db;
  try {
    const DB_PATH = path.join(process.cwd(), 'public/data/platform-db.json');
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch {
    // Graceful fallback for serverless read-only runtime
  }
}
