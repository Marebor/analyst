import { Subject } from 'rxjs/Subject';
import { IBrowsingData } from '../models/browsing-data';
import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { DatePipe } from '@angular/common';

@Injectable()
export class BrowsingService {
    stateChange: Subject<void> = new Subject<void>();

  constructor(
    @Inject('BASE_URL') private originUrl: string, 
    private httpClient: HttpClient,
    private datePipe: DatePipe
    ) {
  }

  browse(dateFrom: Date, dateTo: Date, accountNumbers: string[]): Observable<IBrowsingData> {
    return this.httpClient.get<IBrowsingData>(
        `${this.originUrl}api/transactions/browse`,
        { 
            params: new HttpParams({ 
                fromObject: { 
                    dateFrom: this.datePipe.transform(dateFrom, 'yyyy-MM-dd'), 
                    dateTo: this.datePipe.transform(dateTo, 'yyyy-MM-dd'),
                    accountNumbers
                }
            })
        }
    );
  }

  browseByUploadId(uploadId: string): Observable<IBrowsingData> {
    return this.httpClient.get<IBrowsingData>(
        `${this.originUrl}api/transactions/upload/${uploadId}/browse`
    );
  }
}