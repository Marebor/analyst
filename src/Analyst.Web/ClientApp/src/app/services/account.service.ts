import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Account } from '../models/account.model';

@Injectable()
export class AccountService {

  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient) {
  }
  
  getAccounts(): Observable<Account[]> {
    return this.httpClient.get<Account[]>(`${this.originUrl}api/accounts`);
  }

  changeAccountName(accountNumber: string, name: string): Observable<void> {
    return this.httpClient.put<void>(
      `${this.originUrl}api/accounts/${accountNumber}`, 
      `\"${name}\"`, 
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
}
