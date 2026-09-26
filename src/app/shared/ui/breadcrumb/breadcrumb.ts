import { Component, input } from '@angular/core';
import { Params, RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon';

export interface BreadcrumbItem {
  label: string;
  /** Bỏ trống = mục hiện tại (không bấm được). */
  url?: string;
  queryParams?: Params;
}

/** Đường dẫn "Trang chủ › Bộ đề › Toán" phía trên tiêu đề trang con, để quay lại cấp trên. */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <ol class="breadcrumb__list">
        @for (item of items(); track $index; let last = $last) {
          <li class="breadcrumb__item">
            @if (item.url && !last) {
              <a
                class="breadcrumb__link"
                [routerLink]="item.url"
                [queryParams]="item.queryParams"
                >{{ item.label }}</a
              >
              <app-icon name="chevron-right" class="breadcrumb__separator" />
            } @else {
              <span class="breadcrumb__current" aria-current="page">{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class BreadcrumbComponent {
  items = input.required<BreadcrumbItem[]>();
}
