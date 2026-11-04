# IELTS

**THE IELTS DICTIONARY × WORD ATLAS** — Hệ sinh thái EdTech luyện thi IELTS thương mại song ngữ **Tiếng Việt (`VI`) & Tiếng Anh (`EN`)**, kết hợp thiết kế **International Concourse Wayfinding & Split-Flap Bento Grid**, thuật toán lặp lại ngắt quãng **FSRS (`ts-fsrs`)**, và toàn bộ kho dữ liệu lớn (Big Data) chuẩn hóa lưu trữ trực tiếp trong dự án (`public/data/`).

---

## 1. Kho Dữ Liệu Lớn (Big Data Datasets — 100% Song Ngữ Anh-Việt, 0 Ký Tự Tiếng Trung)

Toàn bộ dữ liệu từ vựng, câu ví dụ, collocations, phân loại CEFR và bài tập thực chiến đã được chuẩn hóa sang **Tiếng Việt & Tiếng Anh** và đóng gói sẵn trong thư mục [`public/data/`](./public/data):

1. **`public/data/word-atlas-full.json` (7,298 Từ vựng IELTS — Word-Atlas CC BY 4.0):**
   - Phân loại theo **6 cấp độ CEFR (`A1` – `C2`)** và **19 nhóm chủ đề IELTS** (`Technology`, `Environment`, `Education`, `Health`, `Economy`, `Law`, `Science`...).
   - **14,596 câu ví dụ ngữ cảnh IELTS**, collocations, từ loại (`POS`), phiên âm IPA Anh-Anh (`UK`) & Anh-Mỹ (`US`).
   - Kết nối trực tiếp tới **7,298 hình ảnh minh họa ngữ cảnh WebP** và **22,905 file âm thanh phát âm ElevenLabs (UK / US / Example Audio)**.
2. **`public/data/my-ielts-chapters.json` (22 Chuyên đề Từ vựng IELTS Chân Kinh — 3,674 Từ):**
   - Toàn bộ 22 chương chủ đề thực chiến (`Natural Geography`, `Plant Research`, `Animal Protection`, `Space Exploration`, `School Education`, `Technology Inventions`, `Social Trends`...) gồm **3,674 mục từ** kèm nghĩa Anh-Việt, từ đồng nghĩa và phát âm chuẩn.
3. **`public/data/my-ielts-reading538.json` (538 Từ Khóa Trọng Tâm IELTS Reading):**
   - Chia thành 3 cấp độ xác suất xuất hiện trong bài đọc IELTS thật (`CRITICAL 90%`, `HIGH 60%`, `CORE 30%`) kèm chuỗi từ đồng nghĩa & paraphrase.
4. **`public/data/my-ielts-listening179.json` (179 Nhóm Paraphrase IELTS Listening Cốt Lõi):**
   - Cặp đối chiếu trực tiếp giữa từ khóa trong câu hỏi (`Question Keyword`) và cách diễn đạt đồng nghĩa trong băng nghe (`Audio Transcript Paraphrase`).
5. **`public/data/my-ielts-writing100.json` (100 Cấu Trúc Câu IELTS Writing Task 2):**
   - Đối chiếu câu viết Band 6.5 thông thường và câu nâng cấp học thuật **Band 7.5+**, phân loại theo 15 nhóm ngữ pháp & chức năng lập luận song ngữ Việt-Anh.
6. **`public/data/platform-db.json` (Cơ sở dữ liệu thương mại):**
   - Lưu trữ tài khoản người dùng, phân quyền (`Admin` / `Student`), gói cước (`FREE` / `VIP_PRO` / `VIP_LIFETIME`), lộ trình 12 tuần, đơn hàng VietQR và danh sách khách hàng tiềm năng (Leads CRM).

---

## 2. Các Phân Khu Chức Năng Thương Mại (Commercial Modules)

| Phân khu | Đường dẫn (Route) | Mô tả tính năng |
| :--- | :--- | :--- |
| **Trang chủ Bento Concourse & Trạm FSRS** | `/` | Giao diện Bento Grid 6 phân khu (`01 Lộ trình` → `06 Phòng thi`), học từ vựng đa giác quan (`See & Hear`, `Recall Cloze`, `Dictation`), bảng xếp hạng đua Top VIP, chuyển đổi ngôn ngữ `VI / EN`. |
| **Đăng nhập / Đăng ký & Google OAuth 2.0** | `/login` | Đăng nhập, đăng ký tài khoản học viên mới, tích hợp **Sign in with Google OAuth 2.0** và đăng nhập nhanh 1-chạm (Demo Admin / VIP / Student). |
| **Lộ trình Học Thích Ứng 12 Tuần & Placement Test** | `/roadmap` | Bài kiểm tra đầu vào nhanh (Placement Test) và lộ trình 4 chặng (`Band 4.0 → 5.5 → 6.5 → 7.5 → 8.0+`) cho phép đánh dấu hoàn thành từng tuần học. |
| **Nâng cấp Tài khoản VIP & Thanh toán VietQR** | `/pricing` | Bảng giá thương mại (`FREE`, `VIP PRO 6 Tháng`, `VIP LIFETIME`), tạo mã **VietQR tự động** kèm nội dung chuyển khoản định danh và kích hoạt gói VIP tức thì. |
| **Trung tâm Quản trị Admin CMS** | `/admin` | 5 phân hệ quản trị: Tổng quan doanh thu & người dùng, Quản lý & sửa trực tiếp kho 7,298 từ vựng, Quản lý lộ trình 12 tuần, Quản lý User & cấp quyền VIP/Admin, Quản lý Đơn hàng VietQR & Leads CRM. |

---

## 3. Tài Khoản Demo Cài Đặt Sẵn

Bạn có thể truy cập `/login` và nhấn nút đăng nhập 1-chạm hoặc nhập thông tin sau:

- **Quản trị viên (Admin CMS + VIP Lifetime):**
  - Email: `admin@theieltsdictionary.vn`
  - Mật khẩu: `Admin@123`
- **Học viên VIP (Google OAuth + VIP Pro):**
  - Email: `minhanh.ielts@gmail.com`
  - Mật khẩu: `User@123`
- **Học viên Miễn phí (Free Tier):**
  - Email: `hoangnam@gmail.com`
  - Mật khẩu: `User@123`

---

## 4. Hướng Dẫn Cài Đặt & Chạy Dự Án

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy môi trường phát triển (Development)
npm run dev

# 3. Build bản thương mại (Production)
npm run build
npm run start
```

---

## 5. Giấy Phép & Nguồn Dữ Liệu Mở (Attributions)

- **Word Atlas Dataset & Media:** Dựa trên dự án mã nguồn mở [`designfuchen/word-atlas`](https://github.com/designfuchen/word-atlas) (Code: MIT License, Dataset & Media: CC BY 4.0).
- **My-IELTS Corpus:** Dựa trên kho dữ liệu luyện thi [`hefengxian/my-ielts`](https://github.com/hefengxian/my-ielts), đã được chuẩn hóa và biên dịch song ngữ Anh-Việt.
