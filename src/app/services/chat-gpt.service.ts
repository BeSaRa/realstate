import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ChatGptService {
  API = 'http://127.0.0.1:3333/';
  http = inject(HttpClient);

  ask(message: string): Observable<never[]> {
    return this.http.get<never[]>(this.API, {
      params: new HttpParams({
        fromObject: { message: message },
      }),
    });
  }
}
