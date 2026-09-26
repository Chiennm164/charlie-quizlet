import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { APP_SETTINGS } from '../../../core/config';
import { QuizQuestion, QuizQuestionRequest } from '../../../core/models';
import {
  minItemsValidator,
  notBlankValidator,
  uniqueValuesValidator,
} from '../../../shared/utils/validation.utils';

/*
 * Form của trình soạn đề. Đáp án đúng lưu bằng vị trí (`correctIndex`) trên câu hỏi thay vì cờ `correct` trên từng
 * đáp án: radio chọn đúng 1 đáp án là tự nhiên, không cần validator "đúng 1 đáp án đúng". Chuyển về `correct`
 * khi gửi BE (toQuestionRequest).
 */

const v = APP_SETTINGS.validation;

export type OptionForm = FormGroup<{
  /** null = đáp án mới chưa lưu. */
  id: FormControl<number | null>;
  content: FormControl<string>;
}>;

export type QuestionForm = FormGroup<{
  /** null = câu mới chưa lưu. */
  id: FormControl<number | null>;
  content: FormControl<string>;
  explanation: FormControl<string>;
  correctIndex: FormControl<number | null>;
  options: FormArray<OptionForm>;
}>;

/** Số đáp án của 1 câu mới (A–D). */
export const DEFAULT_OPTION_COUNT = 4;

export function createOption(id: number | null = null, content = ''): OptionForm {
  return new FormGroup({
    id: new FormControl<number | null>(id),
    content: new FormControl(content, {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(v.optionContentMaxLength)],
    }),
  });
}

/** Câu hỏi mới (4 đáp án trống) hoặc nạp từ câu đã có. */
export function createQuestion(question?: QuizQuestion): QuestionForm {
  const options = question
    ? question.options.map((option) => createOption(option.id, option.content))
    : Array.from({ length: DEFAULT_OPTION_COUNT }, () => createOption());
  const correctIndex = question ? question.options.findIndex((option) => option.correct) : -1;

  return new FormGroup({
    id: new FormControl<number | null>(question?.id ?? null),
    content: new FormControl(question?.content ?? '', {
      nonNullable: true,
      validators: [notBlankValidator, Validators.maxLength(v.questionContentMaxLength)],
    }),
    explanation: new FormControl(question?.explanation ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(v.questionExplanationMaxLength)],
    }),
    correctIndex: new FormControl<number | null>(correctIndex >= 0 ? correctIndex : null, {
      validators: [Validators.required],
    }),
    options: new FormArray(options, [
      minItemsValidator(v.questionMinOptions),
      uniqueValuesValidator('content'),
    ]),
  });
}

/** Xoá đáp án và giữ đúng đáp án đúng đang chọn (vị trí dồn lên khi xoá đáp án đứng trước nó). */
export function removeOption(question: QuestionForm, index: number): void {
  const { correctIndex, options } = question.controls;
  options.removeAt(index);
  const correct = correctIndex.value;
  if (correct === index) correctIndex.setValue(null);
  else if (correct !== null && correct > index) correctIndex.setValue(correct - 1);
  question.markAsDirty();
}

export function toQuestionRequest(question: QuestionForm): QuizQuestionRequest {
  const { id, content, explanation, correctIndex, options } = question.getRawValue();
  return {
    id,
    content: content.trim(),
    explanation: explanation.trim() || null,
    options: options.map((option, i) => ({
      id: option.id,
      content: option.content.trim(),
      correct: i === correctIndex,
    })),
  };
}
