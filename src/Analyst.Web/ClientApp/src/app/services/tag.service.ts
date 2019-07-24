import { tap } from 'rxjs/operators/tap';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class TagService {
  private tags: Tag[];
  private _tags$: Subject<Tag[]> = new Subject<Tag[]>();

  get tags$(): Observable<Tag[]> {
    return this._tags$.asObservable();
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
    this.httpClient.get<Tag[]>(`${this.originUrl}api/tags`).subscribe(x => {
      this.tags = x;
      this._tags$.next(x);
    });
  }

  changeTagColor(tagName: string, color: string): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/tags/${tagName}/color`, `\"${color}\"` , { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(() => this.tags.find(t => t.name === tagName).color = color)
    );
  }
}
