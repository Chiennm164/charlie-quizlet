import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MeService } from './me.service';

describe('MeService', () => {
  it('lịch sử: chỉ gửi mode / topicId khi có lọc', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(MeService);

    service
      .attempts({ status: 'SUBMITTED', mode: null, topicId: null, page: 0, size: 12 })
      .subscribe();
    const all = http.expectOne((r) => r.url === `${environment.apiUrl}/me/attempts`);
    expect(all.request.params.has('mode')).toBe(false);
    expect(all.request.params.has('topicId')).toBe(false);

    service
      .attempts({ status: 'SUBMITTED', mode: 'EXAM', topicId: 5, page: 1, size: 12 })
      .subscribe();
    const filtered = http.expectOne((r) => r.url === `${environment.apiUrl}/me/attempts`);
    expect(filtered.request.params.get('mode')).toBe('EXAM');
    expect(filtered.request.params.get('topicId')).toBe('5');
    http.verify();
  });
});
