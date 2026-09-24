import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslateService } from '../../../core/i18n/translate.service';
import { ButtonComponent } from '../button/button';
import { CheckboxComponent } from '../checkbox/checkbox';
import { InputNumberComponent } from '../input-number/input-number';
import { InputTextComponent } from '../input-text/input-text';
import { SelectComponent } from '../select/select';
import { TextareaComponent } from '../textarea/textarea';
import { ToastService } from '../toast/toast.service';

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
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-col gap-4 max-w-md">
      <app-input-text
        [label]="'form.nameLabel' | translate"
        [required]="true"
        formControlName="name"
        [errorMessage]="errorFor('name')"
      />

      <app-input-number
        [label]="'form.scoreLabel' | translate"
        [required]="true"
        [min]="0"
        formControlName="score"
        [errorMessage]="errorFor('score')"
      />

      <app-select
        [label]="'form.difficultyLabel' | translate"
        [placeholder]="'form.difficultyPlaceholder' | translate"
        [options]="difficultyOptions()"
        formControlName="difficulty"
        [errorMessage]="errorFor('difficulty')"
      />

      <app-textarea
        [label]="'form.descriptionLabel' | translate"
        formControlName="description"
        [errorMessage]="errorFor('description')"
      />

      <app-checkbox formControlName="published">{{ 'form.publishNow' | translate }}</app-checkbox>

      <app-button type="submit" [disabled]="form.invalid">{{ 'common.save' | translate }}</app-button>
    </form>
  `,
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
    name: ['', [Validators.required]],
    score: [0, [Validators.required, Validators.min(0)]],
    difficulty: ['', [Validators.required]],
    description: [''],
    published: [false],
  });

  errorFor(controlName: string): string | null {
    const control = this.form.get(controlName);
    if (!control || !control.touched || !control.errors) return null;
    if (control.errors['required']) return this.translate.t('common.required');
    return this.translate.t('common.invalid');
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.toast.success(this.translate.t('form.saveSuccess'));
  }
}
