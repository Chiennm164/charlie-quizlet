import { Component, HostBinding, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_REGISTRY, IconName } from './icon-registry';

/**
 * Icon dùng SVG inline (thay vì <img src="...svg">) nên đổi màu được qua
 * CSS `color` — set màu bằng class Tailwind, vd: <app-icon name="close" class="text-danger" />
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="cq-icon" [innerHTML]="svg()"></span>`,
  styles: `
    /* Trong layer như class BEM -> nơi dùng ẩn / hiện icon bằng utility (hidden sm:inline-flex) được. */
    @layer components {
      :host {
        display: inline-flex;
      }
    }
    .cq-icon {
      display: inline-flex;
      width: 1em;
      height: 1em;
    }
    .cq-icon ::ng-deep svg {
      width: 100%;
      height: 100%;
    }
  `,
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  name = input.required<IconName>();
  size = input<number | null>(null);

  @HostBinding('style.font-size.px')
  get fontSize(): number | null {
    return this.size();
  }

  svg = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(ICON_REGISTRY[this.name()]),
  );
}
