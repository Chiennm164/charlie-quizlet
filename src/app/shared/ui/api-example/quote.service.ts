import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Quote {
  id: number;
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private http = inject(HttpClient);

  getQuote(id: number): Observable<Quote> {
    return this.http.get<Quote>(`https://jsonplaceholder.typicode.com/posts/${id}`);
  }
}
