import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { environment } from '../../../../environments/environment';
import { TranslateService } from '../../../core/i18n/translate.service';
import { Quiz } from '../../../core/models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { QuizEditorComponent } from './quiz-editor';

const API = environment.apiUrl;

const QUIZ: Quiz = {
  id: 10,
  topic: { id: 5, name: 'Toán' },
  title: 'Đại số',
  description: null,
  timeLimitMinutes: 15,
  status: 'PUBLISHED',
  owner: { id: 1, fullName: 'Admin' },
  questionCount: 2,
  questions: [
    {
      id: 100,
      content: '1 + 1?',
      explanation: null,
      options: [
        { id: 1, content: '2', correct: true },
        { id: 2, content: '3', correct: false },
      ],
    },
    {
      id: 200,
      content: '2 + 2?',
      explanation: 'Cộng',
      options: [
        { id: 3, content: '4', correct: true },
        { id: 4, content: '5', correct: false },
      ],
    },
  ],
  canEdit: true,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  publishedAt: '2026-01-01T00:00:00Z',
};

describe('QuizEditorComponent', () => {
  let http: HttpTestingController;

  function create(id: string | null) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
        { provide: TranslateService, useValue: { t: (key: string) => key, locale: signal('vn') } },
        { provide: ToastService, useValue: { success: jest.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    // Chỉ test logic: không render template.
    const editor = TestBed.runInInjectionContext(() => new QuizEditorComponent());
    http.expectOne(`${API}/topics`).flush([{ id: 5, name: 'Toán', quizCount: 1 }]);
    return editor;
  }

  afterEach(() => http.verify());

  it('đề mới: có sẵn 1 câu, chưa có thay đổi; xuất bản khi chưa có câu -> báo lỗi, không gửi', () => {
    const editor = create(null);
    expect(editor.questions.length).toBe(1);
    expect(editor.hasUnsavedChanges()).toBe(false);

    editor.removeQuestion(0);
    editor.form.patchValue({ topicId: '5', title: 'Đề' });
    editor.save('PUBLISHED');
    expect(editor.emptyError()).toBe(true);
    http.expectNone(`${API}/quizzes`);
  });

  it('đề mới chưa điền đủ -> không gửi', () => {
    const editor = create(null);
    editor.save('DRAFT');
    expect(editor.form.controls.title.touched).toBe(true);
    http.expectNone(`${API}/quizzes`);
  });

  it('sửa: nạp đề, đổi thứ tự câu, đổi đáp án đúng rồi lưu — giữ id, gửi cờ correct', () => {
    const editor = create('10');
    http.expectOne(`${API}/quizzes/10`).flush(QUIZ);
    expect(editor.savedStatus()).toBe('PUBLISHED');
    expect(editor.form.controls.topicId.value).toBe('5');
    expect(editor.hasUnsavedChanges()).toBe(false);

    editor.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<unknown>);
    editor.questions.at(1).controls.correctIndex.setValue(1);
    expect(editor.hasUnsavedChanges()).toBe(true);

    editor.save('PUBLISHED');
    const req = http.expectOne(`${API}/quizzes/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.topicId).toBe(5);
    expect(req.request.body.questions.map((q: { id: number }) => q.id)).toEqual([200, 100]);
    expect(req.request.body.questions[1].options).toEqual([
      { id: 1, content: '2', correct: false },
      { id: 2, content: '3', correct: true },
    ]);
    req.flush(QUIZ);
    expect(editor.hasUnsavedChanges()).toBe(false);
  });

  it('tạo mới thành công -> chuyển sang trang sửa đề vừa tạo', () => {
    const editor = create(null);
    editor.form.patchValue({ topicId: '5', title: 'Đề mới' });
    const question = editor.questions.at(0);
    question.controls.content.setValue('Câu 1');
    question.controls.options.controls.forEach((option, i) =>
      option.controls.content.setValue(`Đ${i}`),
    );
    question.controls.correctIndex.setValue(0);

    editor.save('DRAFT');
    const req = http.expectOne(`${API}/quizzes`);
    expect(req.request.body.status).toBe('DRAFT');
    expect(req.request.body.timeLimitMinutes).toBeNull();
    req.flush({ ...QUIZ, id: 42, status: 'DRAFT' });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/admin/quizzes/42/edit', {
      replaceUrl: true,
    });
  });
});
