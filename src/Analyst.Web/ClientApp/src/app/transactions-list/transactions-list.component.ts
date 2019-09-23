import { TransactionService } from './../services/transaction.service';
import { Transaction } from './../models/transaction.model';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { TagService } from '../services/tag.service';
import 'rxjs/add/operator/mergeMap';

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
  tags: Tag[];
  selectedTransaction: Transaction;

  constructor(private tagService: TagService, private transactionService: TransactionService) {
  }

  ngOnInit() {
    this.tagSelected$.subscribe(tag => {
      if (this.selectedTransaction && !this.selectedTransaction.tags.find(t => t.name === tag.name)) {
        this.transactionService.addTagToTransaction(this.selectedTransaction.id, tag.name).subscribe();
      }
    });

    this.transactions$.subscribe(transactions => this.transactions = transactions);
  }

  transactionClicked(transaction: Transaction) {
    this.selectedTransaction = this.selectedTransaction === transaction ? null : transaction;
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.transactionService.removeTagFromTransaction(transactionId, tagName).subscribe();
  }

  addNewTagTotransaction(inputElement: any, transactionId: number) {
    const tagName = inputElement.value;

    this.tagService.createTag(inputElement.value, 'gray')
    .mergeMap(() => this.transactionService.addTagToTransaction(transactionId, tagName))
    .subscribe();
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
