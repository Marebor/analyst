import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';

@Injectable()
export class TagService {

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
  }

  getAvailableTags(): Observable<Tag[]> {
    return this.httpClient.get<Tag[]>(`${this.originUrl}api/tags`);
  }

  changeTagColor(tagName: string, color: string): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/tags/${tagName}/color`, `\"${color}\"` , { headers: { 'Content-Type': 'application/json' } });
  }
}
