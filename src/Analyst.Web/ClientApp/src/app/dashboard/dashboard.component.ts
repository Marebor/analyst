import { Account } from './../models/account.model';
import { tap } from 'rxjs/operators/tap';
import { flatMap } from 'rxjs/operators';
import { ChartDataItem } from '../chart/chart-data-item.model';
import { IBrowsingData } from '../models/browsing-data';
import { BrowsingService } from '../services/browsing.service';
import { Subject } from 'rxjs/Subject';
import { TagService } from '../services/tag.service';
import { Transaction } from '../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { Tag } from '../models/tag.model';
import * as moment from 'moment'
import { forkJoin } from 'rxjs/observable/forkJoin';
import { AccountService } from '../services/account.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  calendarStartDate: Date;
  browsingData: IBrowsingData;
  chartData$: Subject<ChartDataItem[]> = new Subject<ChartDataItem[]>();
  income$: Subject<number> = new Subject<number>();
  transactionListData$: Subject<Transaction[]> = new Subject<Transaction[]>();
  tagSelected_transactionsList$: Subject<Tag> = new Subject<Tag>();
  tagSelected_filterManager$: Subject<Tag> = new Subject<Tag>();
  tags: Tag[];
  showCalendar: boolean;
  dateRange: {from: Date, to: Date };
  selectedTag: Tag;
  selectedTransaction: Transaction;
  expandList: boolean = false;
  activeTab: string = 'Transakcje';
  loadingXml: boolean = false;
  currentContextId: string;
  accounts: Account[];
  selectedAccounts: Account[];
  showIncome: boolean = true;
  showExpenses: boolean = true;
  showIgnored: boolean = true;
  showNotIgnored: boolean = true;

  constructor(
    private browsingService: BrowsingService,
    private transactionService: TransactionService, 
    private tagService: TagService,
    private accountService: AccountService,
    ) { }

  ngOnInit() {
    const today = new Date();
    this.dateRange = { to: new Date(), from: new Date(today.setDate(1)) };
    this.calendarStartDate = new Date(this.dateRange.from)
    this.calendarStartDate.setMonth(this.calendarStartDate.getMonth() - 1);

    this.refresh();

    this.browsingService.stateChange.subscribe(() => this.refresh());
  }

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;
    this.calendarStartDate = new Date(this.dateRange.from)
    this.calendarStartDate.setMonth(this.calendarStartDate.getMonth() - 1);
    this.browsingService.browse(this.dateRange.from, this.dateRange.to, this.selectedAccounts.map(a => a.number))
      .subscribe(browsingData => this.onBrowsingDataFetched(browsingData));
    this.showCalendar = false;
    this.selectedTag = null;
    this.currentContextId = null;
  }

  addMonths(value: number) {
    const startDate = new Date(this.dateRange.from);
    startDate.setMonth(startDate.getMonth() + value);
    startDate.setDate(1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(endDate.getDate() - 1);

    this.onDateRangeChanged({from: startDate, to: endDate});
  }

  onFileSelected(file: any) {
    this.transactionService.addTransactionsFromXml(file).subscribe(result => {
      if (result.data.transactions.length > 0) {
        this.dateRange = { 
          from: result.data.transactions.reduce((a, b) => 
            moment(a).isBefore(b.transaction.orderDate) ? a : b.transaction.orderDate, 
            result.data.transactions[0].transaction.orderDate), 
          to: result.data.transactions.reduce((a, b) => 
            moment(a).isAfter(b.transaction.orderDate) ? a : b.transaction.orderDate, 
            result.data.transactions[0].transaction.orderDate)
        };
        this.currentContextId = result.uploadId;
        this.onBrowsingDataFetched(result.data);
      }

      this.loadingXml = false;
    });
  
    this.loadingXml = true;
  }

  isAccountSelected(account: Account): boolean {
    return this.selectedAccounts.findIndex(a => a.number === account.number) >= 0;
  }

  accountSelectionChanged(account: Account) {
    const index = this.selectedAccounts.findIndex(a => a.number === account.number);

    if (index >= 0) {
      if (this.selectedAccounts.length === 1) {
        return;
      }

      this.selectedAccounts.splice(index, 1);
    } else {
      this.selectedAccounts.push(account);
    }

    this.refresh();
  }

  incomeCheckboxClicked() {
    this.showIncome = !this.showIncome;

    this.publishData();
  }

  expensesCheckboxClicked() {
    this.showExpenses = !this.showExpenses;
    
    this.publishData();
  }

  displayListOfIgnoredTransactions() {
    this.showIgnored = true;
    this.showNotIgnored = false;
    this.expandList = true;

    this.publishData();
  }

  displayListOfNotIgnoredTransactions() {
    this.showIgnored = false;
    this.showNotIgnored = true;
    this.expandList = true;

    this.publishData();
  }

  toggleMode() {
    if (this.expandList) {
      this.selectedTransaction = null;
      this.selectedTag = null;
      this.showIgnored = true;
      this.showNotIgnored = true;
      this.publishData();
    }

    this.expandList = !this.expandList;
  }

  tagClickedOnChart(tag: Tag) {
    if (!this.selectedTag || this.selectedTag.name !== tag.name) {
      this.selectedTag = tag;
      this.expandList = true;
    } else {
      this.selectedTag = null;
    }

    this.publishData();
    this.activeTab = 'Transakcje';
  }
  
  tagClicked(tag: Tag) {
    if (this.activeTab === 'Transakcje') {
      this.tagSelected_transactionsList$.next(tag);
    } else if (this.activeTab === 'Filtry') {
      this.tagSelected_filterManager$.next(tag);
    }
  }

  addNewTag(inputElement: any) {
    this.tagService.createTag(inputElement.value, 'gray')
    .mergeMap(() => this.tagService.getTags())
    .subscribe(tags => this.tags = tags);
    inputElement.value = null;
  }

  changeTagColor(color: string, tagName: string) {
    this.tagService.changeTagColor(tagName, color).subscribe();
  }

  tagRemovalRequested(tag: Tag) {
    this.tagService.deleteTag(tag.name).subscribe();
  }

  private refresh(): void {
    const browsing = this.currentContextId ? 
      this.browsingService.browseByUploadId(this.currentContextId) :
      this.accountService.getAccounts().pipe(
        tap(accounts => {
          this.accounts = accounts;

          if (!this.selectedAccounts) {
            this.selectedAccounts = accounts;
          }
        }),
        flatMap(_ => this.browsingService.browse(this.dateRange.from, this.dateRange.to, this.selectedAccounts.map(a => a.number)))
      );

    forkJoin(
      browsing,
      this.tagService.getTags()
    ).subscribe(([browsingData, tags]) => {
      this.tags = tags;
      this.onBrowsingDataFetched(browsingData);
    });
  }

  private onBrowsingDataFetched(browsingData: IBrowsingData) {
    this.browsingData = browsingData;
    this.mapTransactions();
    this.publishData();
  }

  private mapTransactions() {
    this.browsingData.transactions.forEach(t => {
      if (!t.transaction.tags) {
        t.transaction.tags = [];
        const tags = t.tags
          .map(t => {
            const originalTag = this.tags.find(tag => tag.name === t.name);

            return {
              name: originalTag.name,
              color: originalTag.color,
              amount: t.amount,
            };
          });
        t.transaction.tags.push(...tags);
      }

      t.transaction.comment = t.comment;
    });
  }

  private publishData() {
    let chartData = this.getChartData();
    
    if (chartData.length === 0 && this.selectedTag) {
      this.selectedTag = null;
      chartData = this.getChartData();
    }
    
    this.chartData$.next(chartData);
    this.income$.next(this.browsingData.summary.totalIncome);
    this.transactionListData$.next(this.getTransactionListData());
  }
  
  private getChartData(): ChartDataItem[] {
    if (!this.browsingData || !this.showExpenses || !this.showNotIgnored) {
      return [];
    }

    const array: ChartDataItem[] = [];
    
    if (!this.selectedTag) {
      for (let tagName in this.browsingData.spendingsPerTag) {
        const spendings = this.browsingData.spendingsPerTag[tagName];
        
        if (spendings > 0) {
          array.push({
            tag: this.tags.find(t => t.name === tagName),
            spendings: spendings
          });
        }
      }
  
      if (this.browsingData.otherSpendings > 0) {
        array.push({
          tag: { name: 'Inne', color: 'lightgray', amount: this.browsingData.otherSpendings },
          spendings: this.browsingData.otherSpendings
        });
      }
    } else {
      array.push({
        tag: this.selectedTag,
        spendings: this.selectedTag.name !== 'Inne' ?
          this.browsingData.spendingsPerTag[this.selectedTag.name] : this.browsingData.otherSpendings
      })
    }

    return array
      .filter(x => x.spendings > 0)
      .sort((a, b) => a.tag.name === 'Inne' ? 1 : b.spendings - a.spendings);
  }

  private getTransactionListData(): Transaction[] {
    if (!this.browsingData) {
      return [];
    }

    let transactionsToShow = this.browsingData.transactions;

    if (!this.showIncome) {
      transactionsToShow = transactionsToShow.filter(t => t.transaction.amount < 0);
    }

    if (!this.showExpenses) {
      transactionsToShow = transactionsToShow.filter(t => t.transaction.amount > 0);
    }

    if (!this.showIgnored) {
      transactionsToShow = transactionsToShow.filter(t => !t.tags.find(tag => tag.name === 'IGNORE'));
    }

    if (!this.showNotIgnored) {
      transactionsToShow = transactionsToShow.filter(t => t.tags.find(tag => tag.name === 'IGNORE'));      
    }

    if (this.selectedTag) {
      return transactionsToShow
        .map(t => t.transaction)
        .filter(t => {
          if (this.selectedTag.name !== 'Inne') {
            return t.tags.findIndex(tag => tag.name === this.selectedTag.name) >= 0;
          } else {
            return t.tags.length === 0 || 
              Math.abs(t.tags.reduce((sum, tag) => sum += tag.amount, 0)) < Math.abs(t.amount);
          }
        });
    } else {
      return transactionsToShow.map(t => t.transaction);
    }
  }
}
