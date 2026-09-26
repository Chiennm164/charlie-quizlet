import { Component, input, output } from '@angular/core';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { IconComponent } from '../icon/icon';

export type DialogSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [IconComponent, TranslatePipe],
  template: `
    @if (open()) {
      <div
        class="dialog__overlay"
        animate.enter="anim-fade-in"
        animate.leave="dialog__overlay--leave"
        (click)="onOverlayClick($event)"
      >
        <div
          class="dialog"
          [class.dialog--sm]="size() === 'sm'"
          [class.dialog--md]="size() === 'md'"
          [class.dialog--lg]="size() === 'lg'"
          (click)="$event.stopPropagation()"
        >
          <div class="dialog__header">
            <span>{{ title() }}</span>
            <button
              type="button"
              class="btn btn--ghost btn--sm"
              [attr.aria-label]="'common.close' | translate"
              (click)="closed.emit()"
            >
              <app-icon name="close" class="text-text-muted" />
            </button>
          </div>
          <div class="dialog__body">
            <ng-content />
          </div>
          <div class="dialog__footer">
            <ng-content select="[dialog-footer]" />
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  open = input(false);
  title = input('');
  size = input<DialogSize>('md');
  closeOnOverlay = input(true);

  closed = output<void>();

  onOverlayClick(event: MouseEvent): void {
    if (this.closeOnOverlay() && event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
