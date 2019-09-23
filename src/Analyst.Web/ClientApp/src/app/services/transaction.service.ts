import { BrowsingService } from './browsing.service';
import { tap } from 'rxjs/operators/tap';
import { IBrowsingData } from './../models/browsing-data';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../models/transaction.model';
import { Subject } from '../../../node_modules/rxjs';

@Injectable()
export class TransactionService {
  
  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private browsingService: BrowsingService) {
  }

  addTransactionsFromXml(file: any): Observable<IBrowsingData> {
    const formData = new FormData(); 
    formData.append('file', file, file.name); 

    return this.httpClient.post<IBrowsingData>(`${this.originUrl}api/transactions/xml`, formData);
  }

  addTagToTransaction(transactionId: number, tagName: string): Observable<void> {
    return this.httpClient.post<void>(
      `${this.originUrl}api/transactions/${transactionId}/tags`,
      `\"${tagName}\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  removeTagFromTransaction(transactionId: number, tagName: string): Observable<void> {
    return this.httpClient.delete<void>(
      `${this.originUrl}api/transactions/${transactionId}/tags/${tagName}`
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  changeIgnoredValue(transactionId: number, ignored: boolean): Observable<void> {
    return this.httpClient.put<void>(
      `${this.originUrl}api/transactions/${transactionId}/ignored`,
      `\"${ignored}\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }
}