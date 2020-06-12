import { BrowsingService } from './browsing.service';
import { tap } from 'rxjs/operators/tap';
import { IBrowsingData, IUploadResult } from '../models/browsing-data';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Transaction } from '../models/transaction.model';
import { Subject } from 'rxjs';

@Injectable()
export class TransactionService {
  
  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private browsingService: BrowsingService) {
  }

  addTransactionsFromXml(file: any): Observable<IUploadResult> {
    const formData = new FormData(); 
    formData.append('file', file, file.name); 

    return this.httpClient.post<IUploadResult>(`${this.originUrl}api/transactions/xml`, formData);
  }

  saveTransactionTags(transactionId: number, tags: { name: string, amount: number }[]): Observable<void> {
    return this.httpClient.post<void>(
      `${this.originUrl}api/transactions/${transactionId}/tags`,
      tags, 
      { headers: { 'Content-Type': 'application/json' } }
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

  editComment(transactionId: number, comment: string): Observable<void> {
    return this.httpClient.post<void>(
      `${this.originUrl}api/transactions/${transactionId}/comment`,
      `\"${comment}\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }

  removeComment(transactionId: number): Observable<void> {
    return this.httpClient.post<void>(
      `${this.originUrl}api/transactions/${transactionId}/comment`,
      `\"\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    ).pipe(
      tap(() => this.browsingService.stateChange.next())
    );
  }
}