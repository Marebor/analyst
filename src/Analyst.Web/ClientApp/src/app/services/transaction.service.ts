import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../models/transaction.model';
import { Tag } from '../models/tag.model';

@Injectable()
export class TransactionService {

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient) {
  }

  getTransactions(): Observable<Transaction[]> {
    return this.httpClient.get<Transaction[]>(`${this.originUrl}api/transactions`);
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
}
