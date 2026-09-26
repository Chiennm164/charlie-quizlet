import { Directive, ElementRef, computed, inject, input, output } from '@angular/core';

/** Tên phím đọc được cho aria-keyshortcuts (chuẩn WAI-ARIA dùng "Space" thay cho " "). */
const ARIA_KEY_NAMES: Record<string, string> = { ' ': 'Space' };

/**
 * Gắn phím tắt cho 1 phần tử (thường là nút): nhấn phím -> phát `(shortcut)`, giống như bấm nút đó.
 *   <button appShortcut=" " (shortcut)="flip()" (click)="flip()">Lật</button>
 *   <button [appShortcut]="['ArrowRight', 'l']" (shortcut)="next()">...</button>
 *
 * Giá trị là `KeyboardEvent.key` (" " = Space). Bỏ qua khi: đang gõ trong ô nhập, có giữ Ctrl / Alt / Meta
 * (không cướp phím tắt của trình duyệt), phần tử đang disabled. Tự thêm `aria-keyshortcuts` cho trình đọc màn hình.
 */
@Directive({
  selector: '[appShortcut]',
  standalone: true,
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '[attr.aria-keyshortcuts]': 'ariaKeys()',
  },
})
export class ShortcutDirective {
  private element = inject<ElementRef<HTMLElement>>(ElementRef);

  appShortcut = input.required<string | string[]>();
  shortcut = output<KeyboardEvent>();

  private keys = computed(() => {
    const keys = this.appShortcut();
    return Array.isArray(keys) ? keys : [keys];
  });

  ariaKeys = computed(() =>
    this.keys()
      .map((key) => ARIA_KEY_NAMES[key] ?? key)
      .join(' '),
  );

  onKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey) return;
    if (!this.keys().includes(event.key) || isTyping(event.target) || this.isDisabled()) return;
    // Chặn hành vi mặc định (Space cuộn trang / bấm lại nút đang focus, mũi tên cuộn trang).
    event.preventDefault();
    this.shortcut.emit(event);
  }

  private isDisabled(): boolean {
    const el = this.element.nativeElement;
    return (
      (el as HTMLButtonElement).disabled === true || el.getAttribute('aria-disabled') === 'true'
    );
  }
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(target.type))
  );
}
