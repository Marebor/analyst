import { Transaction } from './../models/transaction.model';
import { FilterService } from './../services/filter.service';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { Filter } from '../models/filter.model';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css']
})
export class TransactionsListComponent implements OnInit {
  @Input() transactions$: Observable<Transaction[]>;
  @Input() tags$: Observable<Tag[]>;
  @Input() filters$: Observable<Filter[]>;
  @Output() tagAdditionRequested: EventEmitter<{ tagName: string, transactionId: number }> = new EventEmitter<{ tagName: string, transactionId: number }>();
  @Output() tagRemovalRequested: EventEmitter<{ tagName: string, transactionId: number }> = new EventEmitter<{ tagName: string, transactionId: number }>();
  @Output() tagColorChangeRequested: EventEmitter<{ tagName: string, color: string }> = new EventEmitter<{ tagName: string, color: string }>();
  @Output() modeChanged: EventEmitter<'edit' | 'browse'> = new EventEmitter<'edit' | 'browse'>();
  filterAssignments: { transaction: Transaction, tags: Tag[] }[] = [];
  selectedTransaction: Transaction;
  transactions: Transaction[];
  tags: Tag[];
  filters: Filter[];
  tagTooltipActive: { tagName: string, transactionId: number };
  changingTagColor: boolean;
  editModeActive: boolean = false;

  constructor(private filterService: FilterService) { }

  ngOnInit() {
    this.transactions$.subscribe(x => {
      this.transactions = x;
      this.refresh();
    });

    this.tags$.subscribe(x => {
      this.tags = x;
      this.refresh();
    });

    this.filters$.subscribe(x => {
      this.filters = x;
      this.refresh();
    });
  }

  toggleMode() {
    if (this.editModeActive) {
      this.selectedTransaction = null;
    }

    this.editModeActive = !this.editModeActive;
    this.modeChanged.emit(this.editModeActive ? 'edit' : 'browse');
  }

  transactionClicked(transaction: Transaction) {
    this.selectedTransaction = this.selectedTransaction === transaction ? null : transaction;
  }

  addTagToSelectedTransaction(tag: Tag) {
    if (this.selectedTransaction) {
      this.tagAdditionRequested.emit({ tagName: tag.name, transactionId: this.selectedTransaction.id });
    }
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.tagRemovalRequested.emit({ tagName, transactionId });
  }

  addNewTagTotransaction(inputElement: any, transactionId: number) {
    this.tagAdditionRequested.emit({ tagName: inputElement.value, transactionId });
    inputElement.value = null;
  }

  addTagToTransaction(tag: Tag, transaction: Transaction) {
    this.tagAdditionRequested.emit({ tagName: tag.name, transactionId: transaction.id });
  }

  tagHovered(tagName: string, transactionId: number) {
    this.tagTooltipActive = { tagName, transactionId };
  }

  tagBlurred() {
    this.tagTooltipActive = null;
    this.changingTagColor = false;
  }

  isTagForbidden(tag: Tag, transaction: Transaction) {
    return transaction.forbiddenTagNames.find(name => name === tag.name);
  }

  isTagTooltipActive(tagName: string, transactionId: number) {
    return this.tagTooltipActive && this.tagTooltipActive.tagName === tagName && this.tagTooltipActive.transactionId === transactionId;
  }

  changeColorClicked() {
    this.changingTagColor = true;
  }

  changeTagColor(tagColorInput: any, tagName: string) {
    this.tagColorChangeRequested.emit({ tagName, color: tagColorInput.value });
    tagColorInput.value = null;
    this.changingTagColor = false;
    this.tagTooltipActive = null;
  }

  getTagsForTransaction(transaction: Transaction): Tag[] {
    const filterAssignment = this.filterAssignments.find(x => x.transaction.id === transaction.id);
    return (filterAssignment ? filterAssignment.tags : [])
      .concat(transaction.assignedTagNames
        .map(tagName => this.tags.find(tag => tag.name === tagName))
        .filter(tag => !!tag)
      );
  }

  private refresh() {
    if (this.transactions && this.tags && this.filters) {
      this.filterAssignments = this.transactions.map(transaction => {
        return { transaction, tags: this.filterService
          .getTagNames(transaction, this.filters)
          .map(tagName => this.tags.find(tag => tag.name === tagName))
          .filter(tag => !!tag) };
      });
    }
  }
}
