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
  filteredTransactions$: Subject<Transaction[]> = new Subject<Transaction[]>();
  tagSelected_transactionsList$: Subject<Tag> = new Subject<Tag>();
  tagSelected_filterManager$: Subject<Tag> = new Subject<Tag>();
  transactions: Transaction[];
  tags: Tag[];
  showCalendar: boolean;
  dateRange: {from: Date, to: Date };
  selectedTag: Tag;
  selectedTransaction: Transaction;
  expandList: boolean = false;
  activeTab: string = 'Transakcje';
  loadingXml: boolean = false;

  get chartData(): ChartDataItem[] {
    if (!this.browsingData) {
      return [];
    }

    const array: ChartDataItem[] = [];
    
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

    return array;
  }

  constructor(
    private browsingService: BrowsingService,
    private transactionService: TransactionService, 
    private tagService: TagService,
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };

    forkJoin(
      this.browsingService.browse(this.dateRange.from, this.dateRange.to),
      this.tagService.getTags()
    ).subscribe(([browsingData, tags]) => {
      this.tags = tags;
      this.browsingData = browsingData;
      this.mapTags();
      this.transactions = this.browsingData.transactions.map(t => t.transaction);
    });
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

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;
    this.refresh();
    this.showCalendar = false;
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
        this.browsingData = browsingData;
        this.mapTags();
        this.transactions = this.browsingData.transactions.map(t => t.transaction);
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
    const isIgnored = transaction.tags.findIndex(tag => tag.name === 'IGNORED') !== -1;

    if (isIgnored) {
      this.transactionService.removeTagFromTransaction(transaction.id, 'IGNORED')
        .subscribe(() => {
          const index = transaction.tags.findIndex(tag => tag.name === 'IGNORED');
          transaction.tags.splice(index, 1);
        });
    } else {
      this.transactionService.addTagToTransaction(transaction.id, 'IGNORED')
        .subscribe(() => {
          const tag = this.tags.find(t => t.name === 'IGNORED');
          transaction.tags.push(tag);
        })
    }
  }

  private refresh(): void {
    this.browsingService.browse(this.dateRange.from, this.dateRange.to)
      .subscribe(browsingData => {
        this.browsingData = browsingData;
        this.mapTags();
        this.transactions = this.browsingData.transactions.map(t => t.transaction);
      });
  }
  get sortedData(): { tagName: string, spendings: number }[] {
    if (!this.browsingData) {
      return [];
    }

    const array: { tagName: string, spendings: number }[] = [];
    
    for (let key in this.browsingData.spendingsPerTag) {
      array.push({ tagName: key, spendings: this.browsingData.spendingsPerTag[key] });
    }

    return array.sort((a, b) => b.spendings - a.spendings);
  }
}
