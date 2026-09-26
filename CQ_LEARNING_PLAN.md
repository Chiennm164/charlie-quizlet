# Charlie Quizlet — Frontend (Angular) Roadmap

App quản lý học tập/thi trắc nghiệm kiểu Quizlet, có auth thật, phân quyền theo vai trò (Học sinh / Giáo viên / Admin), dùng để vừa ôn lại kiến thức Angular cũ vừa học tính năng mới — đi từng bước qua tính năng thực tế, không phải bài tập demo rời rạc.

Đây là repo **frontend**. Backend là repo riêng: `charlie-quizlet-be` (Java Spring Boot + PostgreSQL) — xem roadmap BE trong repo đó.

## Hệ thống tổng quan

- **Auth**: đăng nhập/đăng xuất, session, JWT access token + refresh token
- **Phân quyền (RBAC)**: 3 role — `STUDENT`, `TEACHER`, `ADMIN`, có phê duyệt theo 1-2 cấp
- **Nghiệp vụ**: học flashcard, tạo/duyệt câu hỏi và đề thi, làm bài thi, dashboard theo role
- **Backend**: Java Spring Boot, PostgreSQL

## Môi trường Frontend

- Node.js: v22.23.2 hoặc v24.19.0 (qua `nvm`)
- Angular CLI: 22.1.8 (cài local, không cài global)
- Style: Tailwind CSS v4 + CSS thuần trong `src/styles/` (không dùng SCSS)
- Change detection: **Zoneless** — bắt buộc dùng `signal()` cho state cần render lên UI
- Test runner: **Jest** (chạy qua `npm test`, không dùng `ng test`)

## Đã hoàn thành

- [x] Tạo project Angular 22 (routing, zoneless), dùng Angular CLI bản local
- [x] Cấu hình Jest (`jest.config.js`, `setup-jest.ts` zoneless, `tsconfig.spec.json`)
- [x] Cấu trúc thư mục `core/`, `features/`, `shared/`; cấu hình tập trung ở `core/config`
- [x] API contract với BE qua Swagger / OpenAPI; model lỗi thống nhất (`errorCode`) + dialog lỗi chung
- [x] Nền tảng Angular mới: standalone, `@if/@for/@switch`, `signal()/computed()/effect()`, `inject()`, `input()/output()`
- [x] Auth: đăng ký, đăng nhập, quên / đặt lại mật khẩu, ghi nhớ đăng nhập, khôi phục phiên khi F5, `authGuard` / `guestGuard`
- [x] Interceptor: locale → auth → error → loading
- [x] Reactive Forms, custom validator (`AppValidators`), custom pipe (`translate`)
- [x] UI kit dùng chung, song ngữ vi/en, token style, animation
- [x] Unit test cho auth, guard, interceptor, util

## Lộ trình

Mỗi giai đoạn là một nhóm chức năng thật, làm lần lượt từ 1 đến 7. Dòng **Angular** ghi kiến thức luyện được khi làm giai đoạn đó.

Giai đoạn 2–4 không cần phân quyền hay phê duyệt, nên sớm có sản phẩm dùng được (lấp các thẻ "Sắp ra mắt" trên Home). Trình làm bài ở giai đoạn 4 được dùng lại cho đề thi ở giai đoạn 5.

### Giai đoạn 1 — Hoàn thiện nền tảng
- [x] Refresh token + thu hồi khi đăng xuất: access token hết hạn thì tự làm mới rồi gửi lại request
- [x] `roleGuard` + trang 403
- [x] Đăng ký có chọn vai trò; tài khoản Teacher chờ Admin duyệt (trang `/admin/users/pending`, Admin tạo sẵn lúc BE khởi động)
- [ ] Trang hồ sơ: sửa họ tên, đổi mật khẩu

**Angular:** RxJS trong interceptor (`switchMap`, `catchError`, `share`), functional guard.

### Giai đoạn 2 — Học phần (lõi kiểu Quizlet)
- [ ] Tạo / sửa / xoá học phần: tiêu đề, mô tả, công khai / riêng tư, danh sách thẻ (thuật ngữ – định nghĩa)
- [ ] Trình soạn thẻ: thêm / xoá / sắp xếp dòng (kéo-thả cần cài `@angular/cdk`), nhấn Tab ở dòng cuối tự thêm dòng mới, cảnh báo khi rời trang chưa lưu
- [ ] Import nhanh: dán văn bản `thuật ngữ<Tab>định nghĩa` mỗi dòng (copy thẳng từ Excel / Google Sheets) → xem trước → lưu
- [ ] Học phần của tôi: tìm kiếm, lọc, sắp xếp, phân trang

**Angular:** `FormArray`, custom validator (tối thiểu 2 thẻ, trùng thuật ngữ), `CanDeactivate`, tìm kiếm bằng `debounceTime` / `switchMap` so với `httpResource` (Signals vs RxJS).

### Giai đoạn 3 — Chế độ học trên học phần
- [ ] Thẻ ghi nhớ: lật thẻ (CSS 3D), phím tắt (Space lật, ←/→ chuyển thẻ), trộn thẻ, đánh dấu đã nhớ / chưa nhớ → vòng sau chỉ còn thẻ chưa nhớ
- [ ] Ôn tập ngắt quãng (Leitner hoặc SM-2 kiểu Anki): lưu tiến độ từng thẻ theo user, Home hiện "Hôm nay cần ôn N thẻ"
- [ ] Phát âm thuật ngữ bằng Web Speech API

**Angular:** custom directive (phím tắt), animation, state bằng signal.

### Giai đoạn 4 — Trình làm bài + kết quả
Xây 1 lần, dùng chung cho "Kiểm tra" tự tạo từ học phần và đề thi chính thức ở giai đoạn 5.
- [ ] Kiểm tra tự tạo: sinh câu trắc nghiệm từ học phần (đáp án nhiễu lấy từ định nghĩa của thẻ khác), đúng / sai, điền đáp án
- [ ] Hai chế độ: Luyện tập (hiện đúng / sai + giải thích ngay) và Thi thử (đếm ngược bằng `app-countdown`, trộn câu và đáp án, đánh dấu câu để xem lại, bảng số câu để nhảy nhanh)
- [ ] Tự lưu câu trả lời lên BE (F5 hay mất mạng vẫn làm tiếp), hết giờ tự nộp
- [ ] Trang kết quả: điểm, thời gian, tỉ lệ đúng, xem lại từng câu, nút "Làm lại các câu sai"

Với đề thi thật: BE không gửi đáp án đúng xuống FE trước khi nộp, chấm điểm ở BE; giờ làm bài do server quản lý (`started_at` + `deadline`), countdown ở FE chỉ để hiển thị.

**Angular:** NgRx Signal Store cho state phức tạp, `CanDeactivate` + `beforeunload` khi đang làm bài.

### Giai đoạn 5 — Ngân hàng câu hỏi, đề thi, phê duyệt (Teacher / Admin)
- [ ] Câu hỏi: một đáp án / nhiều đáp án / đúng-sai, độ khó, chủ đề dạng cây (`app-dropdown-tree`), lời giải thích
- [ ] Phê duyệt: DRAFT → PENDING → APPROVED / REJECTED (kèm lý do) → sửa → gửi duyệt lại; hàng đợi chờ duyệt + lịch sử duyệt
- [ ] Tạo đề: chọn tay từ câu đã duyệt hoặc random theo quy tắc (vd. 10 câu dễ + 5 câu khó chủ đề X), thời gian, số lần được làm, điểm đạt, khung giờ mở đề (`app-date-range-picker`)
- [ ] Import câu hỏi từ Excel (BE dùng Apache POI), có bước xem trước và báo lỗi từng dòng trước khi lưu

**Angular:** `roleGuard` cho route Teacher / Admin, form lồng nhau (câu hỏi + danh sách đáp án), table có chọn dòng.

### Giai đoạn 6 — Lớp học & giao bài
- [ ] Teacher tạo lớp, học sinh vào lớp bằng mã / link mời
- [ ] Giao học phần hoặc đề thi cho lớp, kèm hạn chót
- [ ] Bảng điểm theo học sinh + thống kê theo câu (câu sai nhiều → câu khó hoặc đáp án sai), xuất CSV

**Angular:** route lồng nhau + tham số route (`withComponentInputBinding`).

### Giai đoạn 7 — Dashboard & tiến độ
- [ ] Student: học phần đang học, thẻ cần ôn hôm nay, bài sắp hết hạn, streak, biểu đồ điểm theo thời gian, chủ đề yếu
- [ ] Teacher: câu hỏi / đề chờ duyệt, thống kê lớp
- [ ] Admin: user, tài khoản Teacher chờ duyệt, thống kê nội dung

**Angular:** `@defer` để chỉ tải thư viện biểu đồ khi cần; `ChangeDetectorRef` khi tích hợp thư viện ngoài không dùng signal.

### Để sau
- [ ] Khám phá học phần công khai, sao chép về thư viện của mình, thư mục, yêu thích
- [ ] Chế độ khách: làm bài công khai không cần đăng nhập
- [ ] Gửi email thật (SMTP) + thông báo trong app (được duyệt, có bài mới được giao)
- [ ] Thi đấu realtime kiểu Kahoot (WebSocket)
- [ ] AI tạo thẻ / câu hỏi từ một đoạn văn bản
- [ ] BE: dọn bảng `refresh_tokens` định kỳ (xoá token đã hết hạn — mỗi lần làm mới thêm 1 dòng)

## Kiến thức Angular theo giai đoạn

| Kiến thức | Luyện ở đâu |
|---|---|
| Standalone, `@if/@for/@switch`, `signal/computed/effect`, `inject()`, `input()/output()` | Đã dùng khắp app |
| Reactive Forms, custom validator, custom pipe | Đã dùng (auth, `AppValidators`, pipe `translate`) |
| Interceptor + RxJS (`switchMap`, `catchError`, `share`) | Giai đoạn 1 — refresh token |
| Route guard theo role | Giai đoạn 1 — `roleGuard` |
| `FormArray`, `CanDeactivate` | Giai đoạn 2 — trình soạn thẻ |
| `debounceTime` / `combineLatest`, so sánh Signals vs RxJS | Giai đoạn 2 — tìm kiếm, lọc |
| Custom directive | Giai đoạn 3 — phím tắt thẻ ghi nhớ |
| NgRx Signal Store | Giai đoạn 4 — trình làm bài |
| `@defer`, `ChangeDetectorRef` | Giai đoạn 7 — biểu đồ |
| Unit test (Jest) | Mọi giai đoạn: service, guard, interceptor, logic chấm điểm |

## Ghi chú kỹ thuật

- `jest-preset-angular/setup-env/zoneless` phải gọi `setupZonelessTestEnv()` thủ công vì app không dùng zone.js.
- `ng test` không hỗ trợ Jest — chạy test qua `npm test`.
- FE và BE là 2 repo riêng, cần thống nhất API contract sớm.
