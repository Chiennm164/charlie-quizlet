import { Component } from '@angular/core';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';

/**
 * Hình minh hoạ trên panel trái của trang auth: chồng thẻ ghi nhớ + linh vật hổ chibi ló ra ở góc
 * (SVG inline, màu theo token).
 */
@Component({
  selector: 'app-auth-illustration',
  standalone: true,
  imports: [MascotComponent],
  template: `
    <div class="relative">
      <svg viewBox="0 0 320 240" fill="none" class="w-full h-auto" aria-hidden="true">
        <!-- Sao lấp lánh -->
        <path d="M46 40 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" class="fill-text-inverse/70" />
        <path d="M284 30 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" class="fill-text-inverse/60" />
        <circle cx="292" cy="196" r="7" class="fill-text-inverse/30" />
        <rect
          x="70"
          y="38"
          width="180"
          height="120"
          rx="22"
          transform="rotate(-9 160 98)"
          class="fill-text-inverse/20"
        />
        <rect
          x="70"
          y="50"
          width="180"
          height="120"
          rx="22"
          transform="rotate(5 160 110)"
          class="fill-text-inverse/40"
        />
        <rect x="56" y="72" width="208" height="134" rx="24" class="fill-surface" />
        <rect x="112" y="98" width="112" height="12" rx="6" class="fill-primary" />
        <rect x="112" y="124" width="126" height="8" rx="4" class="fill-primary/25" />
        <rect x="112" y="140" width="104" height="8" rx="4" class="fill-primary/25" />
        <rect x="112" y="156" width="72" height="8" rx="4" class="fill-primary/25" />
        <circle cx="232" cy="182" r="17" class="fill-success" />
        <path
          d="M224 182l6 6 10-11"
          stroke-width="3.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="stroke-text-inverse"
        />
      </svg>
      <app-mascot class="absolute left-0 bottom-0 w-[34%] anim-float" />
    </div>
  `,
})
export class AuthIllustrationComponent {}
