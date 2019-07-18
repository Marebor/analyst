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

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    TransactionsListComponent,
    ChartComponent,
    FileUploadComponent,
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    ChartsModule,
    RouterModule.forRoot([
      { path: '', component: DashboardComponent, pathMatch: 'full' },
    ])
  ],
  providers: [
    { provide: 'BASE_URL', useValue: `${location.origin}/` },
    TransactionService,
    TagService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
