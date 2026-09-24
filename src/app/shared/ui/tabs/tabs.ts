import { Component, ElementRef, ViewChildren, QueryList, input, output } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
  disabled?: boolean;
}

/**
 * Chỉ render phần tab header (tablist) + logic chuyển tab.
 * Nội dung từng tab do component cha tự render dựa theo `activeId`
 * (vd. @switch (activeId()) { @case ('a') {...} }) — tránh phải dựng
 * cơ chế content-projection phức tạp cho 1 việc đơn giản.
 *
 * Điều hướng bàn phím: ←/→ (hoặc ↑/↓) di chuyển focus + chọn tab kế tiếp
 * còn hoạt động (bỏ qua tab disabled), giống hành vi tab chuẩn WAI-ARIA.
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  template: `
    <div class="tabs" role="tablist">
      @for (tab of tabs(); track tab.id; let i = $index) {
        <button
          #tabButton
          type="button"
          class="tabs__tab"
          role="tab"
          [class.is-active]="tab.id === activeId()"
          [class.is-disabled]="tab.disabled"
          [attr.aria-selected]="tab.id === activeId()"
          [attr.tabindex]="tab.id === activeId() ? 0 : -1"
          [disabled]="tab.disabled"
          (click)="select(tab)"
          (keydown)="onKeydown($event, i)"
        >
          {{ tab.label }}
        </button>
      }
    </div>
  `,
})
export class TabsComponent {
  @ViewChildren('tabButton') private tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  tabs = input<TabItem[]>([]);
  activeId = input<string | null>(null);

  activeIdChange = output<string>();

  select(tab: TabItem): void {
    if (tab.disabled) return;
    this.activeIdChange.emit(tab.id);
  }

  onKeydown(event: KeyboardEvent, currentIndex: number): void {
    const navKeys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
    if (!navKeys.includes(event.key)) return;

    event.preventDefault();
    const list = this.tabs();
    const enabledIndexes = list.map((t, i) => i).filter((i) => !list[i].disabled);
    if (enabledIndexes.length === 0) return;

    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const posInEnabled = enabledIndexes.indexOf(currentIndex);
    const basePos = posInEnabled === -1 ? 0 : posInEnabled;
    const delta = forward ? 1 : -1;
    const nextPos = (basePos + delta + enabledIndexes.length) % enabledIndexes.length;
    const nextIndex = enabledIndexes[nextPos];

    this.select(list[nextIndex]);
    this.tabButtons.get(nextIndex)?.nativeElement.focus();
  }
}
