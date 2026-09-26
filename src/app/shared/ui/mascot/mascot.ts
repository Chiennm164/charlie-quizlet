import { Component, input } from '@angular/core';

export type MascotMood = 'happy' | 'sad';

/**
 * Linh vật mèo chibi của app (SVG inline, màu lấy từ token --cq-mascot-*). Kích thước theo khung chứa
 * (đặt class w-* / h-* ở nơi dùng). Trang trí thuần tuý nên ẩn với trình đọc màn hình.
 *   happy: logo, trang đăng nhập;  sad: trang 403, không tìm thấy.
 */
@Component({
  selector: 'app-mascot',
  standalone: true,
  host: { class: 'inline-block', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 120 112" class="w-full h-full block overflow-visible">
      <g
        stroke="var(--cq-mascot-line)"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <!-- Tai -->
        <path d="M24 46 L20 10 L52 30 Z" fill="var(--cq-mascot-body)" />
        <path d="M96 46 L100 10 L68 30 Z" fill="var(--cq-mascot-body)" />
        <path d="M27 36 L25 19 L41 29 Z" fill="var(--cq-mascot-ear)" stroke="none" />
        <path d="M93 36 L95 19 L79 29 Z" fill="var(--cq-mascot-ear)" stroke="none" />
        <!-- Đầu -->
        <ellipse cx="60" cy="66" rx="50" ry="42" fill="var(--cq-mascot-body)" />
      </g>

      <!-- Má hồng -->
      <ellipse cx="30" cy="80" rx="9" ry="5.5" fill="var(--cq-mascot-blush)" opacity="0.75" />
      <ellipse cx="90" cy="80" rx="9" ry="5.5" fill="var(--cq-mascot-blush)" opacity="0.75" />

      <!-- Mắt to, có đốm sáng -->
      <ellipse cx="42" cy="66" rx="7" ry="9" fill="var(--cq-mascot-line)" />
      <ellipse cx="78" cy="66" rx="7" ry="9" fill="var(--cq-mascot-line)" />
      <circle cx="44.5" cy="62" r="3" fill="var(--cq-surface)" />
      <circle cx="80.5" cy="62" r="3" fill="var(--cq-surface)" />

      @if (mood() === 'happy') {
        <!-- Miệng mèo "ω" -->
        <path
          d="M52 82 Q56 88 60 82 Q64 88 68 82"
          fill="none"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      } @else {
        <!-- Lông mày chùng xuống + miệng mếu + giọt nước mắt -->
        <path
          d="M33 57 L46 51 M87 57 L74 51"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <path
          d="M52 88 Q60 80 68 88"
          fill="none"
          stroke="var(--cq-mascot-line)"
          stroke-width="3.5"
          stroke-linecap="round"
        />
        <path d="M86 74 Q83 81 86 84 Q89 81 86 74 Z" fill="var(--cq-info)" opacity="0.7" />
      }
    </svg>
  `,
})
export class MascotComponent {
  mood = input<MascotMood>('happy');
}
