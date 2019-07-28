import { Subject } from 'rxjs/Subject';
import { Mapping } from './../services/mapping.model';
import { MappingService } from './../services/mapping.service';
import { FilterService } from './../services/filter.service';
import { TagService } from './../services/tag.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Tag } from '../models/tag.model';
import { Filter } from '../models/filter.model';
import moment = require('moment');
import { take, filter } from 'rxjs/operators';
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
  mappings: Mapping[];
  transactions: Transaction[];
  tags: Tag[];
  showCalendar: boolean;
  dateRange: {from: Date, to: Date };
  selectedTag: Tag;
  selectedTransaction: Transaction;
  expandList: boolean = false;
  activeTab: string = 'Transakcje';

  constructor(
    private transactionService: TransactionService, 
    private tagService: TagService,
    private mappingService: MappingService,
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };

    // forkJoin(
    //   this.mappingService.mappings$.pipe(take(1)), 
    //   this.refreshTransactions().pipe(take(1)), 
    //   this.tagService.tags$).pipe(take(1))
    // .subscribe(([mappings, transactions, tags]) => {
    //   this.mappings = mappings;
    //   this.tags = tags;
    //   this.mapTags(mappings);
    // });

    // this.mappingService.mappings$.pipe(take(1)).subscribe(x => {
    //   this.mappings = x;
    //   this.mapTags(this.mappings);
    // });
    this.refreshTransactions().subscribe();
    this.tagService.tags$.pipe(
      tap(x => this.tags = x),
      filter(_ => !!this.mappings)
    ).subscribe(x => {
      this.mapTags(this.mappings);
    });

    this.mappingService.mappingsChanges$.subscribe(c => this.handleMappingChange(c))
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
    });
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

    mappings.filter(m => this.transactions.find(t => t.id === m.transaction.id)).forEach(m => {
      const tag = this.tags.find(t => t.name === m.tag.name);
      const transaction = this.transactions.find(t => t.id === m.transaction.id);
      
      if (!transaction.tags) {
        transaction.tags = [tag];
      } else if (!transaction.tags.find(t => t.name === tag.name)) {
        transaction.tags.push(tag);
      }
    });
  }

  private handleMappingChange(changes: Changes<Mapping>) {
    if (!this.mappings) {
      this.mappings = changes.new;
    } else {
      this.mappings.push(...changes.new);
    }

    this.mapTags(changes.new);

    changes.deleted.forEach(m => {
      const transaction = this.transactions.find(t => t.id === m.transaction.id);
      const index = transaction.tags.findIndex(t => t.name === m.tag.name);
      transaction.tags.splice(index, 1);
    });
    
    if (this.transactions) {
      this.emitFilteredTransactions();
    }
  }

  private refreshTransactions(): Observable<Transaction[]> {
    return this.transactionService.getTransactions(this.dateRange.from, this.dateRange.to).pipe(
      tap(x => {
        this.transactions = x;
        this.transactions.forEach(t => t.tags = []);
        this.mapTags(this.mappings);

        if (this.mappings) {
          this.emitFilteredTransactions();
        }
      }));
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
