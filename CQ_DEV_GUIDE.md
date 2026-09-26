# Hướng dẫn phát triển — Charlie Quizlet (Frontend)

Tài liệu "làm thế nào" kèm code mẫu. Quy định bắt buộc xem [CQ_CODING_RULES.md](CQ_CODING_RULES.md); luồng nghiệp vụ xem [CQ_SPEC.md](CQ_SPEC.md).

**Mục lục**

1. [Bức tranh tổng thể](#1-bức-tranh-tổng-thể)
2. [Cấu hình chung (`core/config`)](#2-cấu-hình-chung-coreconfig)
3. [Gọi API](#3-gọi-api)
4. [Xử lý lỗi API](#4-xử-lý-lỗi-api)
5. [Hiển thị thông báo: toast, dialog, lỗi tại chỗ](#5-hiển-thị-thông-báo-toast-dialog-lỗi-tại-chỗ)
6. [Dialog](#6-dialog)
7. [Toast](#7-toast)
8. [Loading](#8-loading)
9. [Form & validate](#9-form--validate)
10. [Đa ngôn ngữ (i18n)](#10-đa-ngôn-ngữ-i18n)
11. [Style: token, chữ, animation](#11-style-token-chữ-animation)
12. [Thêm một trang mới](#12-thêm-một-trang-mới)
13. [Chạy, build, test](#13-chạy-build-test)

---

## 1. Bức tranh tổng thể

```
src/app/
├── core/                    # dùng toàn app, khởi tạo 1 lần
│   ├── auth/                # AuthService (token, phiên đăng nhập), authGuard / guestGuard / roleGuard
│   ├── config/              # CẤU HÌNH CHUNG (mục 2)
│   ├── error/               # dialog lỗi chung + handleErrorCode / markErrorHandled
│   ├── i18n/                # TranslateService, pipe translate, tiêu đề tab theo ngôn ngữ
│   ├── interceptors/        # locale → auth → error → loading (thứ tự trong app.config.ts)
│   ├── layout/              # main-layout (sau đăng nhập), auth-layout (login/register...)
│   └── models/              # interface request/response với BE
├── features/                # màn hình theo nghiệp vụ: auth/, home/
│   └── ui-showcase/         # xem UI kit (dev only); examples/ có mẫu form & mẫu gọi API chuẩn
└── shared/
    ├── ui/                  # UI kit: button, input-*, dialog, toast, table, tabs, icon...
    └── utils/               # hàm thuần: validation.utils.ts, common.utils.ts
src/styles/                  # token (variables.css), chữ (typography.css), animation, BEM của UI kit
public/i18n/                 # vn.json, en.json
src/environments/            # URL API theo môi trường
```

**Một request đi qua những gì** (khai báo trong [app.config.ts](src/app/app.config.ts)):

```
Component → Service (HttpClient)
  → localeInterceptor   gắn Accept-Language (vi/en) để BE trả thông báo đúng ngôn ngữ
  → authInterceptor     gắn Bearer token; access token hết hạn → tự làm mới rồi gửi (lại) request;
                        phiên đã kết thúc → đăng xuất, về /login?returnUrl=...
  → errorInterceptor    lỗi → dialog lỗi chung (trừ khi nơi gọi tự xử lý, mục 4)
  → loadingInterceptor  bật/tắt loading toàn màn hình
  → BE
```

**Phiên đăng nhập** (chi tiết trong `AuthService`):

- Đăng nhập / đăng ký nhận **access token** (JWT, mặc định 15 phút) + **refresh token** (mặc định 30 ngày), lưu localStorage nếu "ghi nhớ đăng nhập", không thì sessionStorage.
- Access token hết hạn: `authInterceptor` gọi `/auth/refresh` lấy cặp token mới rồi gửi request. Nhiều request cùng lúc chỉ làm mới 1 lần; refresh token chỉ dùng được 1 lần (BE thu hồi token cũ).
- Refresh token hết hạn / bị thu hồi (đăng xuất, đổi mật khẩu) → xoá phiên, về trang login. Lỗi mạng khi làm mới → giữ phiên.
- Đăng xuất (`auth.logout()`): xoá token ở FE + báo BE thu hồi refresh token.

Lúc khởi động app: nạp file dịch (`TranslateService.init`) và khôi phục phiên (`AuthService.restoreSession` gọi `/auth/me`).

---

## 2. Cấu hình chung (`core/config`)

Mọi giá trị cấu hình import từ `core/config`, **không** gõ cứng trong component.

| File | Chứa | Ví dụ dùng |
|---|---|---|
| [app-settings.ts](src/app/core/config/app-settings.ts) | Hành vi app: tên app, ngôn ngữ, giới hạn validate, "ghi nhớ đăng nhập", thời gian toast, mốc giờ chào | `APP_SETTINGS.validation.passwordMinLength` |
| [api-endpoints.ts](src/app/core/config/api-endpoints.ts) | Mọi URL gọi BE | `API_ENDPOINTS.auth.login` |
| [routes.ts](src/app/core/config/routes.ts) | Đường dẫn trang | `ROUTES.login`, `DEFAULT_AUTHENTICATED_ROUTE` |
| [error-codes.ts](src/app/core/config/error-codes.ts) | Mã lỗi BE mà FE cần rẽ nhánh | `ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED` |
| [http-status.ts](src/app/core/config/http-status.ts) | Mã HTTP status | `HTTP_STATUS.unauthorized` |
| [storage-keys.ts](src/app/core/config/storage-keys.ts) | Key localStorage/sessionStorage (tiền tố `cq_`) | `STORAGE_KEYS.accessToken` |
| [src/environments/](src/environments/) | Theo môi trường: `apiUrl` | dev `http://localhost:8080/api`, prod `/api` |

```ts
import { APP_SETTINGS, ROUTES } from '../../../core/config';

this.router.navigateByUrl(ROUTES.login);            // không viết '/login'
Validators.minLength(APP_SETTINGS.validation.passwordMinLength); // không viết 8
```

Style cũng có "cấu hình" riêng dạng token CSS — xem mục 11.

---

## 3. Gọi API

### 3.1 Service

Mỗi nhóm API một service trong `core/` hoặc cạnh feature; URL lấy từ `API_ENDPOINTS`, kiểu dữ liệu khai báo trong `models/`.

```ts
// core/config/api-endpoints.ts — thêm URL trước
export const API_ENDPOINTS = {
  auth: { ... },
  studySets: { list: `${environment.apiUrl}/study-sets` },
} as const;

// features/study-set/study-set.service.ts
@Injectable({ providedIn: 'root' })
export class StudySetService {
  private http = inject(HttpClient);

  list(): Observable<StudySet[]> {
    return this.http.get<StudySet[]>(API_ENDPOINTS.studySets.list);
  }
}
```

Không cần tự gắn token, header ngôn ngữ, bật loading hay bắt lỗi — interceptor đã làm.

### 3.2 Component

**Đọc dữ liệu để hiển thị** — ưu tiên `toSignal`, không cần `subscribe`:

```ts
studySets = toSignal(this.studySetService.list(), { initialValue: [] });
```

**Gửi dữ liệu (submit form, bấm nút)** — mẫu chuẩn:

```ts
submitting = signal(false);
private destroyRef = inject(DestroyRef);

submit(): void {
  this.form.markAllAsTouched();
  if (this.form.invalid || this.submitting()) return;   // chặn bấm 2 lần

  this.submitting.set(true);
  this.service
    .create(this.form.getRawValue())
    .pipe(
      finalize(() => this.submitting.set(false)),          // tắt loading dù thành công, lỗi hay bị huỷ
      takeUntilDestroyed(this.destroyRef),                 // tự huỷ khi rời trang
    )
    .subscribe({
      next: () => this.toast.success(this.translate.t('studySet.created')),
      // Không viết error: → lỗi tự hiện dialog chung (mục 4)
    });
}
```

```html
<form [formGroup]="form" [attr.aria-busy]="submitting()" (ngSubmit)="submit()">
  ...
  <app-button type="submit" [block]="true" [loading]="submitting()">Lưu</app-button>
</form>
```

---

## 4. Xử lý lỗi API

### 4.1 Model lỗi BE trả về

Mọi API lỗi đều trả RFC 9457 problem detail kèm 3 trường ([problem-detail.model.ts](src/app/core/models/problem-detail.model.ts)):

```json
{
  "status": 409,
  "title": "Conflict",
  "detail": "Email này đã được đăng ký",
  "errorCode": "AUTH_EMAIL_ALREADY_REGISTERED",
  "errorMessage": "Email này đã được đăng ký",
  "errorDescription": "Hãy đăng nhập, hoặc dùng \"Quên mật khẩu\" nếu bạn không nhớ mật khẩu.",
  "errors": { "email": "..." }
}
```

- `errorMessage` / `errorDescription` BE đã dịch theo `Accept-Language`, lấy từ **bảng `error_codes` trong DB** (sửa câu chữ không cần build lại BE).
- `errors` chỉ có khi `errorCode = COMMON_VALIDATION_FAILED`.
- Lỗi không có mã từ BE, FE tự gán mã chung: mất kết nối → `COMMON_NETWORK_ERROR`, còn lại (proxy trả HTML, lỗi JS...) → `COMMON_INTERNAL_ERROR`. Hàm chuẩn hoá: `toApiError(err)` trong [common.utils.ts](src/app/shared/utils/common.utils.ts).

### 4.2 Mặc định: dialog lỗi chung

API lỗi → `errorInterceptor` **tự hiện dialog lỗi chung** (câu lỗi, mô tả, danh sách lỗi theo field, mã lỗi). Component không cần viết gì.

Ngoại lệ: `COMMON_UNAUTHORIZED` (access token hết hạn) và `AUTH_REFRESH_TOKEN_INVALID` (phiên đã kết thúc) — `authInterceptor` tự làm mới phiên hoặc đưa về trang login nên không hiện dialog.

### 4.3 Tự xử lý một mã lỗi

Chỉ khi cần phản hồi riêng (gắn lỗi vào ô input, đổi giao diện...) thì xử lý trong callback `error` — **mã đó** không hiện dialog, mã khác vẫn hiện:

```ts
import { handleErrorCode } from '../../../core/error/error-handling';
import { ERROR_CODES } from '../../../core/config';

.subscribe({
  error: (err) => {
    handleErrorCode(err, ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, () =>
      this.form.controls.email.setErrors({ emailTaken: true }),
    );
  },
});

// Nhiều mã cùng cách xử lý:
handleErrorCode(err, [ERROR_CODES.A, ERROR_CODES.B], () => ...);

// Tự xử lý MỌI lỗi (không hiện dialog nào):
markErrorHandled(err);

// Chỉ kiểm tra, không tắt dialog:
if (hasErrorCode(err, ERROR_CODES.X)) { ... }
```

Cơ chế: interceptor hoãn việc bật dialog sang lượt chạy kế tiếp (`setTimeout`), callback `error` của component chạy trước nên kịp đánh dấu. Vì vậy phải gọi `handleErrorCode` / `markErrorHandled` **ngay trong callback** (không đặt sau `await`, `delay`...).

Luôn rẽ nhánh theo **mã lỗi**, không theo HTTP status (401 có thể là "sai mật khẩu" hoặc "phiên hết hạn").

### 4.4 Thêm mã lỗi mới

1. **BE** — migration mới thêm dòng vào `error_codes` (`code`, `http_status`, `message_vi/en`, `description_vi/en`, `note`) + thêm hằng số vào enum `ErrorCode`; ném bằng `throw new BusinessException(ErrorCode.X)`.
2. **FE** — chỉ khi cần rẽ nhánh: thêm vào `ERROR_CODES` ([error-codes.ts](src/app/core/config/error-codes.ts)). Không cần câu dịch ở FE — dialog dùng câu BE trả về.

### 4.5 Gọi dialog lỗi thủ công

Lỗi không đến từ HTTP (vd. đọc file thất bại):

```ts
inject(ErrorDialogService).show(err);   // err bất kỳ; không có mã → COMMON_INTERNAL_ERROR
```

---

## 5. Hiển thị thông báo: toast, dialog, lỗi tại chỗ

Chọn đúng kênh:

| Tình huống | Dùng | Ví dụ |
|---|---|---|
| Thao tác **thành công**, thông tin nhẹ, không cần người dùng làm gì | **Toast** (tự tắt) | "Đã lưu", "Bạn đã đăng xuất" |
| **API lỗi** | **Dialog lỗi chung** (tự động) | "Email hoặc mật khẩu không đúng" |
| Lỗi **gắn với một ô nhập** | **Lỗi dưới ô** (`errorMessage` của input) | "Tối thiểu 8 ký tự", "Email này đã được đăng ký" |
| Cần **xác nhận** trước khi làm (xoá, nộp bài...) | **Dialog** (`app-dialog`) có nút Huỷ / Đồng ý | "Bạn chắc chắn muốn xoá?" |
| Trạng thái của cả khối nội dung | Chữ lỗi độc lập `<app-text-error [reserveSpace]="false">` | "Link đặt lại mật khẩu đã hết hạn" |

Nguyên tắc:

- Mọi chuỗi hiển thị lấy từ file dịch (mục 10); thông báo lỗi API lấy từ BE.
- Không dùng toast để báo lỗi API (đã có dialog) và không hiện cùng một lỗi ở 2 nơi.
- Không dùng `alert()` / `confirm()` của trình duyệt.

---

## 6. Dialog

Component [app-dialog](src/app/shared/ui/dialog/dialog.ts): `open` (bool), `title`, `size` (`sm` | `md` | `lg`), `closeOnOverlay` (mặc định `true`), sự kiện `closed`. Nội dung đặt giữa thẻ, nút đặt trong slot `dialog-footer`. Mở/đóng có animation sẵn.

```ts
confirmOpen = signal(false);
```

```html
<app-button variant="danger" (clicked)="confirmOpen.set(true)">{{ 'studySet.delete' | translate }}</app-button>

<app-dialog
  [open]="confirmOpen()"
  [title]="'studySet.deleteTitle' | translate"
  size="sm"
  (closed)="confirmOpen.set(false)"
>
  <p class="typo-body-sm">{{ 'studySet.deleteConfirm' | translate }}</p>
  <div dialog-footer>
    <app-button variant="secondary" (clicked)="confirmOpen.set(false)">{{ 'common.cancel' | translate }}</app-button>
    <app-button variant="danger" [loading]="deleting()" (clicked)="delete()">{{ 'common.confirm' | translate }}</app-button>
  </div>
</app-dialog>
```

- Đóng dialog bằng cách set `open` về `false` trong handler của `closed` (bấm ×, bấm nền mờ) và của nút Huỷ.
- Dialog lỗi chung ([error-dialog](src/app/core/error/error-dialog/error-dialog.ts)) đã đặt sẵn 1 lần trong `app.html` — không đặt thêm.

---

## 7. Toast

```ts
private toast = inject(ToastService);

this.toast.success(this.translate.t('auth.loginSuccess', { name: user.fullName }));
this.toast.error('...');                                // chỉ cho lỗi không phải lỗi API
this.toast.show('...', 'info');                         // variant: success | danger | warning | info
this.toast.show('...', 'warning', 6000);                // tuỳ chỉnh thời gian (ms)
```

- Thời gian mặc định: `APP_SETTINGS.ui.toastDurationMs` (3 giây).
- `<app-toast-container />` đã đặt sẵn trong `app.html`. Toast trượt vào/ra có animation, có nút đóng.

---

## 8. Loading

| Loại | Khi nào | Cách dùng |
|---|---|---|
| **Loading toàn màn hình** | Tự động cho mọi request | Không cần làm gì. Chặn thao tác ngay, nhưng chỉ hiện ra sau 200ms (request nhanh không làm nháy màn hình) |
| **Nút loading** | Nút gửi form / hành động | `<app-button [loading]="submitting()">` — tự disabled + vòng quay + con trỏ ⏳ |
| **Form đang gửi** | Cả form đang chờ | `<form [attr.aria-busy]="submitting()">` — con trỏ `progress` |
| **Loading tại chỗ** | Tải một khối nội dung | `<app-loading [text]="'common.loading' \| translate" />` |

Request chạy ngầm không muốn chặn màn hình (tìm kiếm gõ tới đâu gọi tới đó, polling...):

```ts
import { SKIP_GLOBAL_LOADING } from '../../core/interceptors/loading.interceptor';

this.http.get(url, { context: new HttpContext().set(SKIP_GLOBAL_LOADING, true) });
```

---

## 9. Form & validate

Validator và thông báo lỗi dùng chung ở [validation.utils.ts](src/app/shared/utils/validation.utils.ts):

```ts
form = this.fb.nonNullable.group(
  {
    fullName: ['', AppValidators.fullName],       // bắt buộc, không toàn khoảng trắng, ≤ 255
    email: ['', AppValidators.email],             // bắt buộc, đúng định dạng, ≤ 255
    password: ['', AppValidators.newPassword],    // 8–72 ký tự (lấy từ APP_SETTINGS)
    confirmPassword: ['', AppValidators.required],
  },
  { validators: AppValidators.passwordMatch('password', 'confirmPassword') },
);

errorFor(name: keyof typeof this.form.controls): string | null {
  return controlErrorMessage(this.form.controls[name], this.translate);  // null nếu chưa touched / hợp lệ
}
```

```html
<app-input-text
  type="email"
  name="email"
  autocomplete="username"
  [label]="'auth.email' | translate"
  [required]="true"
  formControlName="email"
  [errorMessage]="errorFor('email')"
/>
```

- Dòng lỗi dưới ô luôn giữ sẵn chỗ → lỗi hiện/ẩn không làm giật layout.
- Đặt `name` + `autocomplete` đúng để trình duyệt đề nghị lưu / tự điền mật khẩu (`username`, `current-password`, `new-password`).
- Ô `type="password"` tự có nút ẩn/hiện mật khẩu.
- Validator mới: viết vào `validation.utils.ts`, thêm mã lỗi → key dịch vào `FORM_ERROR_MESSAGE_KEYS`. Câu dịch có thể dùng `{n}` (thay bằng độ dài yêu cầu của minlength/maxlength).

---

## 10. Đa ngôn ngữ (i18n)

- File dịch: [public/i18n/vn.json](public/i18n/vn.json), [en.json](public/i18n/en.json). Key theo nhóm: `common.*`, `auth.*`, `authLayout.*`, `home.*`...
- Ngôn ngữ hỗ trợ / mặc định: `SUPPORTED_LOCALES`, `APP_SETTINGS.i18n.defaultLocale` ([app-settings.ts](src/app/core/config/app-settings.ts)). Lựa chọn của người dùng lưu localStorage.

```html
{{ 'common.save' | translate }}
{{ 'auth.loginSuccess' | translate: { name: user.fullName } }}   <!-- "Xin chào, {name}!" -->
```

```ts
this.translate.t('home.goodMorning', { name });
```

- Tiêu đề tab trình duyệt: khai báo `title: 'auth.loginTitle'` (key dịch) trong route → hiển thị "Đăng nhập | Charlie Quizlet", tự đổi theo ngôn ngữ.
- Thông báo lỗi API không cần key FE — BE đã dịch theo header `Accept-Language` do `localeInterceptor` gửi.
- Thêm ngôn ngữ: thêm file `public/i18n/<mã>.json`, thêm mã vào `SUPPORTED_LOCALES` và vào `APP_SETTINGS.i18n.htmlLang` / `formatLocale`.

---

## 11. Style: token, chữ, animation

### 11.1 Token

Tất cả ở [variables.css](src/styles/variables.css) (tiền tố `--cq-`, map sang Tailwind trong `@theme`): màu (`bg-primary`, `text-danger`, `text-text-strong`, `text-text-inverse`...), bo góc, shadow, z-index, **chữ**, **thời lượng animation**, độ trễ loading. Đổi ở đây là cả app đổi.

Transition dùng thời lượng / easing mặc định lấy từ token: chỉ viết `transition-colors` / `transition-all`, **không** thêm `duration-150`, `ease-out`.

### 11.2 Chữ

Dùng class trong [typography.css](src/styles/typography.css):

| Class | Cỡ / đậm | Dùng cho |
|---|---|---|
| `typo-page-title` | 24 / 700, màu đậm | Tiêu đề trang (h1) |
| `typo-section-title` | 18 / 600, màu đậm | Tiêu đề mục (h2), tiêu đề dialog |
| `typo-card-title` | 16 / 600, màu đậm | Tiêu đề thẻ (h3) |
| `typo-body` / `typo-body-sm` | 16 / 14, 400 | Chữ thường / chữ nhỏ |
| `typo-muted` | 14 / 400, nhạt | Mô tả, phụ đề |
| `typo-label` | 14 / 500 | Nhãn ô nhập |
| `typo-caption` | 12 / 400, nhạt | Chú thích, footer, badge |
| `typo-error` | 12 / 500, đỏ | Chữ báo lỗi |
| `typo-error-code` | 12 / 400 mono | Mã lỗi |
| `typo-hero-title` / `typo-hero-subtitle` | 28 / 700, 14 | Trên nền màu (panel giới thiệu) |

Quan hệ: label = chữ thường − 2px, lỗi = label − 2px, placeholder = chữ trong ô (16px), tiêu đề luôn đậm ≥ 600 và màu `text-strong`.

### 11.3 Animation

Class trong [animations.css](src/styles/animations.css), gắn bằng API của Angular (không dùng `@angular/animations`):

```html
@if (open()) {
  <div class="panel" animate.enter="anim-slide-down-in" animate.leave="anim-fade-out">...</div>
}

@for (item of items(); track item.id) {
  <div class="anim-slide-up-in" [style.--i]="$index">...</div>   <!-- xuất hiện lần lượt -->
}
```

| Class | Hiệu ứng |
|---|---|
| `anim-fade-in` / `anim-fade-out` | Hiện / mờ dần |
| `anim-slide-up-in` | Trượt lên (nội dung, thẻ; so le theo `--i`) |
| `anim-slide-down-in` / `anim-slide-up-out` | Menu, thông báo lỗi |
| `anim-scale-in` / `anim-scale-out` | Phóng to / thu nhỏ nhẹ |
| `anim-toast-in` / `anim-toast-out` | Trượt vào / ra từ phải |

- Chuyển trang: View Transitions (tự động); header có class `app-header` đứng yên.
- Người dùng bật "giảm chuyển động" ở hệ điều hành → animation tự tắt.

### 11.4 Tương tác

Con trỏ đã có quy tắc chung trong [styles.css](src/styles.css): nút/phần tử bấm được → 👆, `disabled` / `aria-disabled="true"` → 🚫, `aria-busy="true"` → `progress`, nút `loading` → ⏳; điều hướng bằng phím Tab có viền focus. Không cần tự thêm `cursor-pointer` cho `<button>`.

---

## 12. Thêm một trang mới

Ví dụ trang "Học phần của tôi" (cần đăng nhập):

1. **Đường dẫn** — thêm vào `ROUTE_SEGMENTS` trong [routes.ts](src/app/core/config/routes.ts): `studySets: 'study-sets'`.
2. **Component** — `src/app/features/study-set/study-set-list/study-set-list.ts` (+ `.html` nếu template ≥ 30 dòng).
3. **Route** — trong [app.routes.ts](src/app/app.routes.ts), thêm làm **route con của `MainLayoutComponent`** (tự có header + `authGuard`):
   ```ts
   {
     path: ROUTE_SEGMENTS.studySets,
     title: 'studySet.pageTitle',
     loadComponent: () => import('./features/study-set/study-set-list/study-set-list').then((m) => m.StudySetListComponent),
   },
   ```
   Trang chỉ dành cho 1 số role: thêm `canActivate: [roleGuard('TEACHER', 'ADMIN')]` — user không đủ quyền được đưa tới trang 403 (`/forbidden`).
   Trang cho khách (login/register...) đặt ở cấp ngoài cùng với `canActivate: [guestGuard]` và dùng `<app-auth-layout page="...">`.
4. **API** — URL vào `API_ENDPOINTS`, model vào `models/`, service theo mục 3. API không cần đăng nhập thì thêm vào `PUBLIC_API_ENDPOINTS`.
5. **Chuỗi** — thêm key vào cả `vn.json` và `en.json`.
6. **Test** — service/guard/logic quan trọng có `*.spec.ts` cạnh file nguồn.

UI kit có sẵn (xem ví dụ trong trang dev `ui-showcase` — bỏ comment route trong `app.routes.ts` để mở): button, input-text, input-number, textarea, select, dropdown, dropdown-tree, checkbox, radio-group, date/time/date-range picker, countdown, tabs, table, list, dialog, toast, loading, page-header, icon, brand, language-switcher.

---

## 13. Chạy, build, test

```bash
npm start                              # dev server http://localhost:4200 (BE ở http://localhost:8080)
npx ng build --configuration development
npm test                               # Jest (không dùng ng test)
npx prettier --write <file>            # format theo .prettierrc
```

- BE: xem README của repo `charlie-quizlet-be` (`./mvnw spring-boot:run`, Swagger ở `/swagger-ui.html`).
- Thêm **file CSS mới** vào `src/styles/` mà trình duyệt không nhận: khởi động lại `ng serve`.
- Link đặt lại mật khẩu (chưa có SMTP) được ghi ra **log của BE**.
