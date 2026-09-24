import { Component, computed, ElementRef, HostListener, inject, input, output, signal } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';
import { IconComponent } from '../icon/icon';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [IconComponent],
  template: `
    <div class="dropdown">
      <button type="button" class="dropdown__trigger" (click)="toggle()">
        <span>{{ selectedLabel() || placeholder() || defaultPlaceholder() }}</span>
        <app-icon name="chevron-down" class="text-text-muted" />
      </button>

      @if (open()) {
        <div class="dropdown__menu">
          @if (searchable()) {
            <div class="dropdown__search">
              <app-icon name="search" class="text-text-muted" />
              <input
                type="text"
                [placeholder]="searchPlaceholder()"
                [value]="query()"
                (input)="query.set($any($event.target).value)"
              />
            </div>
          }

          @if (filteredOptions().length === 0) {
            <div class="dropdown__empty">{{ noResultText() }}</div>
          }

          @for (opt of filteredOptions(); track opt.value) {
            <div
              class="dropdown__item"
              [class.is-selected]="opt.value === value()"
              (click)="select(opt)"
            >
              {{ opt.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class DropdownComponent {
  private host = inject(ElementRef<HTMLElement>);
  private translate = inject(TranslateService);

  options = input<DropdownOption[]>([]);
  /** Để trống sẽ dùng bản dịch mặc định (common.select) theo ngôn ngữ hiện tại. */
  placeholder = input<string | null>(null);
  searchable = input(false);
  value = input<string | null>(null);

  valueChange = output<string>();

  open = signal(false);
  query = signal('');

  defaultPlaceholder = computed(() => {
    this.translate.locale();
    return this.translate.t('common.select');
  });

  searchPlaceholder = computed(() => {
    this.translate.locale();
    return this.translate.t('common.search');
  });

  noResultText = computed(() => {
    this.translate.locale();
    return this.translate.t('common.noResult');
  });

  selectedLabel = computed(
    () => this.options().find((opt) => opt.value === this.value())?.label ?? '',
  );

  filteredOptions = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.options();
    return this.options().filter((opt) => opt.label.toLowerCase().includes(q));
  });

  toggle(): void {
    this.open.update((v) => !v);
  }

  select(opt: DropdownOption): void {
    this.valueChange.emit(opt.value);
    this.open.set(false);
    this.query.set('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
