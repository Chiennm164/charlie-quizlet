import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { APP_SETTINGS } from '../../../core/config';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { User } from '../../../core/models';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { DialogComponent } from '../../../shared/ui/dialog/dialog';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { TableColumn, TableComponent } from '../../../shared/ui/table/table';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { formatDate } from '../../../shared/utils/common.utils';
import { AdminUsersService } from '../admin-users.service';

/** Admin duyệt / từ chối tài khoản Teacher tự đăng ký. */
@Component({
  selector: 'app-pending-users',
  standalone: true,
  imports: [ButtonComponent, DialogComponent, PageHeaderComponent, TableComponent, TranslatePipe],
  templateUrl: './pending-users.html',
})
export class PendingUsersComponent {
  private adminUsers = inject(AdminUsersService);
  private translate = inject(TranslateService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  users = signal<User[]>([]);
  loading = signal(true);
  /** Id user đang được duyệt / từ chối — khoá nút của dòng đó để không bấm 2 lần. */
  processingId = signal<number | null>(null);
  /** User đang chờ xác nhận từ chối (mở dialog). */
  rejecting = signal<User | null>(null);

  columns = computed<TableColumn[]>(() => {
    const locale = APP_SETTINGS.i18n.formatLocale[this.translate.locale()];
    return [
      { key: 'fullName', header: this.translate.t('auth.fullName') },
      { key: 'email', header: this.translate.t('auth.email') },
      {
        key: 'role',
        header: this.translate.t('home.role'),
        render: (row) => this.translate.t(`home.roles.${(row as User).role}`),
      },
      {
        key: 'createdAt',
        header: this.translate.t('admin.pendingUsers.registeredAt'),
        render: (row) => formatDate((row as User).createdAt, locale),
      },
    ];
  });

  trackById = (row: unknown) => (row as User).id;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.adminUsers
      .listPending()
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((users) => this.users.set(users));
  }

  approve(user: User): void {
    if (this.processingId()) return;
    this.processingId.set(user.id);
    this.adminUsers
      .approve(user.id)
      .pipe(
        finalize(() => this.processingId.set(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.removeRow(user.id);
          this.toast.success(
            this.translate.t('admin.pendingUsers.approved', { name: user.fullName }),
          );
        },
        // Lỗi đã hiện ở dialog chung; tải lại vì danh sách có thể đã cũ (vd. Admin khác vừa xử lý).
        error: () => this.load(),
      });
  }

  confirmReject(): void {
    const user = this.rejecting();
    if (!user || this.processingId()) return;
    this.processingId.set(user.id);
    this.adminUsers
      .reject(user.id)
      .pipe(
        finalize(() => {
          this.processingId.set(null);
          this.rejecting.set(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.removeRow(user.id);
          this.toast.success(
            this.translate.t('admin.pendingUsers.rejected', { name: user.fullName }),
          );
        },
        error: () => this.load(),
      });
  }

  asUser(row: unknown): User {
    return row as User;
  }

  private removeRow(id: number): void {
    this.users.update((users) => users.filter((u) => u.id !== id));
  }
}
