import { TransactionService } from '../services/transaction.service';
import { Transaction } from '../models/transaction.model';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
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
  selectedTransactionIndex: number;
  expandedCommentTransaction: Transaction;
  commentEdited: boolean = false;
  commentText: string;

  constructor(private transactionService: TransactionService) {
  }

  ngOnInit() {
    this.tagSelected$.subscribe(tag => {
      if (!this.selectedTransactionIndex) {
        return;
      }

      const selectedTransaction = this.transactions.find((t, i) => i === this.selectedTransactionIndex);
      
      if (!selectedTransaction.tags.find(t => t.name === tag.name)) {
        this.transactionService.addTagToTransaction(selectedTransaction.id, tag.name).subscribe();
      }
    });

    this.transactions$.subscribe(transactions => {
      this.transactions = transactions;

      if (this.selectedTransactionIndex && this.transactions.length <= this.selectedTransactionIndex) {
        this.selectedTransactionIndex = this.transactions.length - 1;
      }
    });
  }

  transactionClicked(transactionIndex: number) {
    this.selectedTransactionIndex = this.selectedTransactionIndex === transactionIndex ? null : transactionIndex;
  }

  commentIconClicked(transaction: Transaction) {
    this.expandedCommentTransaction = transaction;

    if (!transaction.comment) {
      this.editCommentRequested(transaction);
    }
  }

  commentIconHovered(transaction: Transaction) {
    if (transaction.comment) {
      this.expandedCommentTransaction = transaction;
    }
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.transactionService.removeTagFromTransaction(transactionId, tagName).subscribe();
  }

  isTagForbidden(tag: Tag, transaction: Transaction) {
    //return transaction.forbiddenTagNames.find(name => name === tag.name);
    return false;
  }

  toggleIgnored(transaction: Transaction) {
    this.transactionIgnoreValueChanged.emit(transaction);
  }

  closeComment() {
    this.expandedCommentTransaction = null;
    this.commentEdited = false;
    this.commentText = null;
  }

  editCommentRequested(transaction: Transaction) {
    this.commentEdited = true;
    this.commentText = transaction.comment;
  }

  onCommentEdited(transaction: Transaction) {
    this.transactionService.editComment(transaction.id, this.commentText).subscribe();
    this.closeComment();
  }

  removeComment(transaction: Transaction) {
    this.transactionService.removeComment(transaction.id).subscribe();
    this.closeComment();
  }
}
