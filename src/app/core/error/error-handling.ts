import { hasErrorCode } from '../../shared/utils/common.utils';
import type { ErrorCode } from '../config';

/*
 * Cơ chế "mặc định hiện dialog lỗi chung, dev tự tắt khi cần":
 * errorInterceptor hoãn việc bật dialog sang lượt chạy kế tiếp; trong lúc đó callback
 * `error: (err) => {...}` của nơi gọi API chạy trước. Lỗi nào được đánh dấu "đã xử lý"
 * ở đó thì dialog không bật, còn lại hiện dialog như bình thường.
 *
 *   .subscribe({
 *     error: (err) => {
 *       handleErrorCode(err, ERROR_CODES.AUTH_EMAIL_ALREADY_REGISTERED, () =>
 *         this.form.controls.email.setErrors({ emailTaken: true }),
 *       );
 *       // mã khác -> dialog lỗi chung tự hiện, không cần làm gì
 *     },
 *   });
 */

const handledErrors = new WeakSet<object>();

/** Đánh dấu lỗi đã được nơi gọi tự xử lý -> không hiện dialog lỗi chung. */
export function markErrorHandled(err: unknown): void {
  if (typeof err === 'object' && err !== null) handledErrors.add(err);
}

export function isErrorHandled(err: unknown): boolean {
  return typeof err === 'object' && err !== null && handledErrors.has(err);
}

/**
 * Nếu lỗi có mã thuộc `codes` thì chạy `handler` và tắt dialog chung cho lỗi này; mã khác vẫn hiện dialog.
 * Trả về true nếu đã xử lý.
 */
export function handleErrorCode(
  err: unknown,
  codes: ErrorCode | readonly ErrorCode[],
  handler: () => void,
): boolean {
  const list: readonly ErrorCode[] = typeof codes === 'string' ? [codes] : codes;
  if (!list.some((code) => hasErrorCode(err, code))) return false;
  markErrorHandled(err);
  handler();
  return true;
}
