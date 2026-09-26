/**
 * Đường dẫn các trang trong app — dùng hằng số này thay vì gõ chuỗi '/login', '/home'... rải rác,
 * đổi URL chỉ cần sửa 1 chỗ. Khai báo route vẫn ở app.routes.ts (dùng ROUTE_SEGMENTS).
 */
export const ROUTE_SEGMENTS = {
  login: 'login',
  register: 'register',
  forgotPassword: 'forgot-password',
  resetPassword: 'reset-password',
  home: 'home',
  forbidden: 'forbidden',
  adminPendingUsers: 'admin/users/pending',
  studySets: 'study-sets',
  studySetNew: 'study-sets/new',
} as const;

type RouteKey = keyof typeof ROUTE_SEGMENTS;

/** Đường dẫn tuyệt đối, dùng cho routerLink / router.navigateByUrl: ROUTES.login === '/login'. */
export const ROUTES = Object.fromEntries(
  Object.entries(ROUTE_SEGMENTS).map(([key, segment]) => [key, `/${segment}`]),
) as { readonly [K in RouteKey]: `/${(typeof ROUTE_SEGMENTS)[K]}` };

/** Đường dẫn có tham số (route khai báo trong app.routes.ts: `study-sets/:id`, `study-sets/:id/edit`). */
export const studySetUrl = (id: number) => `/${ROUTE_SEGMENTS.studySets}/${id}`;
export const studySetEditUrl = (id: number) => `${studySetUrl(id)}/edit`;

/** Trang mặc định sau khi đăng nhập / đăng ký thành công. */
export const DEFAULT_AUTHENTICATED_ROUTE = ROUTES.home;

/** Tên query param mang theo URL cần quay lại sau khi đăng nhập. */
export const RETURN_URL_PARAM = 'returnUrl';
