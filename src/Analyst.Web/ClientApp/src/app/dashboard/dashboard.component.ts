import { ChartDataItem } from './../chart/chart-data-item.model';
import { IBrowsingData } from './../models/browsing-data';
import { BrowsingService } from './../services/browsing.service';
import { Subject } from 'rxjs/Subject';
import { TagService } from './../services/tag.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { Tag } from '../models/tag.model';
import * as moment from 'moment'
import { forkJoin } from 'rxjs/observable/forkJoin';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  browsingData: IBrowsingData;
  chartData$: Subject<ChartDataItem[]> = new Subject<ChartDataItem[]>();
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

  constructor(
    private browsingService: BrowsingService,
    private transactionService: TransactionService, 
    private tagService: TagService,
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };

    this.refresh();

    this.browsingService.stateChange.subscribe(() => this.refresh());
  }

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;    
    this.browsingService.browse(this.dateRange.from, this.dateRange.to)
      .subscribe(browsingData => this.onBrowsingDataFetched(browsingData));
    this.showCalendar = false;
    this.selectedTag = null;
  }

  onFileSelected(file: any) {
    this.transactionService.addTransactionsFromXml(file).subscribe(browsingData => {
      if (browsingData.transactions.length > 0) {
        this.dateRange = { 
          from: browsingData.transactions.reduce((a, b) => 
            moment(a).isBefore(b.transaction.orderDate) ? a : b.transaction.orderDate, 
            browsingData.transactions[0].transaction.orderDate), 
          to: browsingData.transactions.reduce((a, b) => 
            moment(a).isAfter(b.transaction.orderDate) ? a : b.transaction.orderDate, 
            browsingData.transactions[0].transaction.orderDate)
        };
        this.onBrowsingDataFetched(browsingData);
      }

      this.loadingXml = false;
    });
  
    this.loadingXml = true;
  }

  toggleMode() {
    if (this.expandList) {
      this.selectedTransaction = null;
    }

    this.expandList = !this.expandList;
  }

  tagClickedOnChart(tag: Tag) {
    if (!this.selectedTag || this.selectedTag.name !== tag.name) {
      this.selectedTag = tag;
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

  changeTagColor(color: string, tagName: string) {
    this.tagService.changeTagColor(tagName, color).subscribe();
  }

  tagRemovalRequested(tag: Tag) {
    this.tagService.deleteTag(tag.name).subscribe();
  }

  changeTransactionIgnoreValue(transaction: Transaction) {
    if (transaction.ignored) {
      this.transactionService.changeIgnoredValue(transaction.id, false).subscribe();
    } else {
      this.transactionService.changeIgnoredValue(transaction.id, true).subscribe()
    }
  }

  private refresh(): void {
    forkJoin(
      this.browsingService.browse(this.dateRange.from, this.dateRange.to),
      this.tagService.getTags()
    ).subscribe(([browsingData, tags]) => {
      this.tags = tags;
      this.onBrowsingDataFetched(browsingData);
    });
  }

  private onBrowsingDataFetched(browsingData: IBrowsingData) {
    this.browsingData = browsingData;
    this.mapTags();
    this.publishData();
  }

  private mapTags() {
    this.browsingData.transactions.forEach(t => {
      if (!t.transaction.tags) {
        t.transaction.tags = [];
        const tags = t.tags.map(tagName => this.tags.find(tag => tag.name === tagName));
        t.transaction.tags.push(...tags);
      }
    });
  }

  private publishData() {
    let chartData = this.getChartData();
    
    if (chartData.length === 0 && this.selectedTag) {
      this.selectedTag = null;
      chartData = this.getChartData();
    }
    
    this.chartData$.next(chartData);
    this.transactionListData$.next(this.getTransactionListData());
  }
  
  private getChartData(): ChartDataItem[] {
    if (!this.browsingData) {
      return [];
    }

    const array: ChartDataItem[] = [];
    
    if (!this.selectedTag) {
      for (let tagName in this.browsingData.spendingsPerTag) {
        const spendings = this.browsingData.spendingsPerTag[tagName];
        
        if (spendings > 0) {
          array.push({
            tag: this.tags.find(t => t.name === tagName),
            transactions: [],
            spendings: spendings
          });
        }
      }
  
      if (this.browsingData.otherSpendings > 0) {
        array.push({
          tag: { name: 'Inne', color: 'lightgray' },
          transactions: [],
          spendings: this.browsingData.otherSpendings
        });
      }
    } else {
      array.push({
        tag: this.selectedTag,
        transactions: [],
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

    if (this.selectedTag) {
      return this.browsingData.transactions
        .map(t => t.transaction)
        .filter(t => this.selectedTag.name !== 'Inne' ?
          t.tags.findIndex(tag => tag.name === this.selectedTag.name) >= 0 : t.tags.length === 0);
    } else {
      return this.browsingData.transactions.map(t => t.transaction);
    }
  }
}
