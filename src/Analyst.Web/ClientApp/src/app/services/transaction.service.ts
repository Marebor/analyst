import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../models/transaction.model';
import { DatePipe } from '@angular/common';

@Injectable()
export class TransactionService {

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

    return this.httpClient.get<Transaction[]>(`${this.originUrl}api/transactions${queryString}`);
  }

  addTransactionsFromXml(file: any): Observable<void> {
    const formData = new FormData(); 
    formData.append('file', file, file.name); 

    return this.httpClient.post<void>(`${this.originUrl}api/transactions/xml`, formData);
  }

  addTagTotransaction(tagName: string, transactionId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/transactions/${transactionId}/tags`, `\"${tagName}\"` , { headers: { 'Content-Type': 'application/json' } });
  }

  removeTagFromTransaction(tagName: string, transactionId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.originUrl}api/transactions/${transactionId}/tags/${tagName}`);
  }

  setIgnoredValue(transactionId: number, value: boolean): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/transactions/${transactionId}/ignored`, `${value}`, { headers: { 'Content-Type': 'application/json' } });
  }
}
