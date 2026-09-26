import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslateService } from '../../../core/i18n/translate.service';
import { PaginationComponent } from './pagination';

describe('PaginationComponent', () => {
  function render(page: number, totalPages: number) {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TranslateService,
          useValue: { t: (key: string) => key, locale: signal('vn'), ready: signal(true) },
        },
      ],
    });
    const fixture = TestBed.createComponent(PaginationComponent);
    fixture.componentRef.setInput('page', page);
    fixture.componentRef.setInput('totalPages', totalPages);
    fixture.detectChanges();
    const emitted: number[] = [];
    fixture.componentInstance.pageChange.subscribe((p) => emitted.push(p));
    const buttons = fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>;
    return { buttons, emitted };
  }

  it('chỉ 1 trang -> không hiện', () => {
    expect(render(0, 1).buttons.length).toBe(0);
  });

  it('trang đầu khoá nút Trước; bấm Sau phát trang kế tiếp', () => {
    const { buttons, emitted } = render(0, 3);
    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(false);
    buttons[1].click();
    expect(emitted).toEqual([1]);
  });

  it('trang cuối khoá nút Sau', () => {
    const { buttons } = render(2, 3);
    expect(buttons[1].disabled).toBe(true);
  });
});
