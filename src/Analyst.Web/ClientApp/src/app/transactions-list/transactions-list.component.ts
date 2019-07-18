import { Transaction } from '../models/transaction.model';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css']
})
export class TransactionsListComponent implements OnInit {
  @Input() transactions$: Observable<Transaction[]>;
  @Input() tags$: Observable<Tag[]>;
  @Output() tagAdditionRequested: EventEmitter<{ tagName: string, transactionId: number }> = new EventEmitter<{ tagName: string, transactionId: number }>();
  @Output() tagRemovalRequested: EventEmitter<{ tagName: string, transactionId: number }> = new EventEmitter<{ tagName: string, transactionId: number }>();
  @Output() tagColorChangeRequested: EventEmitter<{ tagName: string, color: string }> = new EventEmitter<{ tagName: string, color: string }>();
  @Output() modeChanged: EventEmitter<'edit' | 'browse'> = new EventEmitter<'edit' | 'browse'>();
  selectedTransaction: Transaction;
  transactions: Transaction[];
  tags: Tag[];
  tagTooltipActive: { tagName: string, transactionId: number };
  changingTagColor: boolean;
  editModeActive: boolean = false;

  ngOnInit() {
    this.transactions$.subscribe(x => {
      this.transactions = x;
    });

    this.tags$.subscribe(x => {
      this.tags = x;
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

    if (!this.editModeActive) {
      this.toggleMode();
    }
  }

  addTagToTransaction(tag: Tag) {
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

  tagHovered(tagName: string, transactionId: number) {
    this.tagTooltipActive = { tagName, transactionId };
  }

  tagBlurred() {
    this.tagTooltipActive = null;
    this.changingTagColor = false;
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

  getTagsForTransaction(transactionId: number) {
    return this.tags ? this.tags.filter(tag => tag.transactionsIds.indexOf(transactionId) > -1) : [];
  }
}
