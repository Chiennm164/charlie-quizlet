import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { QuizMarksStore } from './quiz-marks.store';

const API = `${environment.apiUrl}/me`;

describe('QuizMarksStore', () => {
  let store: QuizMarksStore;
  let http: HttpTestingController;
  const currentUser = signal<Partial<User> | null>({ id: 1 });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser } },
      ],
    });
    store = TestBed.inject(QuizMarksStore);
    http = TestBed.inject(HttpTestingController);
    TestBed.tick();
    store.refresh();
    http.expectOne(`${API}/quiz-marks`).flush({
      progress: [{ quizId: 7, submittedCount: 2, bestPercent: 80, inProgressAttemptId: null }],
      favoriteQuizIds: [7],
    });
  });

  afterEach(() => http.verify());

  it('tra dấu theo đề', () => {
    expect(store.progress(7)?.bestPercent).toBe(80);
    expect(store.progress(8)).toBeNull();
    expect(store.isFavorite(7)).toBe(true);
  });

  it('yêu thích: đổi ngay trên giao diện, BE lỗi thì trả lại như cũ', () => {
    store.toggleFavorite(8);
    expect(store.isFavorite(8)).toBe(true);
    const req = http.expectOne(`${API}/favorites/8`);
    expect(req.request.method).toBe('PUT');
    req.flush(null, { status: 500, statusText: 'Error' });
    expect(store.isFavorite(8)).toBe(false);

    store.toggleFavorite(7);
    expect(http.expectOne(`${API}/favorites/7`).request.method).toBe('DELETE');
    expect(store.isFavorite(7)).toBe(false);
  });

  it('đổi tài khoản: xoá dấu của người trước', () => {
    currentUser.set({ id: 2 });
    TestBed.tick();
    expect(store.progress(7)).toBeNull();
    expect(store.isFavorite(7)).toBe(false);
  });
});
