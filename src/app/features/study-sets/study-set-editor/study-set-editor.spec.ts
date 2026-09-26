import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { TranslateService } from '../../../core/i18n/translate.service';
import { StudySet, User } from '../../../core/models';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { StudySetEditorComponent } from './study-set-editor';

const API = environment.apiUrl;
const ALICE = { id: 1, fullName: 'Alice' } as User;

const ANIMALS: StudySet = {
  id: 10,
  title: 'Animals',
  description: null,
  visibility: 'PRIVATE',
  owner: { id: 1, fullName: 'Alice' },
  cards: [
    { id: 101, term: 'cat', definition: 'con mèo' },
    { id: 102, term: 'dog', definition: 'con chó' },
  ],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('StudySetEditorComponent', () => {
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
        { provide: AuthService, useValue: { currentUser: signal(ALICE) } },
        { provide: TranslateService, useValue: { t: (key: string) => key, locale: signal('vn') } },
        { provide: ToastService, useValue: { success: jest.fn() } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    jest.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    // Chỉ test logic: không render template (tránh phải dựng cả UI kit + translate pipe).
    return TestBed.runInInjectionContext(() => new StudySetEditorComponent());
  }

  afterEach(() => http.verify());

  it('tạo mới: bắt đầu với số thẻ tối thiểu, chưa có thay đổi', () => {
    const editor = create(null);
    expect(editor.cards.length).toBe(2);
    expect(editor.hasUnsavedChanges()).toBe(false);
  });

  it('Tab ở ô định nghĩa của dòng cuối -> thêm dòng; dòng khác / Shift+Tab thì không', () => {
    const editor = create(null);
    const tab = (shiftKey = false) =>
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true });

    editor.onDefinitionKeydown(tab(), 0);
    editor.onDefinitionKeydown(tab(true), 1);
    expect(editor.cards.length).toBe(2);

    const event = tab();
    editor.onDefinitionKeydown(event, 1);
    expect(editor.cards.length).toBe(3);
    expect(event.defaultPrevented).toBe(true);
    expect(editor.hasUnsavedChanges()).toBe(true);
  });

  it('sửa: nạp học phần, kéo thả đổi thứ tự rồi lưu giữ nguyên id thẻ', () => {
    const editor = create('10');
    http.expectOne(`${API}/study-sets/10`).flush(ANIMALS);
    expect(editor.hasUnsavedChanges()).toBe(false);

    editor.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<unknown>);
    editor.addCard();
    editor.cards.at(2).setValue({ id: null, term: ' bird ', definition: 'chim' });
    expect(editor.hasUnsavedChanges()).toBe(true);

    editor.save();
    const req = http.expectOne(`${API}/study-sets/10`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.cards).toEqual([
      { id: 102, term: 'dog', definition: 'con chó' },
      { id: 101, term: 'cat', definition: 'con mèo' },
      { id: null, term: 'bird', definition: 'chim' },
    ]);
    req.flush(ANIMALS);
    expect(editor.hasUnsavedChanges()).toBe(false);
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/study-sets/10');
  });

  it('không gửi khi form lỗi (thuật ngữ trùng)', () => {
    const editor = create(null);
    editor.form.patchValue({ title: 'Set' });
    editor.cards.at(0).patchValue({ term: 'Cat', definition: 'a' });
    editor.cards.at(1).patchValue({ term: 'cat', definition: 'b' });

    editor.save();
    expect(editor.cards.at(1).controls.term.hasError('duplicate')).toBe(true);
    http.expectNone(`${API}/study-sets`);
  });

  it('nhập nhanh thay các dòng trống, giữ dòng đã nhập', () => {
    const editor = create(null);
    editor.cards.at(1).patchValue({ term: 'cat', definition: 'con mèo' });
    expect(editor.importCapacity()).toBe(499);

    editor.importCards([
      { term: 'dog', definition: 'con chó' },
      { term: 'bird', definition: 'chim' },
    ]);

    expect(editor.cards.getRawValue().map((c) => c.term)).toEqual(['cat', 'dog', 'bird']);
    expect(editor.cards.getRawValue().every((c) => c.id === null)).toBe(true);
    expect(editor.hasUnsavedChanges()).toBe(true);
  });

  it('học phần của người khác -> trang 403', () => {
    create('10');
    http.expectOne(`${API}/study-sets/10`).flush({ ...ANIMALS, owner: { id: 2, fullName: 'Bob' } });
    expect(TestBed.inject(Router).navigateByUrl).toHaveBeenCalledWith('/forbidden');
  });
});
