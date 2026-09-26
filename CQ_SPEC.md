# Charlie Quizlet — Spec luồng dự án

> Nguồn tham khảo: [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md). Tài liệu này mô tả **luồng nghiệp vụ và luồng người dùng** của hệ thống, dùng làm căn cứ khi triển khai từng giai đoạn trong roadmap.

## 1. Tổng quan hệ thống

Ứng dụng ôn tập bằng **bộ đề trắc nghiệm**, gồm 2 repo:

- **Frontend**: Angular 22 (zoneless, signal-based), repo hiện tại.
- **Backend**: `charlie-quizlet-be` — Java Spring Boot + PostgreSQL (repo riêng).

2 vai trò người dùng: `STUDENT` (tự đăng ký, làm bài) và `ADMIN` (soạn bộ đề, quản lý chủ đề — tạo sẵn lúc BE khởi động, không ai tự đăng ký được).

## 2. Luồng Authentication & Authorization

```
[Login form] --(email/password)--> [BE /auth/login]
                                         |
                                   access token (JWT, 15 phút)
                                   refresh token (30 ngày, dùng 1 lần)
                                         |
                  lưu ở FE: localStorage ("ghi nhớ đăng nhập") / sessionStorage
                                         |
        +--------------------------------+--------------------------------+
        |                                                                 |
  [authInterceptor]                                             [Route Guard]
  - gắn access token (trừ API công khai)                         - authGuard: phải đăng nhập
  - token hết hạn / 401 -> gọi /auth/refresh                     - roleGuard('ADMIN'): đúng role     
  - làm mới xong -> gửi (lại) request                            - không đủ quyền -> trang 403
  - phiên đã kết thúc -> logout, về trang login
```

- **Làm mới phiên**: refresh token chỉ dùng 1 lần — BE thu hồi token cũ và cấp cặp token mới. Token đã thu hồi mà bị dùng lại (quá 10 giây sau khi bị thay) → nghi bị lộ, BE thu hồi cả phiên.
- **Đăng xuất**: xoá token phía FE, gọi BE để thu hồi refresh token. Đặt lại mật khẩu → BE thu hồi mọi phiên của user.

## 3. Luồng theo vai trò

### 3.1 STUDENT
1. Đăng ký (vào app luôn, không chờ duyệt) / đăng nhập → **Home**: các bộ đề đã xuất bản, nhóm theo chủ đề.
2. **Tìm đề**: "Tìm bộ đề" / "Xem tất cả" → danh sách bộ đề (lọc chủ đề, tìm theo tên, sắp xếp, phân trang).
3. **Làm bài** (giai đoạn 5): mở bộ đề → Luyện tập hoặc Thi thử → nộp bài → xem kết quả, lời giải thích.

### 3.2 ADMIN
1. Quản lý **chủ đề** (danh sách phẳng: Toán, Tiếng Anh...).
2. Soạn **bộ đề** trong 1 chủ đề: câu hỏi trắc nghiệm, mỗi câu 2–6 đáp án, đúng 1 đáp án đúng, lời giải thích.
3. **Xuất bản = đã duyệt**: đề `DRAFT` chỉ Admin thấy; `PUBLISHED` hiện cho học sinh. Không có bước duyệt riêng.

## 3b. Tham khảo & luồng chi tiết phía người dùng

Tham khảo từ các sản phẩm cùng loại:

| Website | Điểm nên học hỏi |
|---|---|
| Quizlet | Học theo bộ thẻ (flashcard), nhiều chế độ học trên cùng một bộ câu hỏi |
| Quizizz / Kahoot | Giao diện làm bài vui, có đồng hồ, bảng xếp hạng |
| Anki | Lặp lại ngắt quãng (spaced repetition): câu sai được hỏi lại nhiều hơn |
| ClassMarker / Testmoz | Chế độ thi nghiêm túc: giới hạn thời gian, trộn câu, chấm điểm |
| Google Forms (Quiz) | Cách tạo câu hỏi đơn giản, dễ dùng cho người soạn đề |

Chi tiết hoá các luồng ở mục 3, áp dụng cho STUDENT (làm bài) và ADMIN (soạn đề):

**Flow 1 — Xác thực (chi tiết hơn mục 2)**
- Đăng ký (luôn là học sinh, vào app luôn) → Đăng nhập → Quên mật khẩu.
- Không ai tự đăng ký được Admin: tài khoản Admin đầu tiên do BE tạo lúc khởi động (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Cân nhắc cho phép làm bài ở chế độ **guest** (không cần đăng nhập), sau đó mới yêu cầu đăng nhập để lưu kết quả.

**Flow 2 — Tìm và chọn bộ đề**
```
Home (bộ đề theo chủ đề) / Tìm bộ đề (lọc chủ đề, tìm tên)
          → Trang bộ đề /quizzes/:id (chủ đề, số câu, thời gian)
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

**Flow 6 — Soạn bộ đề** (Admin, mục 3.2)
```
Chọn chủ đề → Tạo bộ đề → Thêm câu hỏi (1 đáp án đúng)
          → Import từ Excel/CSV (ưu tiên làm, tiết kiệm thời gian nhập liệu)
          → Xuất bản (= duyệt, học sinh thấy) hoặc để nháp
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
│   ├── auth/                # AuthService (token, phiên), authGuard / guestGuard / roleGuard
│   ├── config/              # CẤU HÌNH CHUNG, mỗi nhóm 1 file:
│   │   ├── app-settings.ts  #   hành vi app: tên app, ngôn ngữ, validate, ghi nhớ đăng nhập, toast...
│   │   ├── api-endpoints.ts #   URL gọi BE
│   │   ├── routes.ts        #   đường dẫn trang
│   │   ├── error-codes.ts   #   mã lỗi BE mà FE cần rẽ nhánh
│   │   ├── http-status.ts   #   mã HTTP status
│   │   └── storage-keys.ts  #   key localStorage/sessionStorage
│   ├── error/               # dialog lỗi chung, handleErrorCode / markErrorHandled
│   ├── confirm/             # ConfirmDialogService — hộp thoại xác nhận dùng chung (Promise<boolean>)
│   ├── guards/              # unsavedChangesGuard (rời trang khi chưa lưu)
│   ├── i18n/                # TranslateService, pipe translate, tiêu đề tab theo ngôn ngữ
│   ├── interceptors/        # locale → auth → error → loading
│   ├── layout/              # main-layout (sau đăng nhập, kèm dialog tài khoản), auth-layout (login/register/...)
│   └── models/              # interface request/response với BE (ProblemDetail, User, Auth...)
├── features/                # màn hình theo nghiệp vụ: auth, home, quizzes (danh sách + trang bộ đề), forbidden (trang 403)
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

- **Auth**: đăng ký (luôn là học sinh), đăng nhập, quên mật khẩu (link gửi qua log BE — chưa có SMTP), đặt lại mật khẩu, "ghi nhớ đăng nhập" (localStorage / sessionStorage), khôi phục phiên khi F5, guard cho trang cần đăng nhập / trang cho khách.
- **Phiên & phân quyền**: refresh token (tự làm mới access token hết hạn, xoay vòng + phát hiện token bị dùng lại, thu hồi khi đăng xuất / đặt lại mật khẩu), `roleGuard` + trang 403.
- **Bộ đề (phía học sinh)**: Home hiện bộ đề đã xuất bản nhóm theo chủ đề (tối đa 8 đề / chủ đề + "Xem tất cả"); trang `/quizzes` lọc chủ đề, tìm tên, sắp xếp, phân trang (bộ lọc trên URL); trang bộ đề `/quizzes/:id` (nút làm bài: giai đoạn 5).
- **Dùng chung cho trình soạn / làm đề**: hộp thoại xác nhận (`ConfirmDialogService`), `unsavedChangesGuard`, directive phím tắt `appShortcut`, component phân trang, validator `minItemsValidator` / `uniqueValuesValidator` cho FormArray.
- **Tài khoản** (bấm avatar / tên ở header → dialog): xem thông tin, sửa họ tên, đổi mật khẩu (đăng xuất các thiết bị khác).
- **Xử lý lỗi**: BE trả model lỗi thống nhất (`errorCode`, `errorMessage`, `errorDescription`) lấy từ bảng `error_codes`, đa ngôn ngữ theo `Accept-Language`; FE mặc định hiện dialog lỗi chung, dev tự xử lý mã lỗi cụ thể khi cần.
- **Giao diện** (phong cách chibi: pastel hồng tím, font Nunito, nút nổi kiểu nhãn dán, linh vật hổ `app-mascot`): layout auth (header, panel giới thiệu theo từng màn, footer), layout sau đăng nhập (header có dialog tài khoản) + trang home (lời chào, thẻ chức năng), UI kit dùng chung, song ngữ vi/en, tiêu đề tab theo trang.
- **Nền tảng**: cấu hình tập trung (`core/config`), token style (màu, chữ, animation), animation hiện/ẩn + chuyển trang, unit test cho auth, guard, interceptor, util.

**Chưa có** (xem checklist trong [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md))

- Dashboard riêng theo vai trò (mục 3).
- Admin: quản lý chủ đề, trình soạn bộ đề (BE đã có API). Làm bài, kết quả (mục 3b).
- Gửi email thật (SMTP) cho quên mật khẩu.
