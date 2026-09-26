# Coding Rules — Charlie Quizlet (Frontend)

Quy định bắt buộc cho code trong repo này (Angular 22 zoneless, TypeScript strict, Tailwind CSS v4, Jest).
Hướng dẫn kèm code mẫu: [CQ_DEV_GUIDE.md](CQ_DEV_GUIDE.md). Luồng nghiệp vụ: [CQ_SPEC.md](CQ_SPEC.md).

## 1. Angular / Component

- **Standalone components**, không dùng `NgModule`.
- Control flow mới `@if / @for / @switch`, không dùng `*ngIf / *ngFor`.
- **State hiển thị lên UI phải là `signal()`** (app zoneless). Giá trị suy ra → `computed()`; side-effect theo signal → `effect()`.
- Inject bằng `inject()`; input/output bằng `input()` / `output()`.
- Mỗi component 1 việc; tách component con khi template > ~150 dòng.
- Nút submit của form **không** `disabled` khi form chưa hợp lệ — cho bấm, rồi `markAllAsTouched()` để hiện hết lỗi.
- **Template ≥ 30 dòng → tách file `.html`** cạnh file `.ts` (`templateUrl`); ngắn hơn giữ inline. Không tạo `.scss` riêng cho component (style theo mục 6).

## 2. Service & gọi API

- Service trả `Observable`, URL lấy từ `API_ENDPOINTS`, kiểu dữ liệu khai báo trong `models/`.
- Không tự gắn token / `Accept-Language` / bật loading / bắt lỗi trong service — interceptor đã làm.
- Component đọc dữ liệu: ưu tiên `toSignal()`. Buộc phải `subscribe()` thì kèm `takeUntilDestroyed()`.
- Cờ loading của request tắt bằng **`finalize()`**, không lặp `set(false)` ở cả `next` và `error`.
- Chặn gửi 2 lần: `if (this.form.invalid || this.submitting()) return;`.
- RxJS đúng chỗ: `debounceTime` cho ô tìm kiếm, `combineLatest` khi gộp nhiều nguồn.

## 3. Lỗi API & thông báo

- **Mặc định mọi API lỗi hiện dialog lỗi chung** (`errorInterceptor`). Không viết callback `error:` chỉ để báo lỗi.
- Chỉ khi cần xử lý riêng 1 mã lỗi mới tự xử lý **ngay trong callback `error`**: `handleErrorCode(err, ERROR_CODES.X, () => ...)` (mã khác vẫn hiện dialog) hoặc `markErrorHandled(err)` (tắt dialog cho mọi mã).
- **Rẽ nhánh theo `errorCode`, không theo HTTP status.** Mã FE cần dùng khai báo trong `core/config/error-codes.ts`, khớp enum `ErrorCode` ở BE.
- Nội dung thông báo lỗi API lấy từ BE (bảng `error_codes`, đã dịch) — FE không tự đặt câu cho lỗi API.
- Chọn kênh thông báo đúng: **toast** cho thành công / thông tin nhẹ; **dialog lỗi chung** cho lỗi API; **lỗi dưới ô nhập** cho lỗi gắn với 1 field; **`ConfirmDialogService.confirm()`** cho xác nhận (hỏi Có / Không); `app-dialog` cho hộp thoại có nội dung riêng. Không dùng toast cho lỗi API, không hiện cùng 1 lỗi ở 2 nơi, không dùng `alert()` / `confirm()`.
- Không đặt thêm `<app-error-dialog>` / `<app-confirm-dialog>` / `<app-toast-container>` — đã có 1 lần trong `app.html`.

## 4. Auth & phân quyền

- Logic token / phiên chỉ nằm trong `AuthService` (`core/auth`). Không đọc/ghi token ở nơi khác.
- Route cần đăng nhập đặt làm **route con của `MainLayoutComponent`** (đã có `authGuard`); trang cho khách dùng `guestGuard`. Không kiểm tra đăng nhập / role bằng `if` rải rác trong component.
- Trang chỉ dành cho 1 số role: thêm `canActivate: [roleGuard('TEACHER', 'ADMIN')]` vào route (không đủ quyền → trang 403). Ẩn/hiện nút, thẻ theo role thì dùng `auth.hasRole(...)`. Guard FE chỉ để giao diện đúng — BE vẫn phải tự kiểm tra quyền.
- Làm mới phiên (refresh token) do `AuthService` + `authInterceptor` lo: component / service **không** tự bắt 401, tự gọi `/auth/refresh` hay tự đọc refresh token.
- Trang có form nhập dài (soạn học phần, soạn đề...): route thêm `canDeactivate: [unsavedChangesGuard]`, component implement `HasUnsavedChanges` và chặn `beforeunload` khi còn thay đổi chưa lưu.
- API BE mới không cần đăng nhập: thêm vào `PUBLIC_API_ENDPOINTS` (`core/config/api-endpoints.ts`) để interceptor không gắn token, không làm mới phiên khi gặp 401.

## 5. Cấu trúc, cấu hình & đặt tên

- Cấu trúc `core/ | features/ | shared/` (chi tiết: [CQ_SPEC.md](CQ_SPEC.md) mục 5). `shared/` chỉ chứa thứ tái sử dụng, không logic nghiệp vụ của feature. Code demo / mẫu đặt trong `features/ui-showcase/examples/`, không đặt trong `shared/`.
- **Không hardcode cấu hình** — import từ `core/config`:
  - hành vi app → `APP_SETTINGS` (tên app, ngôn ngữ, giới hạn validate, thời gian toast...)
  - URL API → `API_ENDPOINTS`; đường dẫn trang → `ROUTES` / `ROUTE_SEGMENTS`
  - mã lỗi → `ERROR_CODES`; HTTP status → `HTTP_STATUS`; key storage → `STORAGE_KEYS`
  - cấu hình theo môi trường (API base URL) → `src/environments/`
- Validator / thông báo lỗi form dùng chung ở `shared/utils/validation.utils.ts` (`AppValidators`, `controlErrorMessage`). Validator mới viết vào file này.
- Hàm thuần dùng lại được ở `shared/utils/common.utils.ts` (`toApiError`, `hasErrorCode`, `isHttpStatus`, `formatDate`, `getInitials`). Không viết lại logic giống nhau trong từng component.
- Layout (khung có header/footer) ở `core/layout/`.
- Tên file `kebab-case`, **tên ngắn không hậu tố** theo chuẩn Angular hiện tại: `login.ts` / `login.html`, `auth.service.ts`, `auth.guards.ts`, `error.interceptor.ts`, `*.utils.ts`, `*.spec.ts`.
- Biến/hàm `camelCase`; class/interface/type `PascalCase`; hằng số toàn cục `UPPER_SNAKE_CASE`.

## 6. Style (Tailwind CSS v4)

- Tailwind v4 qua `@import 'tailwindcss'` trong `src/styles.css` + PostCSS (`.postcssrc.json`), không có `tailwind.config.js`.
- **Token** (màu, chữ, bo góc, shadow, z-index, thời lượng animation) khai báo 1 lần dạng `--cq-*` trong `src/styles/variables.css`, map sang Tailwind trong `@theme`. **Không hardcode** mã màu, px, thời lượng trong component — cần giá trị mới thì thêm token trước.
  - Chữ / icon trên nền màu dùng `text-text-inverse`, không dùng `text-white`.
  - Transition không ghi `duration-*` / `ease-*` — thời lượng mặc định đã lấy từ token (`--default-transition-duration`).
- Mobile-first, breakpoint mặc định của Tailwind (`sm: md: lg:`); không để trang có thanh cuộn ngang ở màn 390px.
- Component dùng 1 lần: utility class thẳng trong template. Component dùng lặp lại: class BEM (`.block__element--modifier`, trạng thái `is-*`) trong `src/styles/*.css`, bên trong `@apply`.
- File trong `src/styles/` là **CSS thuần** (không phải SCSS): nesting chỉ dùng `&:hover`, `&.is-x`; không nối chuỗi kiểu Sass `&--modifier`.
- Class muốn vừa dùng trong template vừa `@apply` được thì khai báo bằng `@utility` (như `typo-*`).
- Không tự thêm `cursor-pointer` cho `<button>` — quy tắc con trỏ chung đã có trong `styles.css`. Phần tử không bấm được đánh dấu `disabled` hoặc `aria-disabled="true"`; vùng đang xử lý `aria-busy="true"`.

### 6a. Chữ

- Thang cỡ chữ duy nhất: **12 · 14 · 16 · 18 · 24 · 28px**.
- Quan hệ bắt buộc: label = chữ thường − 2px (14); **lỗi = label − 2px (12)**; placeholder = chữ trong ô (16, ô nhập không nhỏ hơn 16px); tiêu đề đậm ≥ 600 **và** màu `text-strong`.
- Độ đậm theo vai trò: 400 chữ đọc · 500 label / nút / lỗi · 600 tiêu đề mục & thẻ · 700 tiêu đề trang.
- Trong template dùng class `typo-*` (`typo-page-title`, `typo-section-title`, `typo-card-title`, `typo-body`, `typo-body-sm`, `typo-muted`, `typo-label`, `typo-caption`, `typo-error`, `typo-error-code`, `typo-hero-*`). Không tự ghép `text-2xl font-semibold text-text`.

### 6b. Animation

- Dùng `animate.enter` / `animate.leave` của Angular với class `anim-*` trong `src/styles/animations.css`. **Không** cài `@angular/animations`.
- Không viết keyframes / thời lượng trong component; cần hiệu ứng mới thì thêm vào `animations.css`, thời lượng lấy từ `--cq-duration-*`.
- Phải tôn trọng `prefers-reduced-motion` (đã xử lý chung trong `animations.css`).
- Header của layout gắn class `app-header` (đứng yên khi chuyển trang).
- Hiện/ẩn thông báo không được làm giật layout: dòng lỗi dưới ô luôn giữ chỗ (`app-text-error`); chữ lỗi độc lập đặt `[reserveSpace]="false"`.

## 7. Đa ngôn ngữ

- Mọi chuỗi hiển thị lấy từ `public/i18n/vn.json` + `en.json` qua pipe `translate` / `translate.t()`; **thêm key vào cả 2 file**.
- Key theo nhóm `<feature>.<key>`; chuỗi có tham số dùng `{ten}` + `translate: { ten }` / `t(key, { ten })`, không tự `.replace()`.
- Tiêu đề tab: khai báo `title: '<key dịch>'` trong route.
- Ngôn ngữ hỗ trợ khai báo ở `SUPPORTED_LOCALES` (`core/config/app-settings.ts`).

## 8. Icon & UI kit

- Icon khai báo tập trung trong `shared/ui/icon/icon-registry.ts`, dùng `<app-icon name="..." />`; SVG phải dùng `currentColor`, đổi màu bằng class, đổi cỡ bằng `[size]` hoặc `font-size`. Không dùng `<img src="*.svg">` cho icon.
- Dùng component có sẵn trong `shared/ui/` trước khi tự viết (button, input-*, select, dropdown, checkbox, radio-group, tabs, table, date/time picker, dialog, toast...).
- **Radio group / Tabs**: điều hướng phím mũi tên đã có sẵn, tự bỏ qua mục `disabled`. Tabs chỉ render header; nội dung do nơi dùng `@switch (activeId())`.
- **Table**: `[selectable]` để chọn dòng; ghim tối đa **1 cột mỗi bên** (`pinned: 'left' | 'right'`); cột action dùng `<ng-template #rowActions let-row>`.
- **Date / time**: bọc input native của trình duyệt, không tự vẽ lịch. Date range value dạng `{ from, to }`, tự validate `to >= from`.
- **Countdown**: `<app-countdown [seconds]>` hoặc `[targetDate]`, tự dọn interval; `finished` phát 1 lần.
- Các ô nhập là `ControlValueAccessor`: dùng `formControlName`; không dùng `[(ngModel)]`.

## 9. Test

- Chạy `npm test` (Jest), không dùng `ng test`. Test đặt cạnh file nguồn: `xxx.spec.ts`.
- Bắt buộc có test cho service / guard / interceptor / util quan trọng (đặc biệt auth và xử lý lỗi).
- Test hành vi (input → output), không mock sâu đến mức test không còn phản ánh thực tế.

## 10. Git & nguyên tắc chung

- Commit ngắn gọn, nêu **vì sao**; mỗi commit 1 mục tiêu. Không commit `dist/`, secret, file `.bak`.
- YAGNI — không thêm abstraction khi chưa cần. Không để code chết / `console.log` debug khi commit.
  Ngoại lệ đã thống nhất: route `ui-showcase` để comment trong `app.routes.ts`, bỏ comment khi cần xem UI kit.
- Ưu tiên dễ đọc hơn ngắn gọn.
