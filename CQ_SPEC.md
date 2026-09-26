# Charlie Quizlet — Spec luồng dự án

> Nguồn tham khảo: [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md). Tài liệu này mô tả **luồng nghiệp vụ và luồng người dùng** của hệ thống, dùng làm căn cứ khi triển khai từng giai đoạn trong roadmap.

## 1. Tổng quan hệ thống

Ứng dụng học tập/thi trắc nghiệm kiểu Quizlet, gồm 2 repo:

- **Frontend**: Angular 22 (zoneless, signal-based), repo hiện tại.
- **Backend**: `charlie-quizlet-be` — Java Spring Boot + PostgreSQL (repo riêng).

3 vai trò người dùng: `STUDENT`, `TEACHER`, `ADMIN`.

## 2. Luồng Authentication & Authorization

```
[Login form] --(email/password)--> [BE /auth/login]
                                         |
                                   access token (JWT, ngắn hạn)
                                   refresh token (dài hạn)
                                         |
                                   lưu vào FE (memory/secure storage)
                                         |
        +--------------------------------+--------------------------------+
        |                                                                 |
  [HTTP Interceptor]                                            [Route Guard]
  - gắn access token vào mọi request                             - đọc role từ token/session
  - nếu 401 -> gọi /auth/refresh bằng refresh token              - chặn truy cập route không đúng role
  - refresh thành công -> retry request cũ                       - redirect về trang phù hợp (403/login)
  - refresh thất bại -> logout, về trang login
```

- **Đăng xuất**: xoá token phía FE, gọi BE để thu hồi refresh token.
- **Phê duyệt tài khoản**: một số role (vd. `TEACHER`) có thể cần 1–2 cấp phê duyệt trước khi được kích hoạt (chi tiết theo BE).

## 3. Luồng theo vai trò

### 3.1 STUDENT
1. Đăng nhập → vào **Dashboard Student** (tổng quan: đề thi sắp/đã làm, bộ flashcard đang học).
2. **Học flashcard**:
   - Chọn bộ flashcard → chế độ ôn tập (lật thẻ, đánh dấu nhớ/chưa nhớ, lặp lại thẻ chưa nhớ).
3. **Làm bài thi**:
   - Chọn đề thi được giao → làm bài (câu hỏi trắc nghiệm, đếm giờ) → nộp bài → xem kết quả/điểm.

### 3.2 TEACHER
1. Đăng nhập → vào **Dashboard Teacher** (số câu hỏi/đề đang chờ duyệt, thống kê lớp).
2. **Quản lý câu hỏi**:
   - Tạo câu hỏi (nội dung, đáp án, độ khó, chủ đề) → gửi duyệt.
3. **Quản lý đề thi**:
   - Tạo đề từ ngân hàng câu hỏi đã duyệt → gửi duyệt → giao đề cho học sinh/lớp.
4. **Luồng phê duyệt** (câu hỏi & đề thi):
   ```
   [Teacher tạo câu hỏi/đề] --> [PENDING]
          |
          v
   [Admin/Teacher cấp cao review] --(approve)--> [APPROVED] --> dùng được trong đề thi/giao bài
          |
          +--(reject + lý do)--> [REJECTED] --> Teacher sửa lại --> gửi duyệt lại
   ```

### 3.3 ADMIN
1. Đăng nhập → vào **Dashboard Admin** (thống kê toàn hệ thống: user, đề thi, câu hỏi chờ duyệt).
2. Quản lý người dùng, phân quyền, phê duyệt tài khoản Teacher.
3. Phê duyệt câu hỏi/đề thi (nếu cấu hình cần Admin duyệt).

## 3b. Tham khảo & luồng chi tiết phía người dùng

Tham khảo từ các sản phẩm cùng loại:

| Website | Điểm nên học hỏi |
|---|---|
| Quizlet | Học theo bộ thẻ (flashcard), nhiều chế độ học trên cùng một bộ câu hỏi |
| Quizizz / Kahoot | Giao diện làm bài vui, có đồng hồ, bảng xếp hạng |
| Anki | Lặp lại ngắt quãng (spaced repetition): câu sai được hỏi lại nhiều hơn |
| ClassMarker / Testmoz | Chế độ thi nghiêm túc: giới hạn thời gian, trộn câu, chấm điểm |
| Google Forms (Quiz) | Cách tạo câu hỏi đơn giản, dễ dùng cho người soạn đề |

Chi tiết hoá các luồng ở mục 3, áp dụng chủ yếu cho STUDENT (làm bài/học) và TEACHER (soạn đề):

**Flow 1 — Xác thực (chi tiết hơn mục 2)**
- Đăng ký → Đăng nhập → Quên mật khẩu.
- Cân nhắc cho phép làm bài ở chế độ **guest** (không cần đăng nhập), sau đó mới yêu cầu đăng nhập để lưu kết quả.

**Flow 2 — Tìm và chọn bộ đề**
```
Trang chủ → Danh mục / Tìm kiếm / Lọc (chủ đề, độ khó)
          → Trang chi tiết bộ đề (số câu, thời gian, lượt làm)
          → Chọn chế độ (Luyện tập / Thi thử)
```

**Flow 3 — Làm bài (flow quan trọng nhất)**

2 chế độ:
- **Luyện tập**: trả lời xong hiện đúng/sai + giải thích ngay, không tính giờ.
- **Thi thử**: đồng hồ đếm ngược, trộn câu và trộn đáp án, đánh dấu câu để xem lại, nộp bài mới biết kết quả.

Trạng thái một lượt làm bài:
```
NOT_STARTED → IN_PROGRESS → (PAUSED) → SUBMITTED → REVIEWED
                    ↓
              TIME_UP → tự động nộp bài
```

**Flow 4 — Kết quả và xem lại**
```
Điểm số, thời gian làm, tỉ lệ đúng
   → Xem lại từng câu (đáp án đã chọn, đáp án đúng, giải thích)
   → Nút "Làm lại các câu sai"
```

**Flow 5 — Theo dõi tiến độ**
- Lịch sử các lần làm, biểu đồ điểm theo thời gian.
- Thống kê chủ đề yếu, streak học mỗi ngày.

**Flow 6 — Tạo và quản lý câu hỏi** (Teacher/Admin, gắn với luồng phê duyệt ở mục 3.2)
```
Tạo bộ đề → Thêm câu hỏi (một đáp án / nhiều đáp án / đúng-sai)
          → Import từ Excel/CSV (ưu tiên làm, tiết kiệm thời gian nhập liệu)
          → Xuất bản hoặc để riêng tư
```

## 4. Luồng dữ liệu chung (FE ↔ BE)

```
Component (UI, signal-based state)
     |
     v
Service (gọi API qua HttpClient, dùng RxJS cho debounce/combineLatest khi cần)
     |
     v
Interceptor (gắn token, refresh khi 401)
     |
     v
BE REST API (Spring Boot) --> PostgreSQL
```

- State cần render ra UI: dùng `signal()`/`computed()`.
- Gọi API: Service trả `Observable`, convert sang signal ở nơi cần (hoặc dùng NgRx/NgRx Signal Store nếu state phức tạp, dùng chung nhiều nơi).

## 5. Cấu trúc thư mục

```
src/app/
├── core/                    # dùng toàn app, khởi tạo 1 lần
│   ├── auth/                # AuthService (token, phiên), authGuard / guestGuard
│   ├── config/              # CẤU HÌNH CHUNG, mỗi nhóm 1 file:
│   │   ├── app-settings.ts  #   hành vi app: tên app, ngôn ngữ, validate, ghi nhớ đăng nhập, toast...
│   │   ├── api-endpoints.ts #   URL gọi BE
│   │   ├── routes.ts        #   đường dẫn trang
│   │   ├── error-codes.ts   #   mã lỗi BE mà FE cần rẽ nhánh
│   │   ├── http-status.ts   #   mã HTTP status
│   │   └── storage-keys.ts  #   key localStorage/sessionStorage
│   ├── error/               # dialog lỗi chung, handleErrorCode / markErrorHandled
│   ├── i18n/                # TranslateService, pipe translate, tiêu đề tab theo ngôn ngữ
│   ├── interceptors/        # locale → auth → error → loading
│   ├── layout/              # main-layout (sau đăng nhập), auth-layout (login/register/...)
│   └── models/              # interface request/response với BE (ProblemDetail, User, Auth...)
├── features/                # màn hình theo nghiệp vụ: auth, home
│   └── ui-showcase/         # trang xem UI kit (dev only); examples/ = mẫu form + mẫu gọi API
└── shared/                  # tái sử dụng, không logic nghiệp vụ
    ├── ui/                  # UI kit: button, input-*, dialog, toast, table, tabs, icon, brand...
    └── utils/
        ├── validation.utils.ts  # AppValidators, passwordMatch, notBlank, controlErrorMessage
        └── common.utils.ts      # toApiError, hasErrorCode, isHttpStatus, formatDate, getInitials
src/styles/                  # variables.css (token), typography.css, animations.css, BEM của UI kit
public/i18n/                 # vn.json, en.json
src/environments/            # apiUrl theo môi trường
```

Cách dùng từng phần (gọi API, xử lý lỗi, dialog, toast, loading, form, i18n, style): [CQ_DEV_GUIDE.md](CQ_DEV_GUIDE.md). Quy định: [CQ_CODING_RULES.md](CQ_CODING_RULES.md).

## 6. Trạng thái hiện tại

**Đã có**

- **Auth**: đăng ký, đăng nhập, quên mật khẩu (link gửi qua log BE — chưa có SMTP), đặt lại mật khẩu, "ghi nhớ đăng nhập" (localStorage / sessionStorage), khôi phục phiên khi F5, guard cho trang cần đăng nhập / trang cho khách.
- **Xử lý lỗi**: BE trả model lỗi thống nhất (`errorCode`, `errorMessage`, `errorDescription`) lấy từ bảng `error_codes`, đa ngôn ngữ theo `Accept-Language`; FE mặc định hiện dialog lỗi chung, dev tự xử lý mã lỗi cụ thể khi cần.
- **Giao diện**: layout auth (header, panel giới thiệu theo từng màn, footer), layout sau đăng nhập + trang home (lời chào, thẻ chức năng "Sắp ra mắt", thông tin tài khoản), UI kit dùng chung, song ngữ vi/en, tiêu đề tab theo trang.
- **Nền tảng**: cấu hình tập trung (`core/config`), token style (màu, chữ, animation), animation hiện/ẩn + chuyển trang, unit test cho auth, guard, interceptor, util.

**Chưa có** (xem checklist trong [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md))

- Refresh token + thu hồi token khi đăng xuất (mục 2).
- Chọn vai trò khi đăng ký, phê duyệt tài khoản Teacher, dashboard riêng theo vai trò (mục 3).
- Nghiệp vụ chính: flashcard, câu hỏi, đề thi, làm bài, kết quả (mục 3b).
- Gửi email thật (SMTP) cho quên mật khẩu.
