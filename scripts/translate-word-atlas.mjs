/**
 * Batch AI Translation Script (Word-Atlas & My-IELTS -> Tiếng Việt)
 * Bước 1 trong quy trình Việt hóa: Đọc data/word-atlas.json và dịch nghĩa + câu ví dụ sang Tiếng Việt qua Gemini 2.5 Flash.
 * Cách chạy: GEMINI_API_KEY="your_key" npm run translate:word-atlas
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.GEMINI_API_KEY;
const SOURCE_PATH = path.resolve('public/data/word-atlas-full.json');

async function translateBatch(entries) {
  const prompt = `Dịch danh sách từ vựng IELTS sau sang tiếng Việt chuẩn học thuật. Trả về JSON array có cấu trúc [{"id": "...", "vi": "nghĩa tiếng Việt ngắn gọn, chuẩn xác", "exVi": ["dịch câu ví dụ 1", "dịch câu ví dụ 2"], "tipVi": "ghi chú cách dùng ngắn gọn"}]:\n` +
    JSON.stringify(entries.map(e => ({ id: e.id, w: e.w, pos: e.pos, en: e.en, ex: e.ex.map(x => x.en) })));

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return JSON.parse(data.candidates[0].content.parts[0].text);
}

async function main() {
  if (!API_KEY) {
    console.log('Hướng dẫn: Đặt biến môi trường GEMINI_API_KEY trước khi chạy batch dịch toàn bộ 7.298 từ.');
    console.log('Ví dụ: $env:GEMINI_API_KEY="AIza..."; npm run translate:word-atlas');
    process.exit(0);
  }
  const words = JSON.parse(fs.readFileSync(SOURCE_PATH, 'utf8'));
  const untranslated = words.filter(w => !w.vi);
  console.log(`Tổng số từ: ${words.length} | Cần dịch thêm: ${untranslated.length}`);
  const BATCH_SIZE = 40;
  for (let i = 0; i < Math.min(untranslated.length, 200); i += BATCH_SIZE) {
    const batch = untranslated.slice(i, i + BATCH_SIZE);
    console.log(`Đang dịch batch ${i} -> ${i + batch.length}...`);
    const translated = await translateBatch(batch);
    const map = new Map(translated.map(t => [t.id, t]));
    for (const w of words) {
      if (map.has(w.id)) {
        const t = map.get(w.id);
        w.vi = t.vi;
        if (Array.isArray(t.exVi)) {
          w.ex = w.ex.map((exItem, idx) => ({ ...exItem, vi: t.exVi[idx] || exItem.vi }));
        }
        if (t.tipVi) w.tip = t.tipVi;
      }
    }
    fs.writeFileSync(SOURCE_PATH, JSON.stringify(words));
  }
  console.log('Đã cập nhật file public/data/word-atlas-full.json thành công!');
}

main().catch(console.error);
