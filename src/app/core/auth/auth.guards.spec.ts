import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Role } from '../models';
import { authGuard, guestGuard, roleGuard } from './auth.guards';
import { AuthService } from './auth.service';

describe('auth guards', () => {
  const isAuthenticated = signal(false);
  const role = signal<Role>('STUDENT');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated, hasRole: (...roles: Role[]) => roles.includes(role()) },
        },
      ],
    });
  });

  const run = (guard: typeof authGuard, url = '/home') =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as boolean | UrlTree;
  const serialize = (result: boolean | UrlTree) =>
    result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;

  it('authGuard: chưa đăng nhập -> /login kèm returnUrl', () => {
    isAuthenticated.set(false);
    expect(serialize(run(authGuard, '/home'))).toBe('/login?returnUrl=%2Fhome');
  });

  it('authGuard: đã đăng nhập -> cho vào', () => {
    isAuthenticated.set(true);
    expect(run(authGuard)).toBe(true);
  });

  it('guestGuard: đã đăng nhập -> /home', () => {
    isAuthenticated.set(true);
    expect(serialize(run(guestGuard))).toBe('/home');
  });

  it('guestGuard: chưa đăng nhập -> cho vào', () => {
    isAuthenticated.set(false);
    expect(run(guestGuard)).toBe(true);
  });

  it('roleGuard: có 1 trong các role yêu cầu -> cho vào', () => {
    role.set('TEACHER');
    expect(run(roleGuard('TEACHER', 'ADMIN'))).toBe(true);
  });

  it('roleGuard: không đủ quyền -> trang 403', () => {
    role.set('STUDENT');
    expect(serialize(run(roleGuard('TEACHER', 'ADMIN')))).toBe('/forbidden');
  });
});
