import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../models/transaction.model';
import { DatePipe } from '@angular/common';
import { tap } from 'rxjs/operators/tap';
import { Subject } from 'rxjs/Subject';
import * as moment from 'moment'

@Injectable()
export class TransactionService {
  private transactions: Transaction[] = [];
  private _newTransactionsFetched$: Subject<Transaction[]> = new Subject<Transaction[]>();

  get newTransactionsFetched$(): Observable<Transaction[]> {
    return this._newTransactionsFetched$.asObservable();
  }

  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private datePipe: DatePipe
    ) {
  }

  getTransactions(dateFrom?: Date, dateTo?: Date): Observable<Transaction[]> {
    let queryString = '';
    if (dateFrom || dateTo) {
      queryString += '?';
    }
    if (dateFrom) {
      queryString += `dateFrom=${this.datePipe.transform(dateFrom, 'yyyy-MM-dd')}`;
    }
    if (dateTo) {
      const expression = `dateTo=${this.datePipe.transform(dateTo, 'yyyy-MM-dd')}`;
      queryString += queryString === '?' ? expression : '&' + expression ;
    }

    return this.httpClient.get<Transaction[]>(`${this.originUrl}api/transactions${queryString}`).pipe(
      tap(transactions => {
        const newTransactions = [];
        transactions.forEach(t => {
          if (!this.transactions.find(x => x.id === t.id)) {
            newTransactions.push(t);
          }
        })

        if (newTransactions.length > 0) {
          this.transactions.push(...newTransactions);
          this._newTransactionsFetched$.next(newTransactions);
        }
      })
    );
  }

  addTransactionsFromXml(file: any): Observable<Transaction[]> {
    const formData = new FormData(); 
    formData.append('file', file, file.name); 

    return this.httpClient.post<Transaction[]>(`${this.originUrl}api/transactions/xml`, formData).pipe(
      tap(newTransactions => {
        this.transactions.push(...newTransactions);
        this._newTransactionsFetched$.next(newTransactions);
      })
    );
  }

  setIgnoredValue(transactionId: number, value: boolean): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/transactions/${transactionId}/ignored`, `${value}`, { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(() => this.transactions.find(t => t.id === transactionId).ignored = value)
    );
  }

  private sort(transactions: Transaction[]): Transaction[] {
    return transactions.sort((a, b) => moment(a.orderDate).isBefore(b.orderDate) ? -1 : 1)
  }
}