import { BrowsingService } from './browsing.service';
import { Tag } from './../models/tag.model';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Filter } from '../models/filter.model';
import { tap } from '../../../node_modules/rxjs/operators';

@Injectable()
export class FilterService {

  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private browsingService: BrowsingService) {
  }

  getFilters(): Observable<Filter[]> {
    return this.httpClient.get<Filter[]>(`${this.originUrl}api/filters`);
  }

  createFilter(tagsIfTrue: Tag[], keywords: string[]): Observable<Filter> {
    const filter = { tagNamesIfTrue: tagsIfTrue.map(x => x.name), keywords };

    return this.httpClient.post<Filter>(`${this.originUrl}api/filters`, filter).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  editFilter(filterId: number, tagsIfTrue: Tag[], keywords: string[]): Observable<void> {
    const filter = { tagNamesIfTrue: tagsIfTrue.map(x => x.name), keywords };

    return this.httpClient.put<void>(`${this.originUrl}api/filters/${filterId}`, filter).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  deleteFilter(filter: Filter): Observable<void> {
    return this.httpClient.delete<void>(`${this.originUrl}api/filters/${filter.id}`).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }
}
