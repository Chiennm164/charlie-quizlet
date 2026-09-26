import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { APP_SETTINGS } from '../config';
import { TranslateService } from './translate.service';

describe('TranslateService', () => {
  let service: TranslateService;

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TranslateService);

    const init = service.init();
    TestBed.inject(HttpTestingController)
      .expectOne(`${APP_SETTINGS.i18n.translationsPath}/${APP_SETTINGS.i18n.defaultLocale}.json`)
      .flush({ auth: { hello: 'Xin chào, {name}!' }, common: { save: 'Lưu' } });
    await init;
  });

  it('dùng ngôn ngữ mặc định trong APP_SETTINGS', () => {
    expect(service.locale()).toBe(APP_SETTINGS.i18n.defaultLocale);
  });

  it('lấy chuỗi theo key lồng nhau, thiếu key thì trả về key', () => {
    expect(service.t('common.save')).toBe('Lưu');
    expect(service.t('common.missing')).toBe('common.missing');
  });

  it('thay tham số {name}, giữ nguyên placeholder không được truyền', () => {
    expect(service.t('auth.hello', { name: 'An' })).toBe('Xin chào, An!');
    expect(service.t('auth.hello')).toBe('Xin chào, {name}!');
  });
});
