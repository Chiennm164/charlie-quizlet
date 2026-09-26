import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialogService } from '../../../core/confirm/confirm-dialog.service';
import { ERROR_CODES, ROUTES, studySetEditUrl } from '../../../core/config';
import { handleErrorCode } from '../../../core/error/error-handling';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { StudySet } from '../../../core/models';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { StudySetsService } from '../study-sets.service';

/** Xem học phần (`/study-sets/:id`): thông tin + danh sách thẻ; chủ học phần thấy nút sửa / xoá. */
@Component({
  selector: 'app-study-set-detail',
  standalone: true,
  imports: [
    RouterLink,
    ButtonComponent,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    TranslatePipe,
  ],
  templateUrl: './study-set-detail.html',
})
export class StudySetDetailComponent {
  private studySets = inject(StudySetsService);
  private auth = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly editUrl = studySetEditUrl(this.id);
  readonly listUrl = ROUTES.studySets;

  set = signal<StudySet | null>(null);
  loading = signal(true);
  notFound = signal(false);
  deleting = signal(false);

  isOwner = computed(() => this.set()?.owner.id === this.auth.currentUser()?.id);

  constructor() {
    this.studySets
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (set) => this.set.set(set),
        // Không tồn tại / riêng tư của người khác -> hiện ngay trên trang thay vì dialog lỗi.
        error: (err: unknown) =>
          handleErrorCode(err, ERROR_CODES.STUDY_SET_NOT_FOUND, () => this.notFound.set(true)),
      });
  }

  async confirmDelete(): Promise<void> {
    const set = this.set();
    if (!set || this.deleting()) return;
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.t('studySet.deleteTitle'),
      message: this.translate.t('studySet.deleteConfirm', { title: set.title }),
      confirmText: this.translate.t('studySet.delete'),
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.studySets
      .delete(set.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.toast.success(this.translate.t('studySet.deleted', { title: set.title }));
        this.router.navigateByUrl(ROUTES.studySets);
      });
  }
}
