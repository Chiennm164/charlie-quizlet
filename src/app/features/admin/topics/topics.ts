import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import { ConfirmDialogService } from '../../../core/confirm/confirm-dialog.service';
import { ERROR_CODES, ROUTES } from '../../../core/config';
import { handleErrorCode } from '../../../core/error/error-handling';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Topic } from '../../../core/models';
import { ButtonComponent } from '../../../shared/ui/button/button';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { InputTextComponent } from '../../../shared/ui/input-text/input-text';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AppValidators, controlErrorMessage } from '../../../shared/utils/validation.utils';
import { QuizzesService } from '../../quizzes/quizzes.service';
import { AdminTopicsService } from '../admin-topics.service';

/** Quản lý chủ đề (`/admin/topics`, ADMIN): thêm, đổi tên ngay trên dòng, xoá chủ đề chưa có bộ đề. */
@Component({
  selector: 'app-admin-topics',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonComponent,
    IconComponent,
    InputTextComponent,
    LoadingComponent,
    PageHeaderComponent,
    TranslatePipe,
  ],
  templateUrl: './topics.html',
})
export class AdminTopicsComponent {
  private quizzes = inject(QuizzesService);
  private adminTopics = inject(AdminTopicsService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly adminQuizzesUrl = ROUTES.adminQuizzes;
  readonly newQuizUrl = ROUTES.adminQuizNew;

  topics = signal<Topic[] | null>(null);
  saving = signal(false);
  /** Chủ đề đang đổi tên (dòng đó chuyển thành ô nhập). */
  editingId = signal<number | null>(null);

  // Bọc trong FormGroup để <form [formGroup]> bắt (ngSubmit) — không có thì Enter submit form kiểu trình duyệt.
  newForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: AppValidators.topicName }),
  });
  editForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: AppValidators.topicName }),
  });
  readonly newName = this.newForm.controls.name;
  readonly editName = this.editForm.controls.name;

  constructor() {
    this.reload();
  }

  errorFor(control: FormControl<string>): string | null {
    return controlErrorMessage(control, this.translate);
  }

  create(): void {
    this.newName.markAsTouched();
    if (this.newName.invalid || this.saving()) return;
    this.save(this.adminTopics.create(this.newName.value.trim()), this.newName, () => {
      this.newName.reset();
      this.toast.success(this.translate.t('adminTopic.created'));
    });
  }

  startRename(topic: Topic): void {
    this.editingId.set(topic.id);
    this.editName.reset(topic.name);
  }

  cancelRename(): void {
    this.editingId.set(null);
  }

  rename(topic: Topic): void {
    this.editName.markAsTouched();
    if (this.editName.invalid || this.saving()) return;
    this.save(this.adminTopics.rename(topic.id, this.editName.value.trim()), this.editName, () => {
      this.editingId.set(null);
      this.toast.success(this.translate.t('adminTopic.renamed'));
    });
  }

  async delete(topic: Topic): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.translate.t('adminTopic.deleteTitle'),
      message: this.translate.t('adminTopic.deleteConfirm', { name: topic.name }),
      confirmText: this.translate.t('common.delete'),
      danger: true,
    });
    if (!confirmed) return;
    // Chủ đề còn bộ đề: BE báo TOPIC_IN_USE qua dialog lỗi chung (nút xoá đã khoá, nhưng dữ liệu có thể vừa đổi).
    this.save(this.adminTopics.delete(topic.id), null, () =>
      this.toast.success(this.translate.t('adminTopic.deleted', { name: topic.name })),
    );
  }

  /** Gửi 1 thay đổi rồi tải lại danh sách. Trùng tên -> báo dưới ô đang nhập thay vì dialog. */
  private save<T>(
    request$: Observable<T>,
    nameControl: FormControl<string> | null,
    done: () => void,
  ): void {
    this.saving.set(true);
    request$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          done();
          this.reload();
        },
        error: (err: unknown) => {
          if (nameControl) {
            handleErrorCode(err, ERROR_CODES.TOPIC_NAME_TAKEN, () =>
              nameControl.setErrors({ topicNameTaken: true }),
            );
          }
          this.reload();
        },
      });
  }

  private reload(): void {
    this.quizzes
      .listTopics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((topics) => this.topics.set(topics));
  }
}
