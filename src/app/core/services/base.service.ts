import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable()
export class BaseService {
  apiUrl = environment.apiUrl;
  http: HttpClient = inject(HttpClient);

  post<T>(url: string, body?: any): Observable<T> {
    return this.http.post<T>(this.apiUrl + url, body, {
      withCredentials: true,
    });
  }

  get<T>(url: string, params = {}): Observable<T> {
    return this.http.get<T>(this.apiUrl + url, {
      params: params,
      withCredentials: true,
    });
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.apiUrl + url, { withCredentials: true });
  }

  put<T>(url: string, body?: any): Observable<T> {
    return this.http.put<T>(this.apiUrl + url, body, { withCredentials: true });
  }
}
