import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  host: { '[class.block]': 'block()' },
  template: `
    <button
      [type]="type()"
      class="btn"
      [class.btn--primary]="variant() === 'primary'"
      [class.btn--secondary]="variant() === 'secondary'"
      [class.btn--danger]="variant() === 'danger'"
      [class.btn--ghost]="variant() === 'ghost'"
      [class.btn--sm]="size() === 'sm'"
      [class.btn--md]="size() === 'md'"
      [class.btn--lg]="size() === 'lg'"
      [class.btn--block]="block()"
      [class.is-loading]="loading()"
      [disabled]="disabled() || loading()"
      (click)="clicked.emit($event)"
    >
      @if (loading()) {
        <span class="loading__spinner" aria-hidden="true" animate.enter="anim-scale-in"></span>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  type = input<'button' | 'submit'>('button');
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  disabled = input(false);
  loading = input(false);
  /** Nút rộng full chiều ngang khung chứa (vd. nút submit của form auth). */
  block = input(false);

  clicked = output<MouseEvent>();
}
