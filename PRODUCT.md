# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + Framer Motion

## Users

Học viên luyện thi IELTS tại Việt Nam (từ mất gốc/Band 4.0 đến mục tiêu 6.5–8.0+) cần một nền tảng học từ vựng trực quan, ôn tập hàng ngày có lộ trình thông minh ("Hôm nay học gì") và luyện đề thi 4 kỹ năng chuẩn giao diện máy tính, kết hợp động lực học tập qua cơ chế đua Top (Gamification).

## Product Purpose

Xây dựng hệ sinh thái EdTech luyện thi IELTS toàn diện lấy cảm hứng từ mô hình theieltsdictionary.com (TID) kết hợp kho học liệu & thuật toán của Word-Atlas:
- Thu hút và dẫn dắt người học qua Trang chủ Bento Grid Scrollytelling trực quan (01 Lộ trình, 02 Hôm nay học gì, 03 Kho từ vựng & Khóa học, 04 Đua Top săn VIP).
- Giúp người học làm chủ từ vựng IELTS (CEFR A1–C2, 19 chủ đề) bằng phương pháp đa giác quan: See & Hear (hình ảnh ngữ cảnh + phát âm UK/US + câu ví dụ), Recall (trắc nghiệm, Illustrated Cloze điền từ vào câu khuyết, Spelling/Dictation nghe chép chính tả) và Review theo thuật toán lặp lại ngắt quãng FSRS (Free Spaced Repetition Scheduler).
- Mở rộng sang phòng thi 4 kỹ năng (Listening, Reading, Speaking, Writing), bảng xếp hạng đua Top chuyên cần nhận VIP và phễu thu thập học viên (Lead Generation).

## Positioning

Sự kết hợp giữa thiết kế Bento Grid biên tập kiểu tạp chí số (Editorial EdTech như TID) với công cụ học từ vựng học thuật sâu sắc của Word-Atlas (bản đồ chủ đề từ vựng, học qua ngữ cảnh hình ảnh + âm thanh UK/US, luyện gõ chính tả Listening Dictation và lịch ôn tập FSRS tự động tính độ nhớ/quên thực tế thay vì lịch cố định).

## Operating Context

- Người học truy cập hàng ngày trên trình duyệt máy tính hoặc điện thoại để kiểm tra mục "Hôm nay học gì" (Daily FSRS Queue & Streak), học từ mới theo chủ đề IELTS, làm bài kiểm tra trí nhớ (Recall/Cloze/Dictation) và theo dõi thứ hạng trên Bảng xếp hạng tuần/tháng.
- Giai đoạn đầu tập trung vào:
  1. Trang chủ Bento Grid Scrollytelling (Persuade + cổng vào học thử trực tiếp).
  2. Phân khu Học từ vựng & "Hôm nay học gì" theo mô hình Word-Atlas (See & Hear, Recall Cloze/Dictation, FSRS Review, khám phá 19 chủ đề IELTS & cấp độ CEFR).

## Capabilities and Constraints

- Tích hợp Kho dữ liệu lớn (Big Data) thực tế từ 2 nguồn mã nguồn mở:
  1. **Word-Atlas (`designfuchen/word-atlas` — CC BY 4.0):** Toàn bộ **7.298 từ vựng IELTS** phân loại theo 19 chủ đề và 6 cấp độ CEFR (A1–C2), **14.596 câu ví dụ ngữ cảnh**, collocations, word family, kết nối trực tiếp tới **7.298 ảnh minh họa WebP** và **22.905 file âm thanh ElevenLabs (UK/US/Example)**.
  2. **My-IELTS (`hefengxian/my-ielts`):** Kho dữ liệu luyện thi thực chiến gồm **22 chuyên đề Từ vựng IELTS Chân Kinh (3.574 từ / 979 nhóm)**, **538 Từ khóa Trọng tâm IELTS Reading** (chia 3 cấp xác suất ra thi 90% / 60% / 30%), **179 Nhóm Paraphrase IELTS Listening cốt lõi**, và **100 Cấu trúc câu IELTS Writing Task 2**.
- Lưu trữ tiến độ học tập với thuật toán lặp lại ngắt quãng **FSRS (`ts-fsrs`)** (chuỗi ngày học Streak, trạng thái thẻ New / Learning / Review / Relearning, độ ổn định Stability & độ khó Difficulty, điểm XP đua Top).
- Kèm theo công cụ script dịch tự động hàng loạt sang Tiếng Việt (`scripts/translate-word-atlas.mjs`) kết hợp từ điển song ngữ Anh-Việt tích hợp sẵn cho các mục trọng tâm.

## Brand Commitments

- Phong cách chủ đạo: Bento Grid hiện đại kết hợp Scrollytelling theo ngôn ngữ **International Concourse Wayfinding & Split-Flap Bento**, đánh số phân khu rõ ràng (`01`, `02`, `03`, `04`...) giúp người dùng nắm bắt toàn bộ hệ sinh thái trong 5 giây đầu tiên.
- Ngôn ngữ giao diện: Tiếng Việt kết hợp thuật ngữ học thuật IELTS tiếng Anh chuẩn xác.

## Evidence on Hand

- Đã tích hợp dữ liệu thật từ `designfuchen/word-atlas` (7.298 từ vựng, 14.596 ví dụ, 19 chủ đề) và `hefengxian/my-ielts` (22 chuyên đề từ vựng 3.574 từ, 538 từ khóa Reading, 179 nhóm Paraphrase Listening, 100 câu Writing).
- Chưa có dữ liệu học viên thật, bảng điểm thật hay chứng nhận pháp lý đơn vị chủ quản. Không tự bịa thông tin pháp nhân, số liệu học viên ảo hay chứng chỉ giả; các khu vực Bảng xếp hạng / Hall of Fame cần gắn nhãn rõ ràng là dữ liệu mô phỏng (Synthetic Demo Leaderboard).

## Product Principles

1. **Vào việc ngay trong 5 giây:** Trang chủ Bento Grid không nhồi nhét văn bản quảng cáo sáo rỗng mà đóng vai trò bản đồ điều hướng sống động, cho phép chạm vào học thử ngay lập tức.
2. **Học từ vựng trong ngữ cảnh IELTS thực chiến:** Mỗi từ vựng luôn gắn liền với chủ đề IELTS, collocations, câu ví dụ học thuật, âm thanh UK/US và bài tập truy xuất trí nhớ chủ động (Cloze & Dictation).
3. **Khoa học nhận thức dẫn dắt lộ trình hàng ngày:** Mục "Hôm nay học gì" vận hành dựa trên thuật toán FSRS thực thụ, hiển thị rõ trạng thái trí nhớ và tải lượng ôn tập mỗi ngày.
4. **Động lực bền vững qua Gamification minh bạch:** Điểm chuyên cần, Streak và Bảng xếp hạng gắn liền với hành vi học thực chất (hoàn thành phiên FSRS, trả lời đúng lần đầu).
