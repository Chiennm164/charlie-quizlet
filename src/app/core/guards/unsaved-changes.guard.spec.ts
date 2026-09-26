import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ConfirmDialogService } from '../confirm/confirm-dialog.service';
import { TranslateService } from '../i18n/translate.service';
import { HasUnsavedChanges, unsavedChangesGuard } from './unsaved-changes.guard';

describe('unsavedChangesGuard', () => {
  const isAuthenticated = signal(true);
  const confirm = jest.fn();

  beforeEach(() => {
    isAuthenticated.set(true);
    confirm.mockReset().mockResolvedValue(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated } },
        { provide: ConfirmDialogService, useValue: { confirm } },
        { provide: TranslateService, useValue: { t: (key: string) => key } },
      ],
    });
  });

  const run = (dirty: boolean) => {
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => dirty };
    return TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(
        component,
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
        {} as RouterStateSnapshot,
      ),
    );
  };

  it('không có thay đổi -> cho rời trang, không hỏi', () => {
    expect(run(false)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('có thay đổi -> hỏi xác nhận, theo lựa chọn của người dùng', async () => {
    await expect(run(true)).resolves.toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it('đã đăng xuất / hết phiên -> rời trang luôn', () => {
    isAuthenticated.set(false);
    expect(run(true)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });
});
