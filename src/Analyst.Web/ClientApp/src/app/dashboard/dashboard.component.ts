import { ChangesHandler } from './../services/changes';
import { Subject } from 'rxjs/Subject';
import { Mapping } from './../services/mapping.model';
import { MappingService } from './../services/mapping.service';
import { TagService } from './../services/tag.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import {  Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import * as moment from 'moment'
import { take, filter, skip } from 'rxjs/operators';
import { tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { Changes } from '../services/changes';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  filteredTransactions$: Subject<Transaction[]> = new Subject<Transaction[]>();
  tagSelected_transactionsList$: Subject<Tag> = new Subject<Tag>();
  tagSelected_filterManager$: Subject<Tag> = new Subject<Tag>();
  mappings: Mapping[] = [];
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
    private transactionService: TransactionService, 
    private tagService: TagService,
    private mappingService: MappingService,
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };

    //this.refreshTransactions().subscribe();
    this.tagService.tags$.pipe(
      skip(1),
      tap(x => this.tags = x),
      filter(_ => !!this.mappings)
    ).subscribe(x => {
      this.mapTags(this.mappings);
    });

    this.mappingService.mappingsChanges$.pipe(skip(1)).subscribe(c => {
      ChangesHandler.handle(c, this.mappings, (a, b) => a.isEqual(b));
      this.handleMappingChange(c);
    });

    forkJoin(
      this.transactionService.getTransactions(this.dateRange.from, this.dateRange.to),
      this.tagService.tags$.pipe(take(1)),
      this.mappingService.mappingsChanges$.pipe(take(1))
    ).subscribe(([transactions, tags, mappingsChanges]) => {
      this.tags = tags;
      ChangesHandler.handle(mappingsChanges, this.mappings, (a, b) => a.isEqual(b));
      this.onTransactionsRefreshed(transactions);
    });
  }

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;
    this.refreshTransactions().subscribe();
    this.showCalendar = false;
  }

  onFileSelected(file: any) {
    this.transactionService.addTransactionsFromXml(file).subscribe(transactions => {
      if (transactions.length > 0) {
        this.transactions = transactions;
        this.transactions.forEach(t => t.tags = []);
        this.mapTags(this.mappings);
        this.selectedTag = null;
        this.filteredTransactions$.next(transactions);
        this.dateRange = { 
          from: transactions.reduce((a, b) => moment(a).isBefore(b.orderDate) ? a : b.orderDate, transactions[0].orderDate), 
          to: transactions.reduce((a, b) => moment(a).isAfter(b.orderDate) ? a : b.orderDate, transactions[0].orderDate)
        }
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

    this.emitFilteredTransactions();
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
    const currentValue = true && transaction.ignored;
    this.transactionService.setIgnoredValue(transaction.id, !currentValue).subscribe(() => {
      this.transactions.find(t => t.id === transaction.id).ignored = !currentValue;
      this.emitFilteredTransactions();
    });
  }

  private mapTags(mappings: Mapping[]) {
    if (!mappings || !this.tags || !this.transactions) {
      return;
    }

    mappings.forEach(m => {
      const tag = this.tags.find(t => t.name === m.tag.name);
      const transaction = this.transactions.find(t => t.id === m.transaction.id);
      
      if (!tag || !transaction) {
        return;
      } else  if (!transaction.tags) {
        transaction.tags = [tag];
      } else if (!transaction.tags.find(t => t.name === tag.name)) {
        transaction.tags.push(tag);
      }
    });
  }

  private handleMappingChange(changes: Changes<Mapping>) {
    this.mapTags(changes.new);

    changes.deleted.forEach(m => {
      const transaction = this.transactions.find(t => t.id === m.transaction.id);
      
      if (transaction) {
        const index = transaction.tags.findIndex(t => t.name === m.tag.name);

        if (index >= 0) {
          transaction.tags.splice(index, 1);
        }
      }
    });
    
    if (this.transactions) {
      this.emitFilteredTransactions();
    }
  }

  private refreshTransactions(): Observable<Transaction[]> {
    return this.transactionService.getTransactions(this.dateRange.from, this.dateRange.to).pipe(
      tap(x => this.onTransactionsRefreshed(x)));
  }

  private onTransactionsRefreshed(transactions: Transaction[]): void {
    this.transactions = transactions;
    this.transactions.forEach(t => t.tags = []);
    this.mapTags(this.mappings);
    this.emitFilteredTransactions();
  }

  private emitFilteredTransactions() {
    if (!this.selectedTag) {
      this.filteredTransactions$.next(this.transactions);
    } else if (this.selectedTag.name !== 'Inne') {
      this.filteredTransactions$.next(
        this.transactions.filter(t => t.tags.find(x => x.name === this.selectedTag.name))
      );
    } else {
      this.filteredTransactions$.next(
        this.transactions.filter(t => t.tags.length === 0)
      );
    }
  }
}
