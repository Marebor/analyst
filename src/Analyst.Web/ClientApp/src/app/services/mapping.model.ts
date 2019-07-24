import { Filter } from './../models/filter.model';
import { Transaction } from './../models/transaction.model';
import { Tag } from "../models/tag.model";

export class Mapping {
  tag: Tag;
  transaction: Transaction;
  filter: Filter;

  constructor(tag: Tag, transaction: Transaction, filter: Filter) {
    this.tag = tag;
    this.transaction = transaction;
    this.filter = filter;
  }

  isEqual(another: Mapping): boolean {
    return this.tag.name === another.tag.name && this.transaction.id === another.transaction.id && 
      ((this.filter && another.filter && this.filter.id === another.filter.id) || (!this.filter && !another.filter));
  }
}

export interface MappingsChange {
  newMappings: Mapping[],
  deletedMappings: Mapping[],
}

export interface TransactionTagPair {
  transactionId: number,
  tagName: string,
}