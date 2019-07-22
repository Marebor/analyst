import { FilterService } from './../services/filter.service';
import { TagService } from './../services/tag.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../services/transaction.service';
import { BehaviorSubject } from 'rxjs';
import { Tag } from '../models/tag.model';
import { Filter } from '../models/filter.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  transactions$: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>([]);
  tags$: BehaviorSubject<Tag[]> = new BehaviorSubject<Tag[]>([]);
  filters$: BehaviorSubject<Filter[]> = new BehaviorSubject<Filter[]>([]);
  showCalendar: boolean;
  dateRange: {from: Date, to: Date };
  expandList: boolean = false;

  constructor(
    private transactionService: TransactionService, 
    private tagService: TagService,
    private filterService: FilterService
    ) { }

  ngOnInit() {
    const today = new Date();
    const days = 14;
    this.dateRange = { to: new Date(), from: new Date(today.setDate(today.getDate() - days)) };
    this.refresh();
  }

  onDateRangeChanged(dateRange: { from: Date, to: Date }) {
    this.dateRange = dateRange;
    this.refresh();
    this.showCalendar = false;
  }

  onFileSelected(file: any) {
    this.transactionService.addTransactionsFromXml(file).subscribe(() => this.refresh());
  }

  onListModeChanged(mode: 'edit' | 'browse') {
    this.expandList = mode === 'edit';
  }

  addTagToTransaction(tagName: string, transactionId: number) {
    this.transactionService.addTagTotransaction(tagName, transactionId).subscribe(() => this.refresh());
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.transactionService.removeTagFromTransaction(tagName, transactionId).subscribe(() => this.refresh());
  }

  changeTagColor(tagName: string, color: string) {
    this.tagService.changeTagColor(tagName, color).subscribe(() => this.refresh());
  }

  private refresh() {
    this.transactionService.getTransactions(this.dateRange.from, this.dateRange.to).subscribe(x => {
      this.transactions$.next(x);
    });
    
    this.tagService.getAvailableTags().subscribe(x => {
      this.tags$.next(x);
    });

    this.filterService.getFilters().subscribe(x => {
      this.filters$.next(x);
    })
  }
}
