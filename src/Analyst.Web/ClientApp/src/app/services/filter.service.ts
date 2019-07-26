import { Tag } from './../models/tag.model';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Filter } from '../models/filter.model';
import { Transaction } from '../models/transaction.model';
import { Subject } from 'rxjs/Subject';
import { Changes } from './changes';
import { tap } from 'rxjs/operators';
import { never } from 'rxjs/observable/never';

declare var filterFunction: any;
const filterTemplate = `
function filterFunction(transaction) {
  const id = transaction.id;
  const orderDate = transaction.orderDate;
  const executionDate = transaction.executionDate;
  const type = transaction.type.toLowerCase();
  const description = transaction.description.toLowerCase();
  const amount = transaction.amount;
  const endingBalance = transaction.endingBalance;

  return [expression]; 
}`;

@Injectable()
export class FilterService {
  private filters: Filter[];
  private _filtersChanged$ = new Subject<Changes<Filter>>();

  get filtersChanged$(): Observable<Changes<Filter>> {
    return this._filtersChanged$.asObservable();
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
    this.httpClient.get<Filter[]>(`${this.originUrl}api/filters`).subscribe(x => {
      this.filters = x;
      this._filtersChanged$.next({ new: this.filters, deleted: [] });
    });
  }

  createFilter(tagsIfTrue: Tag[], expression: string): Observable<Filter> {
    const filter = { tagNamesIfTrue: tagsIfTrue.map(x => x.name), expression };

    return this.httpClient.post<Filter>(`${this.originUrl}api/filters`, filter).pipe(
      tap(newFilter => {
        this.filters.push(newFilter);
        this._filtersChanged$.next({ new: [newFilter], deleted: [] });
      })
    );
  }

  editFilter(filterId: number, tagsIfTrue: Tag[], expression: string): Observable<void> {
    const oldFilterIndex = this.filters.findIndex(x => x.id === filterId);
    
    if (oldFilterIndex >= 0) {
      const newFilter = { id: filterId, tagNamesIfTrue: tagsIfTrue.map(x => x.name), expression };

      return this.httpClient.put<void>(`${this.originUrl}api/filters/${filterId}`, newFilter).pipe(
        tap(() => {
          const deleted = this.filters.splice(oldFilterIndex, 1)[0];
          this._filtersChanged$.next({ new: [newFilter], deleted: [deleted] });
        })
      );
    } else {
      return never();
    }
  }

  deleteFilter(filter: Filter): Observable<void> {
    const filterIndex = this.filters.findIndex(x => x.id === filter.id);
    
    if (filterIndex >= 0) {
      return this.httpClient.delete<void>(`${this.originUrl}api/filters/${filter.id}`).pipe(
        tap(() => {
          const deleted = this.filters.splice(filterIndex, 1)[0];
          this._filtersChanged$.next({ new: [], deleted: [deleted] });
        })
      );
    } else {
      return never();
    }
  }

  doesTransactionMeetFilterConditions(transaction: Transaction, filter: Filter): boolean {
    eval.call(this, filterTemplate.replace('[expression]', filter.expression));

    return filterFunction(transaction);
  }

  isExpressionCorrect(expression: string) {
    const fakeTransaction = {
      id: 0,
      orderDate: new Date(),
      executionDate: new Date(),
      type: '',
      description: '',
      amount: 0,
      endingBalance: 0,
      ignored: false,
      tags: [],
    }

    eval.call(this, filterTemplate.replace('[expression]', expression));

    return typeof filterFunction(fakeTransaction) === 'boolean';
  }
}
