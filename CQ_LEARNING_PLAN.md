# Charlie Quizlet — Frontend (Angular) Roadmap

App quản lý học tập/thi trắc nghiệm kiểu Quizlet, có auth thật, phân quyền theo vai trò (Học sinh / Admin), dùng để vừa ôn lại kiến thức Angular cũ vừa học tính năng mới — đi từng bước qua tính năng thực tế, không phải bài tập demo rời rạc.

Đây là repo **frontend**. Backend là repo riêng: `charlie-quizlet-be` (Java Spring Boot + PostgreSQL) — xem roadmap BE trong repo đó.

## Hệ thống tổng quan

- **Auth**: đăng nhập/đăng xuất, session, JWT access token + refresh token
- **Phân quyền (RBAC)**: 2 role — `STUDENT` (làm bài), `ADMIN` (soạn đề, chủ đề). Xuất bản đề = đã duyệt
- **Nghiệp vụ** (mục tiêu chính): Admin soạn bộ đề trắc nghiệm theo chủ đề, mọi người làm bài để ôn tập, xem kết quả
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

Mục tiêu duy nhất: **bộ đề trắc nghiệm để ôn tập** (giai đoạn 4–5). Học phần + thẻ ghi nhớ (giai đoạn 2–3) đã gỡ.

### Giai đoạn 1 — Hoàn thiện nền tảng
- [x] Refresh token + thu hồi khi đăng xuất: access token hết hạn thì tự làm mới rồi gửi lại request
- [x] `roleGuard` + trang 403
- [x] ~~Đăng ký chọn vai trò, Teacher chờ duyệt~~ — đã bỏ role Teacher (2026-09-27): đăng ký luôn là học sinh, Admin tạo sẵn lúc BE khởi động
- [x] Dialog tài khoản ở header: sửa họ tên, đổi mật khẩu (đổi xong đăng xuất các thiết bị khác, thiết bị hiện tại nhận phiên mới)

**Angular:** RxJS trong interceptor (`switchMap`, `catchError`, `share`), functional guard.

### ~~Giai đoạn 2–3 — Học phần, thẻ ghi nhớ~~ (đã gỡ)
Đã làm rồi gỡ bỏ (2026-09-27): app chỉ tập trung vào bài trắc nghiệm. Code cũ còn trong lịch sử git. Giữ lại phần dùng chung:
`ConfirmDialogService`, `unsavedChangesGuard`, directive `appShortcut`, `app-pagination`, validator cho FormArray, `@angular/cdk` (kéo thả).

### Giai đoạn 4 — Bộ đề trắc nghiệm theo chủ đề (Admin soạn)
Chỉ `ADMIN` tạo / sửa đề và chủ đề; xuất bản = đã duyệt, học sinh thấy.
- [x] BE: chủ đề (danh sách phẳng) + bộ đề (thời gian, nháp / xuất bản) + câu hỏi trắc nghiệm (2–6 đáp án, 1 đáp án đúng, giải thích)
- [x] Home học sinh: bộ đề đã xuất bản nhóm theo chủ đề; trang tìm bộ đề (lọc chủ đề, tìm kiếm, phân trang); trang bộ đề
- [ ] Admin: quản lý chủ đề (thêm / đổi tên / xoá chủ đề trống)
- [ ] Admin: danh sách mọi bộ đề (cả nháp) + trình soạn đề (form lồng nhau câu hỏi → đáp án, chọn đáp án đúng, kéo thả sắp xếp câu, cảnh báo rời trang khi chưa lưu)
- [ ] Import câu hỏi nhanh từ Excel / văn bản dán vào, xem trước và báo lỗi từng dòng

**Angular:** `roleGuard('ADMIN')`, `FormArray` lồng nhau, custom validator (đúng 1 đáp án đúng), kéo thả bằng `@angular/cdk`.

### Giai đoạn 5 — Làm bài + kết quả
- [ ] Hai chế độ: Luyện tập (hiện đúng / sai + giải thích ngay sau mỗi câu) và Thi thử (đếm ngược bằng `app-countdown`, trộn câu và đáp án, đánh dấu câu để xem lại, bảng số câu để nhảy nhanh, hết giờ tự nộp)
- [ ] BE chấm điểm: không gửi đáp án đúng xuống FE trước khi nộp; giờ làm bài do server quản lý (`started_at` + `deadline`), countdown ở FE chỉ để hiển thị
- [ ] Tự lưu câu trả lời lên BE (F5 hay mất mạng vẫn làm tiếp)
- [ ] Trang kết quả: điểm, thời gian, tỉ lệ đúng, xem lại từng câu kèm giải thích, nút "Làm lại các câu sai"; lịch sử các lần làm
- [ ] Admin xem thống kê đề: số lượt làm, điểm trung bình, câu sai nhiều nhất

**Angular:** NgRx Signal Store cho state phức tạp của bài làm, `CanDeactivate` + `beforeunload` khi đang làm bài.

### Giai đoạn 6 — Lớp học & giao bài
- [ ] Admin tạo lớp, học sinh vào lớp bằng mã / link mời
- [ ] Giao bộ đề cho lớp, kèm hạn chót
- [ ] Bảng điểm theo học sinh + thống kê theo câu (câu sai nhiều → câu khó hoặc đáp án sai), xuất CSV

**Angular:** route lồng nhau + tham số route (`withComponentInputBinding`).

### Giai đoạn 7 — Dashboard & tiến độ
- [ ] Student: bộ đề đã làm, bài sắp hết hạn, streak, biểu đồ điểm theo thời gian, chủ đề yếu
- [ ] Admin: user, thống kê nội dung

**Angular:** `@defer` để chỉ tải thư viện biểu đồ khi cần; `ChangeDetectorRef` khi tích hợp thư viện ngoài không dùng signal.

### Để sau
- [ ] Khám phá bộ đề theo chủ đề, yêu thích
- [ ] Chế độ khách: làm bài công khai không cần đăng nhập
- [ ] Gửi email thật (SMTP) + thông báo trong app (có bài mới được giao)
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
| `CanDeactivate` | Giai đoạn 4 — trình soạn đề |
| `debounceTime` / `combineLatest`, so sánh Signals vs RxJS | Giai đoạn 4 — tìm kiếm, lọc bộ đề |
| Custom directive | Giai đoạn 5 — phím tắt khi làm bài (`appShortcut`) |
| `FormArray` lồng nhau (câu hỏi → đáp án) | Giai đoạn 4 — trình soạn đề |
| NgRx Signal Store | Giai đoạn 5 — trình làm bài |
| `@defer`, `ChangeDetectorRef` | Giai đoạn 7 — biểu đồ |
| Unit test (Jest) | Mọi giai đoạn: service, guard, interceptor, logic chấm điểm |

## Ghi chú kỹ thuật

- `jest-preset-angular/setup-env/zoneless` phải gọi `setupZonelessTestEnv()` thủ công vì app không dùng zone.js.
- `ng test` không hỗ trợ Jest — chạy test qua `npm test`.
- FE và BE là 2 repo riêng, cần thống nhất API contract sớm.
