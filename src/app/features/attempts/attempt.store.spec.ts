import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { Attempt, AttemptMode, AttemptQuestion } from '../../core/models';
import { AttemptStore, scoreLevel } from './attempt.store';

const API = `${environment.apiUrl}/attempts/7`;

function question(id: number, changes: Partial<AttemptQuestion> = {}): AttemptQuestion {
  return {
    questionId: id,
    content: `Câu ${id}`,
    options: [
      { id: id + 1, content: 'A' },
      { id: id + 2, content: 'B' },
    ],
    selectedOptionId: null,
    flagged: false,
    correctOptionId: null,
    correct: null,
    explanation: null,
    ...changes,
  };
}

function attempt(mode: AttemptMode, changes: Partial<Attempt> = {}): Attempt {
  return {
    id: 7,
    quiz: { id: 1, title: 'Toán' },
    mode,
    status: 'IN_PROGRESS',
    startedAt: '2026-01-01T00:00:00Z',
    deadline: null,
    submittedAt: null,
    serverTime: new Date().toISOString(),
    questionCount: 2,
    correctCount: null,
    questions: [question(10), question(20)],
    ...changes,
  };
}

describe('AttemptStore', () => {
  let store: AttemptStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AttemptStore, provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(AttemptStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('làm tiếp: mở câu đầu tiên chưa trả lời', () => {
    store.load(
      attempt('EXAM', { questions: [question(10, { selectedOptionId: 11 }), question(20)] }),
    );
    expect(store.index()).toBe(1);
  });

  it('thi thử: chọn / đổi / bỏ chọn hiện ngay, gửi lên BE lần lượt theo thứ tự', () => {
    store.load(attempt('EXAM'));
    store.select(11);
    store.select(12);
    store.select(12); // bấm lại đáp án đang chọn = bỏ chọn
    expect(store.current()?.selectedOptionId).toBeNull();
    expect(store.pending()).toBe(3);

    // Request sau chỉ chạy khi request trước xong -> BE nhận đúng thứ tự.
    const first = http.expectOne(`${API}/answers/10`);
    expect(first.request.body).toEqual({ optionId: 11, flagged: false });
    http.expectNone(`${API}/answers/10`);
    first.flush(question(10, { selectedOptionId: 11 }));
    http.expectOne(`${API}/answers/10`).flush(question(10, { selectedOptionId: 12 }));
    const last = http.expectOne(`${API}/answers/10`);
    expect(last.request.body).toEqual({ optionId: null, flagged: false });
    last.flush(question(10));

    // Phản hồi của BE không ghi đè lựa chọn mới hơn trên máy.
    expect(store.current()?.selectedOptionId).toBeNull();
    expect(store.pending()).toBe(0);
  });

  it('luyện tập: chờ BE chấm rồi hiện đáp án đúng, không chọn lại được', () => {
    store.load(attempt('PRACTICE'));
    store.select(11);
    store.select(12); // đang chấm -> bỏ qua
    expect(store.checkingId()).toBe(10);

    http
      .expectOne(`${API}/answers/10`)
      .flush(question(10, { selectedOptionId: 11, correctOptionId: 12, correct: false }));
    expect(store.current()).toMatchObject({ correctOptionId: 12, correct: false });
    expect(store.checkingId()).toBeNull();

    store.select(12);
    http.expectNone(`${API}/answers/10`);
  });

  it('nộp bài chạy sau khi các câu đang lưu đã xong', () => {
    store.load(attempt('EXAM'));
    store.select(11);
    store.submit();
    http.expectNone(`${API}/submit`);

    http.expectOne(`${API}/answers/10`).flush(question(10, { selectedOptionId: 11 }));
    http
      .expectOne(`${API}/submit`)
      .flush(attempt('EXAM', { status: 'SUBMITTED', correctCount: 1 }));
    expect(store.isSubmitted()).toBe(true);
    expect(store.submitting()).toBe(false);
  });

  it('lưu lỗi: bỏ các việc còn chờ, tải lại bài từ BE', () => {
    store.load(attempt('EXAM'));
    store.select(11);
    store.go(1);
    store.select(21);

    http.expectOne(`${API}/answers/10`).flush(null, { status: 409, statusText: 'Conflict' });
    http.expectNone(`${API}/answers/20`);
    http.expectOne(API).flush(attempt('EXAM', { status: 'SUBMITTED', correctCount: 0 }));
    expect(store.isSubmitted()).toBe(true);
    expect(store.pending()).toBe(0);
  });

  it('đếm ngược theo giờ server dù đồng hồ máy lệch', () => {
    const serverNow = Date.now() + 60_000; // máy chậm 1 phút
    store.load(
      attempt('EXAM', {
        serverTime: new Date(serverNow).toISOString(),
        deadline: new Date(serverNow + 600_000).toISOString(),
      }),
    );
    expect(Math.round((store.deadlineMs()! - Date.now()) / 1000)).toBe(600);
  });
});

describe('scoreLevel', () => {
  it('xếp loại theo ngưỡng cấu hình (80 / 50)', () => {
    expect(scoreLevel(80)).toBe('great');
    expect(scoreLevel(79)).toBe('good');
    expect(scoreLevel(50)).toBe('good');
    expect(scoreLevel(49)).toBe('keepTrying');
  });
});
