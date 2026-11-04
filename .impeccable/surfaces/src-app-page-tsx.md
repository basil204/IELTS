---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/login/page.tsx","src/app/roadmap/page.tsx","src/app/pricing/page.tsx","src/app/admin/page.tsx"]
---

# Surface Brief — YouPass 4.0 × Word Atlas Full 7-Zone IELTS Dashboard & User Profile

## Mode

operate

## Scope

Toàn bộ hệ thống Dashboard học tập IELTS thương mại (`src/app/page.tsx`, `/login`, `/roadmap`, `/pricing`, `/admin`) theo ngôn ngữ **Sky-Cerulean & Pure Porcelain White 4.0 (Xanh Nhạt & Trắng Tinh Khiết)** kết hợp chuẩn thiết kế **Dashboard Designer & Magic UI**: giao diện cực kỳ trực quan, ít chữ, dễ dùng cho người không rành công nghệ, tách bạch rõ ràng 7 phân khu độc lập trên thanh Sidebar (`Tổng Quan`, `Học Từ Vựng`, `Học Nghe`, `Học Nói`, `Học Đọc`, `Học Viết`, `Hồ Sơ Cá Nhân`).

## Audience & Task

Học viên IELTS mọi lứa tuổi (kể cả người không am hiểu công nghệ) cần một giao diện sáng sủa, ít chữ, nhìn vào biết bấm đâu ngay:
- Khi chưa đăng nhập: Landing Page gọn gàng, trực quan với thẻ Đăng nhập 1-chạm.
- Khi đã đăng nhập: Vào **Dashboard đầy đủ có Sidebar trái cố định** chia tách rành mạch từng kỹ năng: bấm **Học Từ Vựng** ra khu vực Từ Vựng hình ảnh, bấm **Học Nghe** ra phòng Nghe & Chép chính tả, bấm **Học Nói** ra phòng luyện Speaking có thu âm & chấm điểm, bấm **Học Đọc** ra bài Đọc tra từ 1-chạm, bấm **Học Viết** ra phòng luyện Writing AI sửa bài, và bấm **Hồ Sơ Cá Nhân** ra trang quản lý Profile, mục tiêu Band và Sổ từ vựng.

## Direction contract

THESIS: Xây dựng một Dashboard Học Tập IELTS Đầy Đủ 7 Phân Khu (Overview, Vocabulary, Listening, Speaking, Reading, Writing, User Profile) theo chuẩn Dashboard Designer trên tông Xanh Nhạt & Trắng Tinh Khiết 4.0, lược bỏ hoàn toàn các đoạn văn giải thích dài dòng để người không rành công nghệ cũng thao tác được ngay chỉ bằng 1 cú nhấp chuột.

OWN-WORLD: Nền trắng xanh băng dịu mắt (`#F8FBFF`) kết hợp Sidebar & thẻ mô-đun trắng sứ (`#FFFFFF`), các vùng chọn xanh da trời nhạt (`#F0F7FF` và `#E0F2FE`), đường kẻ phân tách mảnh xanh lam nhạt (`#DCEBFA` / `#BAE6FD`), màu hành động chính Xanh Dương Thương Mại (`#0284C7` hover `#0369A1`), xanh ngọc lục bảo hoàn thành (`#059669`), cam hổ phách điểm nhấn (`#D97706`), và mực chữ xanh navy học thuật sâu (`#0F172A` chính, `#334155` phụ, `#64748B` nhãn); kết hợp bộ ba phông chữ `Archivo`, `Be Vietnam Pro` và `JetBrains Mono` (`tabular-nums`).

STORY: Học viên đăng nhập xong bước vào Dashboard có thanh menu dọc bên trái gồm 7 mục rõ ràng kèm thẻ tóm tắt Hồ sơ học viên; từ màn hình Tổng quan (gồm 4 chỉ số tiến độ trực quan, lộ trình 4 chặng và 6 ô lối tắt kỹ năng), học viên bấm chọn kỹ năng nào sẽ mở riêng khu vực thực hành chuyên biệt của kỹ năng đó (Từ Vựng, Nghe, Nói, Đọc, Viết hoặc Hồ Sơ Cá Nhân) mà không bị lẫn lộn với các phần khác.

FIRST VIEWPORT: Ở trạng thái đã đăng nhập, khung hình đầu tiên là bố cục App Dashboard chuẩn: cột Sidebar bên trái (`260px`) chứa thông tin tóm tắt User Profile (Avatar, Tên, Band mục tiêu) và 7 nút điều hướng lớn (`Tổng Quan`, `Học Từ Vựng`, `Học Nghe`, `Học Nói`, `Học Đọc`, `Học Viết`, `Hồ Sơ Cá Nhân`); phần nội dung chính bên phải hiển thị 4 thẻ KPI tiến độ ngắn gọn, thanh Lộ trình 4 Chặng và 6 thẻ Kỹ năng trực quan để bấm vào học ngay.

FORM: Candidate 4 — Sky-Cerulean & Pure Porcelain Commercial EdTech 4.0 Dashboard Studio (YouPass.vn × Dashboard Designer Progressive Workbench; raised by `broadcast-programming-teletext-service` instant REVEAL toggle for self-testing and `pop-culture-shelf-cassette-futurism-deck` tactile audio/mic controls); `seed:8c232388ece6448c`.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
