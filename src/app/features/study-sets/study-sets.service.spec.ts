import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { StudySetRequest } from '../../core/models';
import { StudySetsService } from './study-sets.service';

const API = environment.apiUrl;
const REQUEST: StudySetRequest = {
  title: 'Animals',
  description: null,
  visibility: 'PRIVATE',
  cards: [
    { id: null, term: 'cat', definition: 'con mèo' },
    { id: null, term: 'dog', definition: 'con chó' },
  ],
};

describe('StudySetsService', () => {
  let service: StudySetsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(StudySetsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gọi đúng method và URL', () => {
    service.create(REQUEST).subscribe();
    expect(http.expectOne(`${API}/study-sets`).request.method).toBe('POST');

    service.get(10).subscribe();
    expect(http.expectOne(`${API}/study-sets/10`).request.method).toBe('GET');

    service.update(10, REQUEST).subscribe();
    const put = http.expectOne(`${API}/study-sets/10`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual(REQUEST);

    service.listMine({ q: 'anh văn', sort: 'TITLE', page: 2, size: 12 }).subscribe();
    const list = http.expectOne((req) => req.url === `${API}/study-sets/mine`);
    expect(list.request.params.get('q')).toBe('anh văn');
    expect(list.request.params.get('sort')).toBe('TITLE');
    expect(list.request.params.get('page')).toBe('2');
    expect(list.request.params.get('size')).toBe('12');

    service.delete(10).subscribe();
    expect(http.expectOne(`${API}/study-sets/10`).request.method).toBe('DELETE');
  });
});
