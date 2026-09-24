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
- Style: SCSS
- Change detection: **Zoneless** — bắt buộc dùng `signal()` cho state cần render lên UI
- Test runner: **Jest** (chạy qua `npm test`, không dùng `ng test`)

## Đã hoàn thành

- [x] Tạo project Angular 22 (SCSS, routing, zoneless)
- [x] Gỡ Angular CLI global, dùng bản local
- [x] Cấu hình Jest (`jest.config.js`, `setup-jest.ts` zoneless, `tsconfig.spec.json`)

## Lộ trình

### Giai đoạn 0 — Chuẩn bị
- [ ] Thống nhất API contract với BE
- [ ] Dựng cấu trúc thư mục domain (`core/`, `features/`, `shared/`)

### Giai đoạn 1 — Nền tảng Angular & tính năng mới
- [ ] Standalone components, control flow `@if/@for/@switch`
- [ ] `signal()`, `computed()`, `effect()`
- [ ] `inject()`
- [ ] `input()`/`output()` kiểu mới so với `@Input()/@Output()` cũ

### Giai đoạn 2 — Authentication & Authorization
- [ ] Đăng nhập/đăng xuất, lưu access + refresh token
- [ ] Interceptor tự gắn token & tự refresh khi hết hạn
- [ ] Route Guard phân quyền theo role

### Giai đoạn 3 — Form & Validation
- [ ] Reactive Forms
- [ ] Custom Validator
- [ ] Custom Pipe
- [ ] Custom Directive

### Giai đoạn 4 — RxJS & State management
- [ ] RxJS trong service gọi API (debounce, combineLatest)
- [ ] So sánh Signals vs RxJS
- [ ] NgRx / NgRx Signal Store

### Giai đoạn 5 — Nghiệp vụ chính
- [ ] Dashboard theo role
- [ ] Quản lý câu hỏi + luồng phê duyệt
- [ ] Quản lý đề thi + làm bài thi
- [ ] Học flashcard (chế độ ôn tập)

### Giai đoạn 6 — Nâng cao
- [ ] `ChangeDetectorRef` (tình huống cần dùng thủ công)
- [ ] `@defer` (deferrable views)
- [ ] Unit test (Jest) cho các phần quan trọng, đặc biệt auth

## Ghi chú kỹ thuật

- `jest-preset-angular/setup-env/zoneless` phải gọi `setupZonelessTestEnv()` thủ công vì app không dùng zone.js.
- `ng test` không hỗ trợ Jest — chạy test qua `npm test`.
- FE và BE là 2 repo riêng, cần thống nhất API contract sớm.
