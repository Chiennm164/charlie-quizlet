import { Component } from '@angular/core';

/** Hình minh hoạ chồng thẻ ghi nhớ trên panel trái của trang auth (SVG inline, màu theo token). */
@Component({
  selector: 'app-auth-illustration',
  standalone: true,
  template: `
    <svg viewBox="0 0 320 240" fill="none" class="w-full h-auto" aria-hidden="true">
      <circle cx="46" cy="52" r="6" class="fill-text-inverse/50" />
      <circle cx="282" cy="40" r="4" class="fill-text-inverse/60" />
      <circle cx="292" cy="196" r="7" class="fill-text-inverse/30" />
      <rect
        x="70"
        y="38"
        width="180"
        height="120"
        rx="14"
        transform="rotate(-9 160 98)"
        class="fill-text-inverse/20"
      />
      <rect
        x="70"
        y="50"
        width="180"
        height="120"
        rx="14"
        transform="rotate(5 160 110)"
        class="fill-text-inverse/40"
      />
      <rect x="56" y="72" width="208" height="134" rx="16" class="fill-surface" />
      <rect x="82" y="98" width="112" height="12" rx="6" class="fill-primary" />
      <rect x="82" y="124" width="156" height="8" rx="4" class="fill-primary/25" />
      <rect x="82" y="140" width="132" height="8" rx="4" class="fill-primary/25" />
      <rect x="82" y="156" width="90" height="8" rx="4" class="fill-primary/25" />
      <circle cx="232" cy="178" r="17" class="fill-success" />
      <path
        d="M224 178l6 6 10-11"
        stroke-width="3.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="stroke-text-inverse"
      />
    </svg>
  `,
})
export class AuthIllustrationComponent {}
