import { tap } from 'rxjs/operators/tap';
import { Injectable, Inject, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class TagService {
  private tags: Tag[];
  private _tags$: Subject<Tag[]> = new Subject<Tag[]>();
  private _tagColorChanged$: Subject<Tag> = new Subject<Tag>();

  get tags$(): Observable<Tag[]> {
    return this._tags$.asObservable();
  }

  get tagColorChanged$(): Observable<Tag> {
    return this._tagColorChanged$.asObservable();
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
    this.httpClient.get<Tag[]>(`${this.originUrl}api/tags`).subscribe(x => {
      this.tags = x;
      this._tags$.next(x);
    });
  }

  createTag(name: string, color: string): Observable<Tag> {
    return this.httpClient.post<Tag>(`${this.originUrl}api/tags`, { name, color }).pipe(
      tap(x => {
        this.tags.push(x);
        this._tags$.next(this.tags);
      })
    );
  }

  deleteTag(name: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.originUrl}api/tags/${name}`).pipe(
      tap(x => {
        const index = this.tags.findIndex(t => t.name == name);
        this.tags.splice(index, 1);
        this._tags$.next(this.tags);
      })
    );
  }

  changeTagColor(tagName: string, color: string): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/tags/${tagName}/color`, `\"${color}\"` , { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(() => {
        const tag = this.tags.find(t => t.name === tagName)
        tag.color = color;
        this._tagColorChanged$.next(tag);
      })
    );
  }
}
