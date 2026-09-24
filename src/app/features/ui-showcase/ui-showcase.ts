import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslateService } from '../../core/i18n/translate.service';
import { ApiExampleComponent } from '../../shared/ui/api-example/api-example';
import { ButtonComponent } from '../../shared/ui/button/button';
import { CheckboxComponent } from '../../shared/ui/checkbox/checkbox';
import { CountdownComponent } from '../../shared/ui/countdown/countdown';
import { DatePickerComponent } from '../../shared/ui/date-picker/date-picker';
import { DateRange, DateRangePickerComponent } from '../../shared/ui/date-range-picker/date-range-picker';
import { DateTimePickerComponent } from '../../shared/ui/date-time-picker/date-time-picker';
import { DialogComponent } from '../../shared/ui/dialog/dialog';
import { DropdownComponent, DropdownOption } from '../../shared/ui/dropdown/dropdown';
import { DropdownTreeComponent, TreeNode } from '../../shared/ui/dropdown-tree/dropdown-tree';
import { FormExampleComponent } from '../../shared/ui/form-example/form-example';
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
  template: `
    <div class="flex flex-col gap-8 p-6">
      <div class="flex items-start justify-between gap-4">
        <app-page-header [title]="'showcase.title' | translate" [description]="'showcase.description' | translate" />
        <app-language-switcher />
      </div>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionButton' | translate }}</h2>
        <div class="flex gap-2 flex-wrap">
          <app-button variant="primary">{{ 'showcase.buttonPrimary' | translate }}</app-button>
          <app-button variant="secondary">{{ 'showcase.buttonSecondary' | translate }}</app-button>
          <app-button variant="danger">{{ 'showcase.buttonDanger' | translate }}</app-button>
          <app-button variant="ghost">{{ 'showcase.buttonGhost' | translate }}</app-button>
          <app-button [disabled]="true">{{ 'showcase.buttonDisabled' | translate }}</app-button>
          <app-button [loading]="true">{{ 'showcase.buttonLoading' | translate }}</app-button>
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionLoading' | translate }}</h2>
        <app-loading />
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionGlobalLoading' | translate }}</h2>
        <app-button (clicked)="triggerGlobalLoading()">{{ 'showcase.triggerGlobalLoading' | translate }}</app-button>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionIcon' | translate }}</h2>
        <div class="flex items-center gap-4 text-2xl">
          <app-icon name="check-circle" class="text-success" />
          <app-icon name="alert-circle" class="text-danger" />
          <app-icon name="warning" class="text-warning" />
          <app-icon name="info-circle" class="text-info" />
          <app-icon name="search" class="text-primary" />
          <app-icon name="close" class="text-text-muted" />
        </div>
      </section>

      <section class="flex flex-col gap-2 max-w-xs">
        <h2 class="font-bold">{{ 'showcase.sectionDropdown' | translate }}</h2>
        <app-dropdown
          [options]="dropdownOptions()"
          [searchable]="true"
          [value]="dropdownValue()"
          (valueChange)="dropdownValue.set($event)"
        />
      </section>

      <section class="flex flex-col gap-2 max-w-xs">
        <h2 class="font-bold">{{ 'showcase.sectionDropdownTree' | translate }}</h2>
        <app-dropdown-tree
          [nodes]="treeNodes()"
          [value]="treeValue()"
          (valueChange)="treeValue.set($event)"
        />
      </section>

      <section class="flex flex-col gap-2 max-w-xs">
        <h2 class="font-bold">{{ 'showcase.sectionCheckbox' | translate }}</h2>
        <app-checkbox>{{ 'showcase.checkboxLabel' | translate }}</app-checkbox>
      </section>

      <section class="flex flex-col gap-2 max-w-xs">
        <h2 class="font-bold">{{ 'showcase.sectionRadio' | translate }}</h2>
        <app-radio-group
          [label]="'showcase.difficultyRadioLabel' | translate"
          [options]="radioOptions()"
          [value]="radioValue()"
          (valueChange)="radioValue.set($event)"
        />
      </section>

      <section class="flex flex-col gap-2 max-w-xs">
        <h2 class="font-bold">{{ 'showcase.sectionInputNumeric' | translate }}</h2>
        <app-input-text [label]="'showcase.studentCodeLabel' | translate" [numericOnly]="true" placeholder="HS0012345" />
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionTabs' | translate }}</h2>
        <app-tabs [tabs]="tabItems()" [activeId]="activeTabId()" (activeIdChange)="activeTabId.set($event)" />
        <div class="tabs__panel">
          @switch (activeTabId()) {
            @case ('info') {
              {{ 'showcase.tabInfoContent' | translate }}
            }
            @case ('history') {
              {{ 'showcase.tabHistoryContent' | translate }}
            }
            @case ('settings') {
              {{ 'showcase.tabSettingsContent' | translate }}
            }
          }
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionDialog' | translate }}</h2>
        <app-button (clicked)="dialogOpen.set(true)">{{ 'showcase.openDialog' | translate }}</app-button>
        <app-dialog [open]="dialogOpen()" [title]="'showcase.dialogTitle' | translate" (closed)="dialogOpen.set(false)">
          {{ 'showcase.dialogBody' | translate }}
          <div dialog-footer>
            <app-button variant="secondary" (clicked)="dialogOpen.set(false)">{{ 'common.cancel' | translate }}</app-button>
            <app-button (clicked)="confirmDialog()">{{ 'common.confirm' | translate }}</app-button>
          </div>
        </app-dialog>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionList' | translate }}</h2>
        <app-list [items]="students()">
          <ng-template #itemTemplate let-student>
            {{ student.name }} — {{ student.score }}
          </ng-template>
        </app-list>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionTable' | translate }}</h2>
        <app-table
          [columns]="columns()"
          [rows]="students()"
          [selectable]="true"
          [selectedRows]="selectedStudents()"
          (selectedRowsChange)="selectedStudents.set($any($event))"
        >
          <ng-template #rowActions let-student>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn--ghost btn--sm" [title]="'showcase.editAction' | translate" (click)="editStudent(student)">
                <app-icon name="check" class="text-primary" />
              </button>
              <button type="button" class="btn btn--ghost btn--sm" [title]="'showcase.deleteAction' | translate" (click)="deleteStudent(student)">
                <app-icon name="close" class="text-danger" />
              </button>
            </div>
          </ng-template>
        </app-table>
      </section>

      <section class="flex flex-col gap-4">
        <h2 class="font-bold">{{ 'showcase.sectionDate' | translate }}</h2>
        <div class="flex flex-wrap gap-4">
          <app-date-picker
            class="max-w-xs"
            [label]="'showcase.dateLabel' | translate"
            [max]="today"
            [ngModel]="dateValue()"
            (ngModelChange)="dateValue.set($event)"
          />
          <app-date-time-picker
            class="max-w-xs"
            [label]="'showcase.dateTimeLabel' | translate"
            [ngModel]="dateTimeValue()"
            (ngModelChange)="dateTimeValue.set($event)"
          />
          <app-time-select
            class="max-w-xs"
            [label]="'showcase.timeLabel' | translate"
            [step]="900"
            [ngModel]="timeValue()"
            (ngModelChange)="timeValue.set($event)"
          />
        </div>
        <app-date-range-picker
          class="max-w-md"
          [label]="'showcase.dateRangeLabel' | translate"
          [ngModel]="dateRangeValue()"
          (ngModelChange)="dateRangeValue.set($event)"
        />

        <div class="flex items-center gap-3">
          <span class="text-sm text-text-muted">{{ 'showcase.examCountdownLabel' | translate }}:</span>
          <app-countdown [seconds]="90" [urgentThreshold]="30" (finished)="onExamTimeUp()" class="text-lg font-bold" />
        </div>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionForm' | translate }}</h2>
        <app-form-example />
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="font-bold">{{ 'showcase.sectionApi' | translate }}</h2>
        <app-api-example />
      </section>
    </div>
  `,
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
