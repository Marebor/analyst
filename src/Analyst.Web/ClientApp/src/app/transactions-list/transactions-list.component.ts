import { MappingService } from './../services/mapping.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { TagService } from '../services/tag.service';

@Component({
  selector: 'app-transactions-list',
  templateUrl: './transactions-list.component.html',
  styleUrls: ['./transactions-list.component.css']
})
export class TransactionsListComponent implements OnInit {
  @Input() transactions$: Observable<Transaction[]>;
  @Input() tagSelected$: Observable<Tag>;
  @Output() transactionIgnoreValueChanged: EventEmitter<Transaction> = new EventEmitter<Transaction>();
  transactions: Transaction[];
  selectedTransaction: Transaction;

  constructor(private tagService: TagService, private mappingService: MappingService) {
  }

  ngOnInit() {
    this.transactions$.subscribe(x => this.transactions = x);
    this.tagSelected$.subscribe(tag => {
      if (this.selectedTransaction && !this.selectedTransaction.tags.find(t => t.name === tag.name)) {
        this.mappingService.addTransactionToTag(tag.name, this.selectedTransaction.id).subscribe();
      }
    });
  }

  transactionClicked(transaction: Transaction) {
    this.selectedTransaction = this.selectedTransaction === transaction ? null : transaction;
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.mappingService.removeTransactionFromTag(tagName, transactionId).subscribe();
  }

  addNewTagTotransaction(inputElement: any, transactionId: number) {
    this.mappingService.addTransactionToTag(inputElement.value, transactionId).subscribe();
    inputElement.value = null;
  }

  isTagForbidden(tag: Tag, transaction: Transaction) {
    //return transaction.forbiddenTagNames.find(name => name === tag.name);
    return false;
  }

  changeTagColor(color: string, tagName: string) {
    this.tagService.changeTagColor(tagName, color).subscribe();
  }

  toggleIgnored(transaction: Transaction) {
    this.transactionIgnoreValueChanged.emit(transaction);
  }
}
