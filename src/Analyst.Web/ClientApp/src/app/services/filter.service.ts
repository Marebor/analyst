import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Filter } from '../models/filter.model';
import { Transaction } from '../models/transaction.model';

declare var filter: any;
const filterTemplate = `
function filter(transaction) {
  const id = transaction.id;
  const orderDate = transaction.orderDate;
  const executionDate = transaction.executionDate;
  const type = transaction.type.toLowerCase();
  const description = transaction.description.toLowerCase();
  const amount = transaction.amount;
  const endingBalance = transaction.endingBalance;
  const assignedTagNames = transaction.assignedTagNames.map(tagName => tagName.toLowerCase());

  return [expression]; 
}`;

@Injectable()
export class FilterService {

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
  }

  getFilters(): Observable<Filter[]> {
    return this.httpClient.get<Filter[]>(`${this.originUrl}api/filters`);
  }

  getTagNames(transaction: Transaction, filters: Filter[]): string[] {
    let tagNames: string[] = [];

    filters.forEach(f => {
      eval.call(this, filterTemplate.replace('[expression]', f.expression));
      if (filter(transaction)) {
        tagNames = tagNames.concat(f.tagNamesIfTrue);
      }
    });

    return tagNames;
  }

  filterTransactions(tagName: string, transactions: Transaction[], filters: Filter[]): Transaction[] {
    const filteredTransactions: Transaction[] = transactions.filter(t => t.assignedTagNames.find(name => name === tagName));

    filters.filter(f => f.tagNamesIfTrue.findIndex(name => name === tagName) !== -1).forEach(f => {
      eval.call(this, filterTemplate.replace('[expression]', f.expression));
      transactions.forEach(transaction => {
        if (filter(transaction) && !filteredTransactions.find(t => t.id === transaction.id)) {
          filteredTransactions.push(transaction);
        }
      });
    });

    return filteredTransactions;
  }
}
