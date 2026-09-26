import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../../core/i18n/translate.service';
import { ButtonComponent } from '../../../../shared/ui/button/button';
import { CheckboxComponent } from '../../../../shared/ui/checkbox/checkbox';
import { InputNumberComponent } from '../../../../shared/ui/input-number/input-number';
import { InputTextComponent } from '../../../../shared/ui/input-text/input-text';
import { SelectComponent } from '../../../../shared/ui/select/select';
import { TextareaComponent } from '../../../../shared/ui/textarea/textarea';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AppValidators, controlErrorMessage } from '../../../../shared/utils/validation.utils';

@Component({
  selector: 'app-form-example',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CheckboxComponent,
    InputNumberComponent,
    InputTextComponent,
    SelectComponent,
    TextareaComponent,
    TranslatePipe,
  ],
  templateUrl: './form-example.html',
})
export class FormExampleComponent {
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private translate = inject(TranslateService);

  difficultyOptions = computed(() => {
    this.translate.locale();
    return [
      { value: 'easy', label: this.translate.t('form.difficultyEasy') },
      { value: 'medium', label: this.translate.t('form.difficultyMedium') },
      { value: 'hard', label: this.translate.t('form.difficultyHard') },
    ];
  });

  form = this.fb.group({
    name: ['', AppValidators.required],
    score: [0, [...AppValidators.required, Validators.min(0)]],
    difficulty: ['', AppValidators.required],
    description: [''],
    published: [false],
  });

  errorFor(controlName: string): string | null {
    const control = this.form.get(controlName);
    return control ? controlErrorMessage(control, this.translate) : null;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.toast.success(this.translate.t('form.saveSuccess'));
  }
}
