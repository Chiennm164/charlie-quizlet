import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GlobalLoadingService {
  private pendingCount = signal(0);

  loading = computed(() => this.pendingCount() > 0);

  show(): void {
    this.pendingCount.update((count) => count + 1);
  }

  hide(): void {
    this.pendingCount.update((count) => Math.max(0, count - 1));
  }
}
