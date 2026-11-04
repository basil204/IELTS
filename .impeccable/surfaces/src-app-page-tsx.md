---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/login/page.tsx","src/app/roadmap/page.tsx","src/app/pricing/page.tsx","src/app/admin/page.tsx"]
---

# Surface Brief — YouPass 4.0 × Word Atlas Magic UI Landing Page & Progressive Step-by-Step Learning Path

## Mode

persuade

## Scope

Toàn bộ hệ sinh thái EdTech luyện thi IELTS thương mại (`src/app/page.tsx`, `/login`, `/roadmap`, `/pricing`, `/admin`) theo ngôn ngữ **Sky-Cerulean & Pure Porcelain White 4.0 (Xanh Nhạt & Trắng Tinh Khiết)** kết hợp bộ chuyển động **Magic UI (`BlurFade`, `NumberTicker`, `BorderBeam`, `Marquee`, `AnimatedRoadmapBeam`)**: tách biệt hoàn toàn giữa **Landing Page Đăng Nhập thương mại thoáng đãng** và **Không Gian Học Theo Lộ Trình Từng Bước (Progressive 5-Step Workspace)** sau khi đăng nhập, mỗi thời điểm chỉ hiển thị duy nhất 1 bước đang học.

## Audience & Task

Học viên IELTS Việt Nam cần một Landing Page sáng sủa, chuyên nghiệp, có khung Đăng Nhập 1-chạm ngay trên Hero; ngay khi đăng nhập sẽ được dẫn dắt đi từ từ qua 5 bước rõ ràng (`Bước 01: Chọn Chặng & Bài Học 12 Từ` → `Bước 02: Học Từ Vựng FSRS Bài Đang Chọn` → `Bước 03: Luyện Nghe Chép & Paraphrase` → `Bước 04: Phòng Thi 4 Kỹ Năng` → `Bước 05: Từ Điển & Sổ Từ Vựng Cá Nhân`), tuyệt đối không đổ tràn toàn bộ dữ liệu trên cùng một màn hình.

## Direction contract

THESIS: Tách biệt rõ ràng giữa Landing Page Đăng Nhập thương mại Magic UI và Không Gian Học Từng Bước (Progressive Step-by-Step Learning Workspace) tông Xanh Nhạt & Trắng Tinh Khiết 4.0, loại bỏ việc hiển thị chồng chất toàn bộ 10.972 từ vựng trên một trang để dẫn dắt học viên đi tuần tự qua từng bài học nhỏ 12 từ mỗi ngày.

OWN-WORLD: Nền trắng xanh băng dịu mắt (`#F8FBFF`) kết hợp bề mặt mô-đun trắng sứ (`#FFFFFF`), các vùng nhấn xanh da trời nhạt (`#F0F7FF` và `#E0F2FE`), đường kẻ phân tách mảnh xanh lam nhạt (`#DCEBFA` / `#BAE6FD`), màu hành động chính Xanh Dương Thương Mại (`#0284C7` hover `#0369A1`), xanh ngọc lục bảo xác nhận (`#059669`), cam hổ phách điểm nhấn (`#D97706`), và mực chữ xanh navy học thuật sâu (`#0F172A` chính, `#334155` phụ, `#64748B` nhãn); kết hợp bộ ba phông chữ `Archivo` (tiêu đề hiện đại), `Be Vietnam Pro` (văn bản song ngữ Việt–Anh) và `JetBrains Mono` (phiên âm IPA, tiến độ bài học, chỉ số FSRS `tabular-nums`).

STORY: Khi truy cập lần đầu, người dùng thấy một Landing Page thương mại thoáng đãng giới thiệu sơ đồ 4 chặng lộ trình (`AnimatedRoadmapBeam`), bộ đếm `NumberTicker`, băng chuyền `Marquee` học viên điểm cao và thẻ Đăng Nhập Nhanh viền `BorderBeam`; ngay khi bấm đăng nhập, giao diện chuyển mượt mà (`BlurFade`) vào Không Gian Học 5 Bước — mở đầu tại `Bước 01` để chọn chặng Band và bài học 12 từ trong ngày, bấm vào bài học mới chuyển sang `Bước 02` học từng thẻ Flashcard FSRS, sau đó lần lượt sang `Bước 03` Nghe chép và `Bước 04` Phòng thi 4 kỹ năng.

FIRST VIEWPORT: Ở trạng thái khách (Landing Page), khung hình đầu tiên gồm Header trắng sứ (`#FFFFFF`) và Hero 12 cột thoáng đãng: 7 cột trái trình bày thông điệp học IELTS từng bước từ Band 4.0 lên 8.0+ cùng 4 ô `NumberTicker` và sơ đồ `AnimatedRoadmapBeam` 4 chặng, 5 cột phải là Thẻ Đăng Nhập / Đăng Ký Nhanh có hiệu ứng `BorderBeam` (Google OAuth 1-chạm, Học viên VIP 1-chạm hoặc Email); ở trạng thái Đã Đăng Nhập, khung hình đầu tiên hiển thị Thanh Điều Hướng 5 Bước Tuần Tự (`BƯỚC 01` → `BƯỚC 05`) và chỉ hiển thị duy nhất nội dung của bước đang mở.

FORM: Candidate 4 — Sky-Cerulean & Pure Porcelain Commercial EdTech 4.0 Studio with Magic UI Motion Architecture (YouPass.vn × Cambridge Digital Progressive Learning Path; raised by `broadcast-programming-teletext-service` instant REVEAL toggle for self-testing and `pop-culture-shelf-cassette-futurism-deck` tactile audio deck controls); `seed:8c232388ece6448c`.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
