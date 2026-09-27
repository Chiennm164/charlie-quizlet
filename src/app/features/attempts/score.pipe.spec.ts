import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateService } from '../../core/i18n/translate.service';
import { toScore } from './attempt.store';
import { ScorePipe } from './score.pipe';

describe('toScore', () => {
  it('thang 100: mỗi câu = 100 / số câu, làm tròn 1 chữ số thập phân', () => {
    expect(toScore(25, 30)).toBe(83.3);
    expect(toScore(30, 30)).toBe(100);
    expect(toScore(0, 0)).toBe(0);
  });
});

describe('ScorePipe', () => {
  const locale = signal<'vn' | 'en'>('vn');

  function pipe() {
    TestBed.configureTestingModule({
      providers: [{ provide: TranslateService, useValue: { locale } }],
    });
    return TestBed.runInInjectionContext(() => new ScorePipe());
  }

  it('điểm 1 lượt từ số câu đúng / số câu, định dạng theo ngôn ngữ', () => {
    const score = pipe();
    expect(score.transform(25, 30)).toBe('83,3');
    locale.set('en');
    expect(score.transform(25, 30)).toBe('83.3');
    locale.set('vn');
  });

  it('không truyền số câu: đổi tỉ lệ đúng 0–100 (BE trả) sang điểm', () => {
    expect(pipe().transform(67)).toBe('67');
  });
});
