# Charlie Quizlet — Spec luồng dự án

> Nguồn tham khảo: [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md). Tài liệu này mô tả **luồng nghiệp vụ và luồng người dùng** của hệ thống. Kế hoạch đã chốt ở giai đoạn 5 (2026-09-27): mọi luồng dưới đây đã có trong app, trừ phần ghi rõ *ngoài phạm vi*.

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
1. Đăng ký (vào app luôn, không chờ duyệt) / đăng nhập → **Home**: khung *Đang làm dở* / *Làm gần đây*, bộ đề *Yêu thích*, rồi các bộ đề đã xuất bản nhóm theo chủ đề.
2. **Tìm đề**: ô tìm kiếm trên header / mục "Bộ đề" / "Xem tất cả" → trang Bộ đề (xem theo chủ đề hoặc danh sách; lọc chủ đề, *Chưa làm* / *Yêu thích*, tìm theo tên, sắp xếp).
3. **Làm bài**: mở bộ đề → Luyện tập hoặc Thi thử → nộp bài → kết quả, lời giải thích → làm lại câu sai / cả đề.
4. **Theo dõi**: trang Lịch sử (mọi lượt đã nộp), điểm cao nhất + "Đang làm dở" trên thẻ đề, đánh dấu yêu thích.

### 3.2 ADMIN
1. Quản lý **chủ đề** (danh sách phẳng: Toán, Tiếng Anh...).
2. Soạn **bộ đề** trong 1 chủ đề: câu hỏi trắc nghiệm, mỗi câu 2–6 đáp án, đúng 1 đáp án đúng, lời giải thích.
3. **Xuất bản = đã duyệt**: đề `DRAFT` chỉ Admin thấy; `PUBLISHED` hiện cho học sinh. Không có bước duyệt riêng.
4. **Ngân hàng câu hỏi**: đề có thể có nhiều câu (vd. 100); mỗi lượt Thi thử rút ngẫu nhiên N câu — N là "Số câu mỗi lượt thi thử" của đề, để trống thì theo **mặc định hệ thống 30** (BE `DEFAULT_EXAM_QUESTION_COUNT`); đề ít câu hơn N thì làm hết. Luyện tập làm đủ ngân hàng.
5. **Công cụ soạn**: nhập câu hỏi từ Excel (file `.xlsx` hoặc dán), xuất đề ra Excel, nhân bản đề, xem thử như học sinh (cả đề nháp — lượt làm của Admin là *làm thử*, không tính thống kê).
6. **Thống kê** từng bộ đề (chỉ lượt đã nộp của học sinh), tải CSV.

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
- Làm bài ở chế độ **guest** (không cần đăng nhập): *ngoài phạm vi* — xem "Ngoài kế hoạch" trong CQ_LEARNING_PLAN.

**Flow 2 — Tìm và chọn bộ đề**
```
Home (theo chủ đề, làm dở, gần đây, yêu thích) / ô tìm kiếm header / trang Bộ đề (/quizzes: theo chủ đề | danh sách,
      lọc chủ đề + Chưa làm / Yêu thích, tìm tên, sắp xếp — bộ lọc trên URL)
          → Trang bộ đề /quizzes/:id (chủ đề, số câu, thời gian, lịch sử của mình, yêu thích)
          → Chọn chế độ (Luyện tập / Thi thử) hoặc "Làm tiếp" lượt dở
```

**Flow 3 — Làm bài (flow quan trọng nhất)**

2 chế độ:
- **Luyện tập**: trả lời xong hiện đúng/sai + giải thích ngay, không tính giờ.
- **Thi thử**: đồng hồ đếm ngược, trộn câu và trộn đáp án, đánh dấu câu để xem lại, nộp bài mới biết kết quả. Mỗi lượt rút ngẫu nhiên N câu từ ngân hàng (N = cấu hình của đề, mặc định 30; lượt "làm lại câu sai" giữ đủ các câu sai).
- **Tính điểm**: thang **100** (`APP_SETTINGS.attempt.scoreScale`) — mỗi câu = 100 / số câu của lượt (30 câu → ≈ 3,33 điểm), làm tròn 1 chữ số thập phân; xếp loại tốt / khá / cần cố gắng theo ngưỡng 80 / 50.

Trạng thái một lượt làm bài (`quiz_attempts.status`):
```
bắt đầu ──→ IN_PROGRESS ──nộp bài──→ SUBMITTED (chấm điểm → trang kết quả, cùng URL /attempts/:id)
                │
                ├─ quá deadline + 30s ân hạn → BE tự nộp với các câu đã lưu (SUBMITTED)
                └─ bắt đầu lượt mới cùng đề → lượt dở bị huỷ (nếu đã quá giờ thì được chấm thay vì huỷ)
```
- Mỗi lần chọn đáp án tự lưu lên BE (F5 / mất mạng làm tiếp được); mỗi người tối đa 1 lượt dở / bộ đề.
- BE giữ đáp án đúng: chỉ gửi xuống khi đã nộp, hoặc luyện tập với câu đã trả lời. Đồng hồ FE chỉ để hiển thị.

**Flow 4 — Kết quả và xem lại**
```
Điểm (thang 100), số câu đúng, thời gian làm
   → Xem lại từng câu (đáp án đã chọn, đáp án đúng, giải thích)
   → "Làm lại các câu sai" (lượt mới chỉ gồm câu sai / bỏ trống) · "Làm lại cả đề"
```

**Flow 5 — Theo dõi tiến độ**
- Đã có: trang Lịch sử `/history` (lọc chế độ / chủ đề), lịch sử trên trang bộ đề, điểm cao nhất trên thẻ đề, khung Làm gần đây trên Home.
- *Ngoài phạm vi*: biểu đồ điểm theo thời gian, thống kê chủ đề yếu, streak học mỗi ngày.

**Flow 6 — Soạn bộ đề** (Admin, mục 3.2)
```
Chọn chủ đề → Tạo bộ đề (hoặc Nhân bản đề cũ) → Thêm câu hỏi (1 đáp án đúng)
          → Nhập từ Excel (file .xlsx theo mẫu hoặc dán) / Xuất Excel để sửa rồi nhập lại
          → Xem thử như học sinh (không tính thống kê)
          → Xuất bản (= duyệt, học sinh thấy) hoặc để nháp → Thống kê đề, tải CSV
```

## 4. Luồng dữ liệu chung (FE ↔ BE)

```
Component (UI, signal-based state)
     |
     v
Service (gọi API qua HttpClient, dùng RxJS cho debounce/combineLatest khi cần)
     |
     v
Interceptor (locale → auth: gắn token, refresh khi 401 → error: dialog lỗi chung → loading)
     |
     v
BE REST API (Spring Boot) --> PostgreSQL
```

- State cần render ra UI: dùng `signal()`/`computed()`.
- Gọi API: Service trả `Observable`, component đọc bằng `toSignal()`.
- State phức tạp của 1 trang: service signal provide ở component (`AttemptStore` — hàng đợi lưu câu trả lời). State dùng chung nhiều trang: service signal `providedIn: 'root'` (`QuizMarksStore` — dấu trên thẻ đề). Chưa cần NgRx.

## 5. Cấu trúc thư mục

```
src/app/
├── core/                    # dùng toàn app, khởi tạo 1 lần
│   ├── auth/                # AuthService (token, phiên), authGuard / guestGuard / roleGuard
│   ├── config/              # CẤU HÌNH CHUNG, mỗi nhóm 1 file:
│   │   ├── app-settings.ts  #   hành vi app: tên app, ngôn ngữ, validate, số đề / trang, ngưỡng xếp loại điểm...
│   │   ├── api-endpoints.ts #   URL gọi BE
│   │   ├── routes.ts        #   đường dẫn trang (+ quizUrl, attemptUrl, adminQuizEditUrl...)
│   │   ├── error-codes.ts   #   mã lỗi BE mà FE cần rẽ nhánh + mã hiển thị cho lỗi FE tự gán
│   │   ├── http-status.ts   #   mã HTTP status
│   │   └── storage-keys.ts  #   key localStorage/sessionStorage
│   ├── error/               # dialog lỗi chung (hiện mã MCN-GG-NN), handleErrorCode / markErrorHandled
│   ├── confirm/             # ConfirmDialogService — hộp thoại xác nhận dùng chung (Promise<boolean>)
│   ├── guards/              # unsavedChangesGuard (rời trang khi chưa lưu)
│   ├── i18n/                # TranslateService, pipe translate, tiêu đề tab theo ngôn ngữ
│   ├── interceptors/        # locale → auth → error → loading
│   ├── layout/              # main-layout (header: tìm kiếm, dialog tài khoản & cài đặt), auth-layout
│   ├── navigation/          # ScrollRestoreService — Back / Forward về đúng chỗ sau khi dữ liệu tải xong
│   └── models/              # interface request/response với BE (ProblemDetail, User, Quiz, Attempt...)
├── features/                # màn hình theo nghiệp vụ
│   ├── auth/ home/ forbidden/ not-found/
│   ├── quizzes/             # trang Bộ đề, trang bộ đề, thẻ đề, khối chủ đề
│   ├── attempts/            # làm bài + kết quả (AttemptStore)
│   ├── me/                  # của tôi: lịch sử, khung hoạt động trên Home, yêu thích (QuizMarksStore)
│   ├── admin/               # chủ đề, quản lý + soạn bộ đề (nhập / xuất Excel), thống kê đề
│   └── ui-showcase/         # trang xem UI kit (dev only); examples/ = mẫu form + mẫu gọi API
└── shared/                  # tái sử dụng, không logic nghiệp vụ
    ├── directives/          # appShortcut (phím tắt)
    ├── ui/                  # UI kit: button, input-*, select, segmented, dialog, toast, table, tabs, pagination...
    └── utils/
        ├── validation.utils.ts  # AppValidators, passwordMatch, notBlank, controlErrorMessage
        ├── tsv.utils.ts         # tách dữ liệu dán từ bảng tính
        └── common.utils.ts      # lỗi API, định dạng ngày / giờ / thời lượng / thời gian tương đối, %, CSV, tải file...
src/styles/                  # variables.css (token), typography.css, animations.css, BEM của UI kit (@layer components)
public/                      # i18n/ (vn.json, en.json), templates/ (file mẫu nhập Excel), favicon
src/environments/            # apiUrl theo môi trường
```

Cách dùng từng phần (gọi API, xử lý lỗi, dialog, toast, loading, form, i18n, style): [CQ_DEV_GUIDE.md](CQ_DEV_GUIDE.md). Quy định: [CQ_CODING_RULES.md](CQ_CODING_RULES.md).

## 6. Trạng thái hiện tại

**Đã có**

- **Auth**: đăng ký (luôn là học sinh), đăng nhập, quên mật khẩu (link gửi qua log BE — chưa có SMTP), đặt lại mật khẩu, "ghi nhớ đăng nhập" (localStorage / sessionStorage), khôi phục phiên khi F5, guard cho trang cần đăng nhập / trang cho khách.
- **Phiên & phân quyền**: refresh token (tự làm mới access token hết hạn, xoay vòng + phát hiện token bị dùng lại, thu hồi khi đăng xuất / đặt lại mật khẩu), `roleGuard` + trang 403.
- **Bộ đề (phía học sinh)**: Home hiện bộ đề đã xuất bản nhóm theo chủ đề (tối đa 8 đề / chủ đề + "Xem tất cả"); trang `/quizzes` mặc định **xem theo chủ đề** (mỗi chủ đề 1 khối, tối đa 8 đề + "Xem tất cả"), đổi được sang **danh sách** có phân trang (lựa chọn nhớ trên trình duyệt); lọc chủ đề, tìm tên, sắp xếp (bộ lọc + cách xem trên URL); trang bộ đề `/quizzes/:id` (chọn Luyện tập / Thi thử, "Làm tiếp" lượt dở, lịch sử các lần làm).
- **Điều hướng**: bấm logo về Trang chủ; header có ô tìm bộ đề (Enter → `/quizzes?q=`; đang ở trang Bộ đề thì gõ tới đâu lọc tới đó); thanh menu dưới header (Bộ đề, Lịch sử; Admin thêm Quản lý đề, Chủ đề — mục đang mở được tô sáng); breadcrumb ở trang con; trang 404 cho URL sai; mở trang mới cuộn lên đầu, Back / Forward về đúng chỗ đang xem (`ScrollRestoreService` tự chờ request HTTP của trang xong rồi cuộn); Esc đóng dialog.
- **Lối tắt**: trang chủ đề → "Xem đề" / "Tạo đề" (chọn sẵn chủ đề); Quản lý đề → "Tạo bộ đề" mang theo chủ đề đang lọc; trình soạn đề / Quản lý đề → "Xem như học sinh" (cả đề nháp), "Thống kê" (đề đã xuất bản), "Nhân bản"; trang bộ đề → "Sửa đề" (Admin); Home của Admin → "Tạo bộ đề".
- **Admin** (mục "Quản trị" trên thanh menu): `/admin/topics` quản lý chủ đề (thêm, đổi tên tại chỗ, xoá chủ đề trống); `/admin/quizzes` mọi bộ đề kể cả nháp (lọc trạng thái / chủ đề, tìm kiếm); **thống kê đề** `/admin/quizzes/:id/stats` (lượt nộp theo chế độ, số người làm, tỉ lệ đúng trung bình, câu khó nhất; từng câu tỉ lệ đúng — xếp câu sai nhiều nhất lên đầu — và số lượt chọn mỗi đáp án; chỉ tính lượt học sinh đã nộp, không tính lượt Admin làm thử); trình soạn đề `/admin/quizzes/new`, `/admin/quizzes/:id/edit` (câu hỏi + 2–6 đáp án, chọn đáp án đúng, giải thích, kéo thả sắp xếp câu, lưu nháp / xuất bản / chuyển về nháp, xoá; cảnh báo rời trang khi chưa lưu; **nhập từ Excel**: tải file `.xlsx` (sheet đầu tiên, tối đa 2MB, có file mẫu `public/templates/mau-nhap-cau-hoi.xlsx`) hoặc dán các dòng `Câu hỏi | Đáp án đúng (A–F) | Giải thích | Đáp án A | Đáp án B…`, xem trước + báo lỗi từng dòng).
- **Làm bài** (`/attempts/:id`, cùng URL cho lúc làm và kết quả): **Luyện tập** (chọn 1 lần, thấy đúng / sai + giải thích ngay, không giờ) và **Thi thử** (trộn câu + đáp án, rút ngẫu nhiên N câu — cấu hình của đề hoặc mặc định 30, đếm ngược nếu đề có giới hạn, hết giờ tự nộp, đánh dấu câu xem lại); bảng số câu để nhảy nhanh; phím tắt A–F, ← →, M; mỗi lần chọn tự lưu lên BE (F5 / mất mạng làm tiếp được, mỗi bộ đề tối đa 1 lượt dở — bắt đầu lượt mới thì huỷ lượt dở sau khi hỏi). BE giữ đáp án đúng và giờ làm bài (`deadline` + 30s ân hạn, quá hạn tự nộp), chấm điểm khi nộp. **Kết quả**: điểm thang 100, số câu đúng, thời gian, xem lại từng câu (lọc sai / đúng) kèm giải thích, "Làm lại câu sai", "Làm lại cả đề".
- **Của tôi** (học sinh): Home có 2 khung danh sách **Đang làm dở** (làm tiếp 1 chạm) và **Làm gần đây** (mỗi đề lượt mới nhất, huy hiệu điểm % + số câu đúng tô màu theo mức, thời gian tương đối, nút làm lại) cùng khối **Yêu thích**; thẻ đề hiện "Đang làm dở" / "Cao nhất x%" và ngôi sao **yêu thích**; trang Bộ đề lọc thêm **Chưa làm / Yêu thích** (`mark` trên URL); trang **Lịch sử** `/history` (mọi lượt đã nộp, lọc chế độ / chủ đề, phân trang, bấm xem lại kết quả).
- **Công cụ Admin**: **nhân bản** đề (bản nháp chép toàn bộ câu hỏi); **xuất đề ra Excel** đúng mẫu nhập (sửa rồi nhập lại được); thống kê **tải CSV**; **xem thử như học sinh** cả với đề nháp — lượt làm của Admin là làm thử, không tính vào thống kê.
- **Dùng chung cho trình soạn / làm đề**: hộp thoại xác nhận (`ConfirmDialogService`), `unsavedChangesGuard`, directive phím tắt `appShortcut`, component phân trang, validator `minItemsValidator` / `uniqueValuesValidator` cho FormArray.
- **Tài khoản** (bấm avatar / tên ở header → dialog): xem thông tin, sửa họ tên, đổi mật khẩu (đăng xuất các thiết bị khác); tab **Cài đặt** chọn ngôn ngữ (áp dụng ngay, nhớ trên trình duyệt). Nút đổi ngôn ngữ VN/EN chỉ còn ở trang đăng nhập / đăng ký.
- **Xử lý lỗi**: BE trả model lỗi thống nhất (`errorCode` để FE rẽ nhánh, `errorDisplayCode` dạng **MCN-GG-NN** để hiện cho người dùng, `errorMessage`, `errorDescription`) — câu thông báo lấy từ bảng `error_codes`, đa ngôn ngữ theo `Accept-Language`; FE mặc định hiện dialog lỗi chung (căn giữa, kèm mã MCN), dev tự xử lý mã lỗi cụ thể khi cần.
- **Giao diện** (phong cách chibi: nền kem cam chấm bi, điểm nhấn hồng tím pastel, font Nunito, nút nổi kiểu nhãn dán, linh vật hổ `app-mascot`): layout auth (header, panel giới thiệu theo từng màn, footer), layout sau đăng nhập (header có ô tìm kiếm + dialog tài khoản) + trang home (lời chào, bộ đề theo chủ đề), UI kit dùng chung, song ngữ vi/en, tiêu đề tab theo trang.
- **Nền tảng**: cấu hình tập trung (`core/config`), token style (màu, chữ, animation), class BEM trong `@layer components` (utility luôn đè được), animation hiện/ẩn + chuyển trang, unit test cho auth, guard, interceptor, util, store làm bài, service.

**Ngoài phạm vi** — kế hoạch đã chốt ở giai đoạn 5 (xem [CQ_LEARNING_PLAN.md](CQ_LEARNING_PLAN.md), mục "Ngoài kế hoạch")

- Không làm: lớp học / giao bài (giai đoạn 6), dashboard & biểu đồ tiến độ (giai đoạn 7, flow 5).
- Quên mật khẩu chưa gửi email thật (link in ra log BE, chưa có SMTP).
