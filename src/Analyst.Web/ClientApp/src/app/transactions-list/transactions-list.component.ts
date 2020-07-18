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
  transactions: Transaction[];
  tags: Tag[];
  selectedTransactionIndex: number;
  expandedCommentTransaction: Transaction;
  commentEdited: boolean = false;
  commentText: string;
  editedTags: Tag[];
  temp_preventTransactionClick: boolean = false; // quick fix

  constructor(private transactionService: TransactionService) {
  }

  ngOnInit() {
    this.tagSelected$.subscribe(tag => {
      if (this.selectedTransactionIndex === null || this.selectedTransactionIndex === undefined) {
        return;
      }

      const selectedTransaction = this.transactions.find((t, i) => i === this.selectedTransactionIndex);
      
      if (!this.editedTags) {
        this.editedTags = JSON.parse(JSON.stringify(selectedTransaction.tags));
      } 
      
      const copiedTag = Object.assign({}, tag);
      const tagsAmountsSum = this.editedTags.reduce((prev, curr) => prev + curr.amount, 0);
      const remainingAmount = Math.abs(selectedTransaction.amount) - tagsAmountsSum;
      copiedTag.amount = remainingAmount;
      this.editedTags.push(copiedTag);
    });

    this.transactions$.subscribe(transactions => {
      this.transactions = transactions;

      if (this.selectedTransactionIndex && this.transactions.length <= this.selectedTransactionIndex) {
        this.selectedTransactionIndex = this.transactions.length - 1;
      }
    });
  }

  isIgnored(transaction: Transaction) {
    let ignoreTag = transaction.tags.find(t => t.name === "IGNORE");

    if (ignoreTag) {
      return ignoreTag.amount === Math.abs(transaction.amount);
    }

    return false;
  }

  transactionClicked(transactionIndex: number) {
    if (!this.temp_preventTransactionClick) {
      this.selectedTransactionIndex = this.selectedTransactionIndex === transactionIndex ? null : transactionIndex;
      this.editedTags = null;
    } else {
      this.temp_preventTransactionClick = false;
    }
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

  saveEditedTags() {
    if (this.selectedTransactionIndex === undefined || this.selectedTransactionIndex === null) {
      return;
    }

    const selectedTransaction = this.transactions.find((t, i) => i === this.selectedTransactionIndex);

    this.transactionService.saveTransactionTags(
      selectedTransaction.id, 
      this.editedTags)
    .subscribe(_ => this.editedTags = null);
  }

  editTransactionTags(transaction: Transaction) {
    const index = this.transactions.indexOf(transaction);

    this.selectedTransactionIndex = index;
    this.temp_preventTransactionClick = true;

    this.editedTags = JSON.parse(JSON.stringify(transaction.tags))
  }

  removeTagFromTransaction(tagName: string, transactionId: number) {
    this.transactionService.removeTagFromTransaction(transactionId, tagName).subscribe();
  }

  displayTagAmount(transaction: Transaction) {
    return transaction.tags.length > 1 || (transaction.tags.length === 1 && Math.abs(transaction.tags[0].amount) !== Math.abs(transaction.amount));
  }

  displayOthersAmount(transaction: Transaction) {
    return transaction.tags.length > 0 && this.getOthersAmount(transaction) > 0;
  }

  getOthersAmount(transaction: Transaction) {
    return Math.abs(transaction.amount) - transaction.tags.reduce((sum, tag) => sum += tag.amount, 0);
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
