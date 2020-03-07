import { BrowsingService } from './browsing.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { tap } from 'rxjs/operators';

@Injectable()
export class TagService {

  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private browsingService: BrowsingService) {
  }
  
  getTags(): Observable<Tag[]> {
    return this.httpClient.get<Tag[]>(`${this.originUrl}api/tags`);
  }

  createTag(name: string, color: string): Observable<Tag> {
    return this.httpClient.post<Tag>(`${this.originUrl}api/tags`, { name, color }).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  deleteTag(name: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.originUrl}api/tags/${name}`).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  changeTagColor(tagName: string, color: string): Observable<void> {
    return this.httpClient.post<void>(
      `${this.originUrl}api/tags/${tagName}/color`, 
      `\"${color}\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }
}
