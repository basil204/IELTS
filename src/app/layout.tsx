import type { Metadata } from 'next';
import { Archivo, Be_Vietnam_Pro, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap'
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'THE IELTS DICTIONARY × WORD ATLAS — Hệ Sinh Thái Từ Vựng FSRS & Luyện Thi IELTS',
  description:
    'Hệ sinh thái học IELTS toàn diện kết hợp mô hình Bento Grid của theieltsdictionary.com với 7.298 từ vựng minh họa Word-Atlas, thuật toán lặp lại ngắt quãng FSRS và kho dữ liệu luyện thi My-IELTS (22 chuyên đề, 538 từ khóa Reading, 179 nhóm Listening Paraphrase).'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${archivo.variable} ${beVietnamPro.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
