import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Filter } from '../models/filter.model';
import { Transaction } from '../models/transaction.model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

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
  private _filters$ = new Subject<Filter[]>();

  get filters$(): Observable<Filter[]> {
    return this._filters$.asObservable();
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
    this.httpClient.get<Filter[]>(`${this.originUrl}api/filters`).subscribe(x => this._filters$.next(x));
  }

  doesTransactionMeetFilterConditions(transaction: Transaction, filter: Filter): boolean {
    eval.call(this, filterTemplate.replace('[expression]', filter.expression));

    return filterFunction(transaction);
  }

  filterTransactions(tagName: string, transactions: Transaction[], filters: Filter[]): Transaction[] {
    filters.filter(f => f.tagNamesIfTrue.findIndex(name => name === tagName) !== -1).forEach(f => {
      eval.call(this, filterTemplate.replace('[expression]', f.expression));
      transactions.forEach(transaction => {
        if (filterFunction(transaction) && !transactions.find(t => t.id === transaction.id)) {
          transactions.push(transaction);
        }
      });
    });

    return transactions;
  }
}
