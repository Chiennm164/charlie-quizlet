import { Component, inject, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { APP_SETTINGS } from '../../../../core/config';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { IconComponent } from '../../../../shared/ui/icon/icon';
import { InputTextComponent } from '../../../../shared/ui/input-text/input-text';
import { TextErrorComponent } from '../../../../shared/ui/text-error/text-error';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea';
import { controlErrorMessage } from '../../../../shared/utils/validation.utils';
import { QuestionForm, createOption, removeOption } from '../quiz-form';

const { questionMinOptions, questionMaxOptions } = APP_SETTINGS.validation;
const LETTERS = 'ABCDEF';
let nextId = 0;

/**
 * 1 câu hỏi trong trình soạn đề: nội dung, 2–6 đáp án (radio chọn đáp án đúng), lời giải thích.
 * Nhận FormGroup từ component cha (cha giữ FormArray câu hỏi, kéo thả, lưu). Tay nắm kéo thả nằm ở đây,
 * cdkDrag đặt trên thẻ <app-question-editor> ở cha.
 */
@Component({
  selector: 'app-question-editor',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CdkDragHandle,
    IconComponent,
    InputTextComponent,
    TextErrorComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './question-editor.html',
})
export class QuestionEditorComponent {
  private translate = inject(TranslateService);

  form = input.required<QuestionForm>();
  /** Vị trí trong đề, bắt đầu từ 0. */
  index = input.required<number>();
  removed = output<void>();

  /** name chung cho các radio của câu này (mỗi câu 1 nhóm). */
  readonly radioName = `correct-option-${nextId++}`;
  readonly minOptions = questionMinOptions;
  readonly maxOptions = questionMaxOptions;

  letter(i: number): string {
    return LETTERS[i] ?? String(i + 1);
  }

  errorFor(control: FormControl<string>): string | null {
    return controlErrorMessage(control, this.translate);
  }

  /** Chưa chọn đáp án đúng — báo dưới danh sách đáp án. */
  correctError(): string | null {
    const control = this.form().controls.correctIndex;
    return control.touched && control.invalid
      ? this.translate.t('adminQuiz.correctRequired')
      : null;
  }

  selectCorrect(i: number): void {
    const control = this.form().controls.correctIndex;
    control.setValue(i);
    control.markAsTouched();
    control.markAsDirty();
  }

  addOption(): void {
    const options = this.form().controls.options;
    if (options.length >= questionMaxOptions) return;
    options.push(createOption());
    options.markAsDirty();
  }

  removeOption(i: number): void {
    if (this.form().controls.options.length <= questionMinOptions) return;
    removeOption(this.form(), i);
  }
}
