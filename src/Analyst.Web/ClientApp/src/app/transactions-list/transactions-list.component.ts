import { MappingService } from './../services/mapping.service';
import { Transaction } from './../models/transaction.model';
import { FilterService } from './../services/filter.service';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { Filter } from '../models/filter.model';
import { TagService } from '../services/tag.service';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css']
})
export class TransactionsListComponent implements OnInit {
  @Input() transactions$: Observable<Transaction[]>;
  @Output() transactionIgnoreValueChanged: EventEmitter<Transaction> = new EventEmitter<Transaction>();
  @Output() tagColorChangeRequested: EventEmitter<{ tagName: string, color: string }> = new EventEmitter<{ tagName: string, color: string }>();
  @Output() modeChanged: EventEmitter<'edit' | 'browse'> = new EventEmitter<'edit' | 'browse'>();
  selectedTransaction: Transaction;
  transactions: Transaction[];
  tags: Tag[];
  tagTooltipActive: { tagName: string, transactionId: number };
  changingTagColor: boolean;
  editModeActive: boolean = false;

  constructor(private tagService: TagService, private mappingService: MappingService) {
  }

  ngOnInit() {
    this.transactions$.subscribe(x => {
      this.transactions = x;
    });

    this.tagService.tags$.subscribe(x => {
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
  }

  addTagToSelectedTransaction(tag: Tag) {
    if (this.selectedTransaction) {
      this.mappingService.addTransactionToTag(tag.name, this.selectedTransaction.id).subscribe();
    }
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.mappingService.removeTransactionFromTag(tagName, transactionId).subscribe();
  }

  addNewTagTotransaction(inputElement: any, transactionId: number) {
    this.mappingService.addTransactionToTag(inputElement.value, transactionId).subscribe();
    inputElement.value = null;
  }

  addTagToTransaction(tag: Tag, transaction: Transaction) {
    this.mappingService.addTransactionToTag(tag.name, transaction.id).subscribe();
  }

  tagHovered(tagName: string, transactionId: number) {
    this.tagTooltipActive = { tagName, transactionId };
  }

  tagBlurred() {
    this.tagTooltipActive = null;
    this.changingTagColor = false;
  }

  isTagForbidden(tag: Tag, transaction: Transaction) {
    //return transaction.forbiddenTagNames.find(name => name === tag.name);
    return false;
  }

  isTagTooltipActive(tagName: string, transactionId: number) {
    return this.tagTooltipActive && this.tagTooltipActive.tagName === tagName && this.tagTooltipActive.transactionId === transactionId;
  }

  changeColorClicked() {
    this.changingTagColor = true;
  }

  changeTagColor(tagColorInput: any, tagName: string) {
    this.tagService.changeTagColor(tagName, tagColorInput.value).subscribe();
    tagColorInput.value = null;
    this.changingTagColor = false;
    this.tagTooltipActive = null;
  }

  toggleIgnored(transaction: Transaction) {
    this.transactionIgnoreValueChanged.emit(transaction);
  }
}
