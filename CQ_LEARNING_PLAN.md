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
- [x] API contract với BE qua Swagger / OpenAPI; model lỗi thống nhất (`errorCode` để rẽ nhánh + mã hiển thị `MCN-GG-NN`) + dialog lỗi chung
- [x] Nền tảng Angular mới: standalone, `@if/@for/@switch`, `signal()/computed()/effect()`, `inject()`, `input()/output()`
- [x] Auth: đăng ký, đăng nhập, quên / đặt lại mật khẩu, ghi nhớ đăng nhập, khôi phục phiên khi F5, `authGuard` / `guestGuard`
- [x] Interceptor: locale → auth → error → loading
- [x] Reactive Forms, custom validator (`AppValidators`), custom pipe (`translate`)
- [x] UI kit dùng chung, song ngữ vi/en, token style, animation
- [x] Unit test cho auth, guard, interceptor, util

## Lộ trình

Mỗi giai đoạn là một nhóm chức năng thật. Dòng **Angular** ghi kiến thức luyện được khi làm giai đoạn đó.

**Kế hoạch đã chốt ở giai đoạn 5 (2026-09-27):** làm xong 1, 4, 5; bỏ 2–3, 6, 7. Trang web hiện tại là phạm vi hoàn chỉnh — việc mới (nếu có) lấy từ mục "Ngoài kế hoạch" và lên kế hoạch lại.

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
- [x] Admin: quản lý chủ đề (thêm / đổi tên / xoá chủ đề trống)
- [x] Admin: danh sách mọi bộ đề (cả nháp) + trình soạn đề (form lồng nhau câu hỏi → đáp án, chọn đáp án đúng, kéo thả sắp xếp câu, cảnh báo rời trang khi chưa lưu)
- [x] Import câu hỏi nhanh: tải file `.xlsx` (có file mẫu) hoặc dán từ Excel / Google Sheets (cột: Câu hỏi | Đáp án đúng | Giải thích | Đáp án A…F), xem trước và báo lỗi từng dòng
- [x] Ô tìm bộ đề trên header; trang Bộ đề mặc định xem theo chủ đề, đổi được sang danh sách có phân trang (nhớ lựa chọn)
- [x] Trình soạn đề: thanh Lưu nháp / Xuất bản dính đáy màn hình; Back về đúng vị trí đang xem ở mọi trang tải dữ liệu qua API

**Angular:** `roleGuard('ADMIN')`, `FormArray` lồng nhau, custom validator (đúng 1 đáp án đúng), kéo thả bằng `@angular/cdk`, `import()` động để chỉ tải thư viện đọc Excel khi cần.

### Giai đoạn 5 — Làm bài + kết quả
- [x] Hai chế độ: Luyện tập (hiện đúng / sai + giải thích ngay sau mỗi câu) và Thi thử (đếm ngược bằng `app-countdown`, trộn câu và đáp án, đánh dấu câu để xem lại, bảng số câu để nhảy nhanh, hết giờ tự nộp)
- [x] BE chấm điểm: không gửi đáp án đúng xuống FE trước khi nộp; giờ làm bài do server quản lý (`started_at` + `deadline`), countdown ở FE chỉ để hiển thị
- [x] Tự lưu câu trả lời lên BE (F5 hay mất mạng vẫn làm tiếp)
- [x] Trang kết quả: điểm, thời gian, tỉ lệ đúng, xem lại từng câu kèm giải thích, nút "Làm lại các câu sai"; lịch sử các lần làm
- [x] Admin xem thống kê đề: số lượt làm, điểm trung bình, câu sai nhiều nhất

**Angular:** state bài làm bằng service signal riêng cho trang (`AttemptStore`, hàng đợi lưu `concatMap`) — chưa cần NgRx Signal Store; `CanDeactivate` + `beforeunload` khi còn câu đang lưu.

### ~~Giai đoạn 6 — Lớp học & giao bài~~ (bỏ)
Bỏ (2026-09-27): không làm lớp học, giao bài, bảng điểm theo lớp. Học sinh tự chọn bộ đề để ôn; Admin xem thống kê theo bộ đề (giai đoạn 5).

### ~~Giai đoạn 7 — Dashboard & tiến độ~~ (bỏ)
Bỏ (2026-09-27) khi chốt kế hoạch ở giai đoạn 5. Thay bằng phần nhỏ gọn hơn: học sinh có trang Lịch sử + điểm cao nhất trên thẻ đề (mục Bổ trợ); Admin xem thống kê từng bộ đề.

### Bổ trợ sau khi chốt (2026-09-27)
Làm thêm quanh các chức năng đã có, không mở mảng mới.
- [x] Học sinh: khối Đang làm dở / Làm gần đây / Yêu thích trên Home; điểm cao nhất + đang làm dở trên thẻ đề; yêu thích bộ đề; lọc Chưa làm / Yêu thích; trang Lịch sử làm bài
- [x] Admin: nhân bản đề, xuất đề ra Excel (đúng mẫu nhập), tải thống kê CSV, xem thử đề nháp như học sinh (lượt làm thử không tính thống kê)
- [x] Hoàn thiện giao diện: nền kem cam chibi, khung Làm gần đây (huy hiệu điểm theo mức, thời gian tương đối), dialog lỗi căn giữa + mã lỗi `MCN-GG-NN`, favicon SVG hợp lệ
- [x] Ngân hàng câu hỏi: "số câu mỗi lượt thi thử" theo từng đề hoặc mặc định hệ thống 30, mỗi lượt rút ngẫu nhiên; điểm thang 100 (`scoreScale`) trên kết quả, lịch sử, thẻ đề, thống kê
- [x] Làm sạch code: class BEM vào `@layer components`, `ScrollRestoreService` tự động (không gọi tay ở từng trang), gộp helper dùng chung (`common.utils`, `app-segmented`, `.option-letter`, `.progress`), BE hết N+1 (`default_batch_fetch_size`) + index thống kê

**Angular:** store signal dùng chung toàn app (`QuizMarksStore`, cập nhật lạc quan + trả lại khi lỗi), `import()` động cho thư viện ghi Excel.

## Ngoài kế hoạch (ý tưởng, chưa làm)

Không nằm trong kế hoạch hiện tại. Muốn làm thì lên kế hoạch lại trước.
- Dashboard tiến độ học sinh: biểu đồ điểm theo thời gian, chủ đề yếu, streak; tổng quan cho Admin (người dùng, nội dung)
- Chế độ khách: làm bài công khai không cần đăng nhập
- Gửi email thật (SMTP) cho quên mật khẩu
- Thi đấu realtime kiểu Kahoot (WebSocket)
- AI tạo câu hỏi từ một đoạn văn bản

**Việc kỹ thuật còn tồn:** BE dọn bảng `refresh_tokens` định kỳ (xoá token đã hết hạn — mỗi lần làm mới thêm 1 dòng).

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
| NgRx Signal Store | Chưa dùng — trình làm bài (giai đoạn 5) chỉ cần service signal `AttemptStore` |
| `@defer`, `ChangeDetectorRef` | Chưa dùng (giai đoạn 7 đã bỏ) |
| Dynamic `import()` (lazy thư viện ngoài) | Giai đoạn 4 — đọc file Excel (`read-excel-file`); Bổ trợ — ghi file Excel (`write-excel-file`) |
| Store signal dùng chung (`providedIn: 'root'`), cập nhật lạc quan + trả lại khi lỗi | Bổ trợ — `QuizMarksStore` (yêu thích, điểm trên thẻ đề) |
| `ApplicationRef.whenStable()` (chờ HTTP + render xong) | Làm sạch — `ScrollRestoreService` |
| CSS cascade layers (`@layer components`) với Tailwind v4 | Làm sạch — `src/styles.css` |
| Unit test (Jest) | Mọi giai đoạn: service, guard, interceptor, store làm bài |

## Ghi chú kỹ thuật

- `jest-preset-angular/setup-env/zoneless` phải gọi `setupZonelessTestEnv()` thủ công vì app không dùng zone.js.
- `ng test` không hỗ trợ Jest — chạy test qua `npm test`.
- FE và BE là 2 repo riêng, cần thống nhất API contract sớm.
