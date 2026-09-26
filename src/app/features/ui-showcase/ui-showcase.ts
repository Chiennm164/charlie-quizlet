import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslateService } from '../../core/i18n/translate.service';
import { ApiExampleComponent } from './examples/api-example/api-example';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CheckboxComponent } from '../../shared/ui/checkbox/checkbox';
import { CountdownComponent } from '../../shared/ui/countdown/countdown';
import { DatePickerComponent } from '../../shared/ui/date-picker/date-picker';
import { DateRange, DateRangePickerComponent } from '../../shared/ui/date-range-picker/date-range-picker';
import { DateTimePickerComponent } from '../../shared/ui/date-time-picker/date-time-picker';
import { DialogComponent } from '../../shared/ui/dialog/dialog';
import { DropdownComponent, DropdownOption } from '../../shared/ui/dropdown/dropdown';
import { DropdownTreeComponent, TreeNode } from '../../shared/ui/dropdown-tree/dropdown-tree';
import { FormExampleComponent } from './examples/form-example/form-example';
import { GlobalLoadingService } from '../../shared/ui/global-loading/global-loading.service';
import { IconComponent } from '../../shared/ui/icon/icon';
import { InputTextComponent } from '../../shared/ui/input-text/input-text';
import { LanguageSwitcherComponent } from '../../shared/ui/language-switcher/language-switcher';
import { ListComponent } from '../../shared/ui/list/list';
import { LoadingComponent } from '../../shared/ui/loading/loading';
import { PageHeaderComponent } from '../../shared/ui/page-header/page-header';
import { RadioGroupComponent, RadioOption } from '../../shared/ui/radio-group/radio-group';
import { TableColumn, TableComponent } from '../../shared/ui/table/table';
import { TabItem, TabsComponent } from '../../shared/ui/tabs/tabs';
import { TimeSelectComponent } from '../../shared/ui/time-select/time-select';
import { ToastService } from '../../shared/ui/toast/toast.service';

interface Student {
  id: number;
  name: string;
  score: number;
}

@Component({
  selector: 'app-ui-showcase',
  standalone: true,
  imports: [
    ApiExampleComponent,
    ButtonComponent,
    CheckboxComponent,
    CountdownComponent,
    DatePickerComponent,
    DateRangePickerComponent,
    DateTimePickerComponent,
    DialogComponent,
    DropdownComponent,
    DropdownTreeComponent,
    FormExampleComponent,
    FormsModule,
    IconComponent,
    InputTextComponent,
    LanguageSwitcherComponent,
    ListComponent,
    LoadingComponent,
    PageHeaderComponent,
    RadioGroupComponent,
    TableComponent,
    TabsComponent,
    TimeSelectComponent,
    TranslatePipe,
  ],
  templateUrl: './ui-showcase.html',
})
export class UiShowcaseComponent {
  private toast = inject(ToastService);
  private translate = inject(TranslateService);
  private globalLoading = inject(GlobalLoadingService);

  dialogOpen = signal(false);
  dropdownValue = signal<string | null>(null);
  treeValue = signal<string | null>(null);
  radioValue = signal<string | null>('easy');
  activeTabId = signal('info');
  selectedStudents = signal<Student[]>([]);

  today = new Date().toISOString().slice(0, 10);
  dateValue = signal('');
  dateTimeValue = signal('');
  timeValue = signal('');
  dateRangeValue = signal<DateRange>({ from: null, to: null });

  radioOptions = computed<RadioOption[]>(() => {
    this.translate.locale();
    return [
      { value: 'easy', label: this.translate.t('form.difficultyEasy') },
      { value: 'medium', label: this.translate.t('form.difficultyMedium') },
      { value: 'hard', label: this.translate.t('form.difficultyHard') },
    ];
  });

  tabItems = computed<TabItem[]>(() => {
    this.translate.locale();
    return [
      { id: 'info', label: this.translate.t('showcase.tabInfo') },
      { id: 'history', label: this.translate.t('showcase.tabHistory') },
      { id: 'settings', label: this.translate.t('showcase.tabSettings') },
    ];
  });

  /** Dữ liệu demo (chủ đề học tập) — coi như dữ liệu nghiệp vụ, không thuộc phạm vi i18n giao diện. */
  dropdownOptions = computed<DropdownOption[]>(() => [
    { value: 'math', label: 'Toán' },
    { value: 'physics', label: 'Vật lý' },
    { value: 'chemistry', label: 'Hoá học' },
  ]);

  treeNodes = computed<TreeNode[]>(() => [
    {
      value: 'science',
      label: 'Khoa học tự nhiên',
      children: [
        { value: 'math', label: 'Toán' },
        {
          value: 'physics',
          label: 'Vật lý',
          children: [
            { value: 'mechanics', label: 'Cơ học' },
            { value: 'electricity', label: 'Điện học' },
          ],
        },
      ],
    },
    { value: 'social', label: 'Khoa học xã hội' },
  ]);

  students = signal<Student[]>([
    { id: 1, name: 'Nguyễn Văn A', score: 8.5 },
    { id: 2, name: 'Trần Thị B', score: 9 },
  ]);

  columns = computed<TableColumn[]>(() => {
    this.translate.locale();
    return [
      { key: 'name', header: this.translate.t('common.name'), pinned: 'left' },
      { key: 'score', header: this.translate.t('common.score') },
    ];
  });

  confirmDialog(): void {
    this.dialogOpen.set(false);
    this.toast.success(this.translate.t('showcase.confirmed'));
  }

  triggerGlobalLoading(): void {
    this.globalLoading.show();
    setTimeout(() => this.globalLoading.hide(), 2000);
  }

  editStudent(student: Student): void {
    this.toast.success(`${this.translate.t('showcase.editAction')}: ${student.name}`);
  }

  deleteStudent(student: Student): void {
    this.students.update((rows) => rows.filter((s) => s.id !== student.id));
    this.selectedStudents.update((rows) => rows.filter((r) => r.id !== student.id));
  }

  onExamTimeUp(): void {
    this.toast.error(this.translate.t('showcase.examFinished'));
  }
}
