import { BrowsingService } from './services/browsing.service';
import { FilterService } from './services/filter.service';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { ChartComponent } from './chart/chart.component';
import { TransactionService } from './services/transaction.service';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { ChartsModule } from 'ng2-charts';
import { AppComponent } from './app.component';
import { TransactionsListComponent } from './transactions-list/transactions-list.component';
import { TagService } from './services/tag.service';
import { FilterManagerComponent } from './filter-manager/filter-manager.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DateRangeComponent } from './date-range/date-range.component';
import { DatePipe } from '@angular/common';
import { TagComponent } from './tag/tag.component';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TransactionsListComponent,
    ChartComponent,
    FileUploadComponent,
    FilterManagerComponent,
    DateRangeComponent,
    TagComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    ChartsModule,
    NgbModule.forRoot(),
    RouterModule.forRoot([
      { path: '', component: DashboardComponent, pathMatch: 'full' },
    ])
  ],
  providers: [
    { provide: 'BASE_URL', useValue: `${location.origin}/` },
    TransactionService,
    TagService,
    FilterService,
    BrowsingService,
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
