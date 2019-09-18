import { IBrowsingData } from './../models/browsing-data';
import { BrowsingService } from './../services/browsing.service';
import { Subject } from 'rxjs/Subject';
import { TagService } from './../services/tag.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import {  Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import * as moment from 'moment'
import { flatMap } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
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

  constructor(
    private browsingService: BrowsingService,
    private transactionService: TransactionService, 
    private tagService: TagService,
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };

    this.tagService
      .getTags()
      .subscribe(tags => this.tags = tags);
    this.browsingService
      .browse(this.dateRange.from, this.dateRange.to)
      .subscribe(result => this.browsingData = result);

    forkJoin(
      this.browsingService
        .browse(this.dateRange.from, this.dateRange.to)
        .pipe(
          tap(result => this.browsingData = result),
          flatMap(result => this.transactionService.getTransactions(
            this.getDistinctTansactionIds(result.transactionsPerTag)))),
      this.tagService.getTags()
    ).subscribe(([transactions, tags]) => {
      this.tags = tags;
      this.handleTransactionsChange(transactions);
    });
  }

  private getDistinctTansactionIds(transactionsPerTag: { [tagName: string]: number[]}[]): number[] {
    const ids: number[] = [];

    for (let tag in transactionsPerTag) {
      const notExistingIds = (<any>transactionsPerTag[tag]).filter(x => ids.indexOf(x) === -1);
      ids.push(...notExistingIds);
    }

    return ids;
  }

  private handleTransactionsChange(transactions: Transaction[]) {

  }

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;
    this.refresh();
    this.showCalendar = false;
  }

  onFileSelected(file: any) {
    this.transactionService.addTransactionsFromXml(file).subscribe(transactions => {
      // if (transactions.length > 0) {
      //   this.dateRange = { 
      //     from: transactions.reduce((a, b) => moment(a).isBefore(b.orderDate) ? a : b.orderDate, transactions[0].orderDate), 
      //     to: transactions.reduce((a, b) => moment(a).isAfter(b.orderDate) ? a : b.orderDate, transactions[0].orderDate)
      //   }
      // }

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
      });
  }
}
