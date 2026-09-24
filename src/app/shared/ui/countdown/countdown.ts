import { Component, computed, effect, input, output, signal } from '@angular/core';

/**
 * Đếm ngược tới 1 mốc thời gian (`targetDate`) hoặc đếm ngược N giây (`seconds`).
 * Tự tick mỗi giây, phát `finished` đúng 1 lần khi về 0, tự dọn interval khi component bị huỷ.
 */
@Component({
  selector: 'app-countdown',
  standalone: true,
  template: `
    <span class="countdown" [class.countdown--danger]="isUrgent()">
      {{ display() }}
    </span>
  `,
  styles: `
    .countdown {
      font-variant-numeric: tabular-nums;
    }
    .countdown--danger {
      color: var(--cq-danger);
    }
  `,
})
export class CountdownComponent {
  /** Mốc thời gian đích (ISO string, Date, hoặc epoch ms). Ưu tiên hơn `seconds` nếu cả 2 đều truyền. */
  targetDate = input<Date | string | number | null>(null);
  /** Đếm ngược N giây kể từ lúc component khởi tạo (dùng khi không có mốc thời gian cụ thể, vd. giờ làm bài thi). */
  seconds = input<number | null>(null);
  /** Ngưỡng (giây) để chuyển màu cảnh báo, mặc định 60s cuối. */
  urgentThreshold = input(60);

  finished = output<void>();

  private remainingMs = signal(0);
  private hasFinished = false;

  private endAt = computed(() => {
    const target = this.targetDate();
    if (target !== null) return new Date(target).getTime();

    const secs = this.seconds();
    if (secs !== null) return Date.now() + secs * 1000;

    return null;
  });

  remainingSeconds = computed(() => Math.max(0, Math.ceil(this.remainingMs() / 1000)));

  isUrgent = computed(() => this.remainingSeconds() > 0 && this.remainingSeconds() <= this.urgentThreshold());

  display = computed(() => {
    const total = this.remainingSeconds();
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  });

  constructor() {
    effect((onCleanup) => {
      const endAt = this.endAt();
      if (endAt === null) return;

      const tick = () => {
        const remaining = endAt - Date.now();
        this.remainingMs.set(remaining);
        if (remaining <= 0 && !this.hasFinished) {
          this.hasFinished = true;
          this.finished.emit();
        }
      };

      tick();
      const intervalId = setInterval(tick, 1000);
      onCleanup(() => clearInterval(intervalId));
    });
  }
}
