import { Component, input } from '@angular/core';

export type MascotMood = 'happy' | 'sad';

/**
 * Linh vật hổ chibi của app (SVG inline, màu lấy từ token --cq-mascot-*). Kích thước theo khung chứa
 * (đặt class w-* / h-* ở nơi dùng). Trang trí thuần tuý nên ẩn với trình đọc màn hình.
 *   happy: logo, trang đăng nhập;  sad: trang 403, không tìm thấy.
 */
@Component({
  selector: 'app-mascot',
  standalone: true,
  host: { class: 'inline-block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 112" class="w-full h-full block overflow-visible">
      <g stroke="var(--cq-mascot-line)" stroke-width="4" stroke-linejoin="round">
        <!-- Tai tròn -->
        <circle cx="25" cy="32" r="14" fill="var(--cq-mascot-body)" />
        <circle cx="95" cy="32" r="14" fill="var(--cq-mascot-body)" />
        <!-- Đầu -->
        <ellipse cx="60" cy="66" rx="50" ry="42" fill="var(--cq-mascot-body)" />
      </g>
      <circle cx="26" cy="33" r="7" fill="var(--cq-mascot-ear)" />
      <circle cx="94" cy="33" r="7" fill="var(--cq-mascot-ear)" />

      <!-- Vằn: 3 vạch trên trán + 2 vạch mỗi bên má -->
      <g fill="none" stroke="var(--cq-mascot-stripe)" stroke-width="4" stroke-linecap="round">
        <path d="M60 26 V38 M47 29 Q50 34 48 40 M73 29 Q70 34 72 40" />
        <path d="M11 60 Q18 62 22 66 M12 72 Q17 72 21 75" />
        <path d="M109 60 Q102 62 98 66 M108 72 Q103 72 99 75" />
      </g>

      <!-- Mõm -->
      <ellipse cx="60" cy="84" rx="19" ry="13" fill="var(--cq-mascot-muzzle)" />

      <!-- Má hồng -->
      <ellipse cx="30" cy="80" rx="8" ry="5" fill="var(--cq-mascot-blush)" opacity="0.7" />
      <ellipse cx="90" cy="80" rx="8" ry="5" fill="var(--cq-mascot-blush)" opacity="0.7" />

      <!-- Mắt to, có đốm sáng -->
      <ellipse cx="42" cy="62" rx="7" ry="9" fill="var(--cq-mascot-line)" />
      <ellipse cx="78" cy="62" rx="7" ry="9" fill="var(--cq-mascot-line)" />
      <circle cx="44.5" cy="58" r="3" fill="var(--cq-surface)" />
      <circle cx="80.5" cy="58" r="3" fill="var(--cq-surface)" />

      <!-- Mũi -->
      <path
        d="M54 75 Q60 72 66 75 Q63 80 60 81 Q57 80 54 75 Z"
        fill="var(--cq-mascot-line)"
        stroke="var(--cq-mascot-line)"
        stroke-width="1.5"
        stroke-linejoin="round"
      />

      @if (mood() === 'happy') {
        <!-- Miệng "ω" -->
        <path
          d="M51 84 Q55.5 90 60 84 Q64.5 90 69 84"
          fill="none"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      } @else {
        <!-- Lông mày chùng xuống (đầu trong nhướng lên) + miệng mếu + giọt nước mắt -->
        <path
          d="M33 51 L46 46 M87 51 L74 46"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <path
          d="M52 91 Q60 84 68 91"
          fill="none"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <path d="M87 70 Q84 77 87 80 Q90 77 87 70 Z" fill="var(--cq-info)" opacity="0.7" />
      }
    </svg>
  `,
})
export class MascotComponent {
  mood = input<MascotMood>('happy');
}
