# Coding Rules — Charlie Quizlet (Frontend)

Áp dụng cho toàn bộ code trong repo này (Angular 22, zoneless, TypeScript, SCSS, Jest).

## 1. Angular / Component

- **Standalone components** — không dùng `NgModule` cho feature mới.
- **Control flow mới**: dùng `@if / @for / @switch`, không dùng `*ngIf / *ngFor / *ngSwitch`.
- **State render lên UI phải là `signal()`** (bắt buộc vì app zoneless — không có Zone.js để tự detect change).
- Giá trị suy ra từ state khác → dùng `computed()`, không tự tính lại trong template hoặc getter.
- Side-effect phụ thuộc signal → dùng `effect()`, tránh gọi logic side-effect trực tiếp trong constructor/ngOnInit nếu nó phụ thuộc signal.
- Inject dependency bằng `inject()`, không dùng constructor injection cho code mới.
- Input/Output dùng `input()` / `output()` (signal-based), không dùng `@Input()/@Output()` cho component mới.
- Mỗi component chỉ làm 1 việc; tách component con khi template > ~150 dòng hoặc logic phình to.

## 2. Service & gọi API

- Service trả `Observable` (HttpClient); convert sang `signal` ở nơi cần dùng cho UI, không convert bừa ở nhiều nơi.
- Dùng RxJS operator đúng chỗ: `debounceTime` cho search input, `combineLatest` khi cần gộp nhiều nguồn data — không tự viết lại bằng tay.
- Không gọi `subscribe()` trong component nếu có thể dùng `toSignal()` hoặc async pipe — tránh leak subscription.
- Nếu buộc phải `subscribe()` thủ công, phải unsubscribe (dùng `takeUntilDestroyed()`).

## 3. TypeScript

- Bật strict mode, không dùng `any` trừ khi có comment giải thích lý do bắt buộc.
- Định nghĩa `interface`/`type` cho mọi model trao đổi với API (request/response), đặt trong `models/` hoặc cạnh feature liên quan.
- Không dùng `!` (non-null assertion) để né lỗi type — xử lý đúng luồng null/undefined.
- Enum trạng thái (role, trạng thái bài thi, trạng thái phê duyệt...) dùng `enum` hoặc union string literal, không dùng string rời rạc.

## 4. Auth & phân quyền

- Không tự ý parse/lưu token ở nhiều nơi — tập trung logic token vào 1 service (`AuthService`/`TokenService`) trong `core/`.
- Mọi route cần phân quyền phải có Guard tương ứng, không kiểm tra role bằng `if` rải rác trong component.
- Interceptor auth (gắn token, tự refresh khi 401) đặt trong `core/interceptors/`, không lặp logic này trong từng service.

## 5. Cấu trúc & đặt tên

- Theo cấu trúc `core/ | features/ | shared/` (xem CQ_SPEC.md mục 5).
- Tên file: `kebab-case`, hậu tố theo loại (`.component.ts`, `.service.ts`, `.guard.ts`, `.pipe.ts`...).
- Tên biến/hàm: `camelCase`; tên class/interface/type: `PascalCase`; hằng số toàn cục: `UPPER_SNAKE_CASE`.
- Không để logic nghiệp vụ trong `shared/` — `shared/` chỉ chứa thứ tái sử dụng thuần UI (không phụ thuộc feature cụ thể).

## 6. Style (Tailwind CSS v4 + HTML)

- Dùng **Tailwind v4** (import qua `@import "tailwindcss";` trong [src/styles.css](src/styles.css), cấu hình qua PostCSS — [.postcssrc.json](.postcssrc.json), không cần `tailwind.config.js` riêng).
- **Token gốc** (màu, radius, shadow) khai báo 1 lần dạng CSS variable tiền tố `--cq-` trong [src/styles/variables.css](src/styles/variables.css), map sang token Tailwind qua khối `@theme` trong cùng file. Từ đó dùng thẳng utility: `bg-primary`, `text-danger`, `border-border`, `rounded-md`, `shadow-md`...
- **Không hardcode** mã màu/px trực tiếp trong component — nếu cần màu mới, thêm vào `--cq-*` + map trong `@theme` trước, không viết `#2563eb` rải rác.
- **Responsive**: dùng breakpoint mặc định của Tailwind (`sm: md: lg: xl: 2xl:`), mobile-first — viết style mobile trước, thêm prefix breakpoint khi cần override cho màn lớn hơn (vd. `w-full md:w-[520px]`).
- Component đơn giản/dùng 1 lần: viết thẳng utility class trong template, không tạo file `.scss` riêng.
- Component dùng lặp lại nhiều nơi (button, dialog...): định nghĩa class ngữ nghĩa theo **BEM** (`.block`, `.block__element`, `.block--modifier`, trạng thái tiền tố `is-`) trong `src/styles/`, bên trong dùng `@apply` để gom utility Tailwind — import 1 lần ở [src/styles.css](src/styles.css).
  - Ví dụ button: `.btn .btn--primary .btn--md`, xem [src/styles/button.css](src/styles/button.css).
  - Ví dụ dialog: `.dialog__overlay .dialog .dialog--md .dialog__header .dialog__body .dialog__footer`, xem [src/styles/dialog.css](src/styles/dialog.css).
- Lưu ý: các file trong `src/styles/` là **CSS thuần** (không phải SCSS) vì `@apply`/`@theme` của Tailwind v4 cần cùng pipeline PostCSS; nesting dùng cú pháp CSS chuẩn (`&:hover`, `&.is-loading`) — **không dùng `&--modifier`/`&__element`** kiểu Sass (CSS thuần không hỗ trợ nối chuỗi selector qua `&`), phải viết selector đầy đủ (`.btn--primary`, `.dialog__header`).

## 7. Test (Jest)

- Chạy test qua `npm test` (không dùng `ng test`).
- Mỗi service/guard/pipe quan trọng (đặc biệt auth, guard phân quyền) phải có unit test.
- Test đặt cạnh file nguồn: `xxx.spec.ts`.
- Không mock quá sâu khiến test không còn phản ánh hành vi thật — ưu tiên test hành vi (input → output) hơn test chi tiết implementation.

## 7b. Đa ngôn ngữ (i18n)

- Chuỗi hiển thị cho người dùng (label, thông báo, tiêu đề) **không hardcode trong template** — khai báo key trong `public/i18n/vn.json` / `public/i18n/en.json`, dùng qua pipe `translate`: `{{ 'common.save' | translate }}`.
- Key đặt theo namespace lồng nhau: `<feature>.<key>` (vd. `showcase.title`, `common.save`), file cấu hình: [src/app/core/i18n/translate.service.ts](src/app/core/i18n/translate.service.ts), [translate.pipe.ts](src/app/core/i18n/translate.pipe.ts).
- Ngôn ngữ hiện tại lưu `localStorage` (`cq_locale`), load 1 lần lúc khởi động app qua `provideAppInitializer` trong [app.config.ts](src/app/app.config.ts) — không tự gọi `setLocale()` nhiều lần không cần thiết.
- Thêm ngôn ngữ mới: thêm file JSON trong `public/i18n/`, thêm mã ngôn ngữ vào mảng `SUPPORTED_LOCALES` trong `translate.service.ts`.
- Ví dụ dùng: [src/app/features/ui-showcase/ui-showcase.ts](src/app/features/ui-showcase/ui-showcase.ts) (title/description qua pipe) + [src/app/shared/ui/language-switcher/language-switcher.ts](src/app/shared/ui/language-switcher/language-switcher.ts) (nút đổi ngôn ngữ).

## 7c. Icon

- **Không** import file `.svg` rời rạc kiểu `<img src="icon.svg">` hay copy path SVG lặp lại ở nhiều component — icon khai báo tập trung trong [src/app/shared/ui/icon/icon-registry.ts](src/app/shared/ui/icon/icon-registry.ts) (`ICON_REGISTRY: Record<IconName, string>`), dùng qua `<app-icon name="close" />` ([icon.ts](src/app/shared/ui/icon/icon.ts)).
- Icon render bằng SVG inline (`innerHTML`), path/fill phải dùng `fill="currentColor"` → **đổi màu bằng class CSS** (`class="text-primary"`, `text-danger`...) thay vì sửa file SVG hay set màu cứng trong path.
- Đổi kích thước qua `font-size` (icon ăn theo `1em`): `class="text-2xl"` hoặc `[size]="24"` (px).
- Thêm icon mới: dán path SVG (Heroicons/Lucide...) vào `ICON_REGISTRY`, đảm bảo dùng `currentColor`, thêm tên vào union `IconName`.

## 7d. Radio group & Tabs (điều hướng bàn phím)

- **Radio group** ([radio-group.ts](src/app/shared/ui/radio-group/radio-group.ts)): dùng `<app-radio-group [options]="..." formControlName="..." />` (là `ControlValueAccessor`) hoặc `[value]`/`(valueChange)` khi dùng ngoài form. Các input cùng group luôn share 1 `name` random (roving) để trình duyệt tự xử lý đúng ngữ nghĩa radio. Phím `←/→/↑/↓` khi focus trong group sẽ tự chuyển sang option kế tiếp còn bật (bỏ qua option `disabled`) — không cần code thêm ở nơi dùng.
- **Tabs** ([tabs.ts](src/app/shared/ui/tabs/tabs.ts)): component chỉ render phần tab-header (`role="tablist"`) + state `activeId`; nội dung từng tab do nơi gọi tự `@switch (activeId())` render — tránh dựng cơ chế content-projection phức tạp cho việc đơn giản. Phím `←/→/↑/↓` khi 1 tab đang focus sẽ chuyển tab kế tiếp còn bật và tự set focus, theo đúng hành vi WAI-ARIA tab.
- Cả 2 đều bỏ qua option/tab có `disabled: true` khi điều hướng bàn phím — thêm option mới không cần sửa lại logic điều hướng.

## 7e. Table nâng cao (chọn dòng, ghim cột, action)

- **Chọn dòng**: `[selectable]="true"` bật cột checkbox (kèm checkbox "chọn tất cả" ở header, tự tính `indeterminate` theo trạng thái các dòng). Đồng bộ state qua `[selectedRows]`/`(selectedRowsChange)` — nhận diện 1 dòng bằng `trackBy` (mặc định so sánh cả object, truyền `[trackBy]="row => row.id"` khi row là object phức tạp).
- **Ghim cột**: set `pinned: 'left' | 'right'` trên `TableColumn`. **Chỉ hỗ trợ tối đa 1 cột ghim mỗi bên** — dùng CSS `position: sticky` thuần (không đo width bằng JS), nhiều cột ghim cùng bên sẽ đè lên nhau.
- **Cột action + icon**: dùng `<ng-template #rowActions let-row>` (đã có sẵn, xem [table.ts](src/app/shared/ui/table/table.ts)), bên trong đặt nút `.btn--ghost` + `<app-icon>` — cột action tự động ghim phải.
- Ví dụ đầy đủ: [ui-showcase.ts](src/app/features/ui-showcase/ui-showcase.ts) mục Table.

## 7f. Date / Time / Countdown

- **Date/Datetime/Time** ([date-picker.ts](src/app/shared/ui/date-picker/date-picker.ts), [date-time-picker.ts](src/app/shared/ui/date-time-picker/date-time-picker.ts), [time-select.ts](src/app/shared/ui/time-select/time-select.ts)): bọc native `<input type="date"|"datetime-local"|"time">` — **cố tình không tự vẽ lịch/UI chọn giờ riêng**, tận dụng UI hệ điều hành (đặc biệt tốt trên mobile). Giới hạn khoảng hợp lệ qua `min`/`max`; ngày rời rạc không liên tục (vd. nghỉ lễ, chỉ cho thứ 2-6) native input không hỗ trợ — validate thủ công và hiển thị qua `errorMessage`.
- **Date range** ([date-range-picker.ts](src/app/shared/ui/date-range-picker/date-range-picker.ts)): value dạng `{ from: string|null; to: string|null }`, tự validate `to >= from` và hiển thị lỗi (key `common.invalidDateRange`), input "đến ngày" tự set `min` = giá trị "từ ngày".
- Tất cả đều là `ControlValueAccessor` — dùng `formControlName` trong Reactive Forms, hoặc `[ngModel]`/`(ngModelChange)` (theo signal, **không dùng `[(ngModel)]` banana-in-box** để giữ state là `signal()` nhất quán với mục 1).
- **Countdown** ([countdown.ts](src/app/shared/ui/countdown/countdown.ts)): `<app-countdown [seconds]="90" (finished)="...">` hoặc `[targetDate]="isoStringOrDate"`. Tự tick mỗi giây bằng `effect()` + `setInterval`, tự `clearInterval` khi component huỷ (qua `onCleanup` của `effect`) — không tạo interval thủ công ở nơi dùng. `finished` chỉ phát đúng 1 lần khi về 0.

## 8. Git & review

- Commit message ngắn gọn, mô tả rõ **vì sao** thay đổi, không chỉ liệt kê **cái gì** đổi.
- Không commit file build (`dist/`), file env chứa secret, hoặc file `.bak`.
- PR/commit nên gọn theo 1 mục tiêu — tránh gộp nhiều việc không liên quan trong 1 commit.

## 9. Nguyên tắc chung

- Không thêm abstraction/pattern phức tạp khi chưa có nhu cầu thật (YAGNI).
- Không để code chết (`console.log` debug, code comment out) trong commit cuối cùng.
- Ưu tiên đọc hiểu dễ hơn là code ngắn khó hiểu.
