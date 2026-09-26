import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ERROR_CODES, ROUTES, studySetUrl } from '../../../core/config';
import { handleErrorCode } from '../../../core/error/error-handling';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { StudySet } from '../../../core/models';
import { ShortcutDirective } from '../../../shared/directives/shortcut.directive';
import { CheckboxComponent } from '../../../shared/ui/checkbox/checkbox';
import { IconComponent } from '../../../shared/ui/icon/icon';
import { LoadingComponent } from '../../../shared/ui/loading/loading';
import { MascotComponent } from '../../../shared/ui/mascot/mascot';
import { StudySetsService } from '../study-sets.service';
import { FlashcardSession } from './flashcard-session';

/**
 * Học thẻ ghi nhớ (`/study-sets/:id/flashcards`): lật thẻ, đánh dấu đã nhớ / chưa nhớ, vòng sau chỉ còn thẻ
 * chưa nhớ. Logic phiên học ở FlashcardSession; component chỉ nạp học phần + nối giao diện / phím tắt.
 */
@Component({
  selector: 'app-flashcards',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ShortcutDirective,
    CheckboxComponent,
    IconComponent,
    LoadingComponent,
    MascotComponent,
    TranslatePipe,
  ],
  templateUrl: './flashcards.html',
})
export class FlashcardsComponent {
  private studySets = inject(StudySetsService);
  private destroyRef = inject(DestroyRef);

  private readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  readonly setUrl = studySetUrl(this.id);
  readonly listUrl = ROUTES.studySets;

  readonly session = new FlashcardSession();
  set = signal<StudySet | null>(null);
  loading = signal(true);
  notFound = signal(false);
  shuffleControl = new FormControl(false, { nonNullable: true });
  /** Mặt trước là định nghĩa (đảo mặt), để luyện nhớ theo chiều ngược lại. Chỉ đổi cách hiển thị. */
  definitionFirstControl = new FormControl(false, { nonNullable: true });
  definitionFirst = toSignal(this.definitionFirstControl.valueChanges, { initialValue: false });

  constructor() {
    this.studySets
      .get(this.id)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (set) => {
          this.set.set(set);
          this.session.start(set.cards, { shuffle: this.shuffleControl.value });
        },
        error: (err: unknown) =>
          handleErrorCode(err, ERROR_CODES.STUDY_SET_NOT_FOUND, () => this.notFound.set(true)),
      });

    // Đổi trộn thẻ -> học lại từ đầu với thứ tự mới.
    this.shuffleControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((shuffle) => this.session.setShuffle(shuffle));
  }
}
