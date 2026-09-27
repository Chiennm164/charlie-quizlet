import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ShortcutDirective } from './shortcut.directive';

@Component({
  standalone: true,
  imports: [ShortcutDirective],
  template: `
    <button appShortcut=" " (shortcut)="count.set(count() + 1)" [disabled]="disabled()">
      Flip
    </button>
    <button appShortcut="m" (shortcut)="letter.set(letter() + 1)">Mark</button>
    <input />
  `,
})
class HostComponent {
  count = signal(0);
  letter = signal(0);
  disabled = signal(false);
}

describe('ShortcutDirective', () => {
  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document) => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event;
    };
    return { fixture, host: fixture.componentInstance, press };
  }

  it('nhấn đúng phím -> phát shortcut và chặn hành vi mặc định (Space cuộn trang)', () => {
    const { host, press } = setup();
    const event = press(' ');
    expect(host.count()).toBe(1);
    expect(event.defaultPrevented).toBe(true);

    press('a');
    expect(host.count()).toBe(1);
  });

  it('bỏ qua khi đang gõ trong ô nhập, khi giữ Ctrl, khi nút disabled', () => {
    const { fixture, host, press } = setup();
    press(' ', {}, fixture.nativeElement.querySelector('input'));
    press(' ', { ctrlKey: true });
    host.disabled.set(true);
    fixture.detectChanges();
    press(' ');
    expect(host.count()).toBe(0);
  });

  it('phím chữ không phân biệt hoa thường (Shift / Caps Lock)', () => {
    const { host, press } = setup();
    press('m');
    press('M');
    expect(host.letter()).toBe(2);
  });

  it('gắn aria-keyshortcuts đọc được', () => {
    const { fixture } = setup();
    expect(fixture.nativeElement.querySelector('button').getAttribute('aria-keyshortcuts')).toBe(
      'Space',
    );
  });
});
