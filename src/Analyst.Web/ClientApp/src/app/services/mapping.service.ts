import { Filter } from './../models/filter.model';
import { Tag } from './../models/tag.model';
import { Transaction } from './../models/transaction.model';
import { FilterService } from './filter.service';
import { TagService } from './tag.service';
import { TransactionService } from './transaction.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Mapping, MappingsChange, TransactionTagPair } from './mapping.model';
import { Subject } from 'rxjs';
import { tap, skip } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { first } from 'rxjs/operator/first';
import { take } from 'rxjs/operators';


@Injectable()
export class MappingService {
  private _mappings$: Subject<Mapping[]> = new Subject<Mapping[]>();
  private _mappingsChanges$: Subject<MappingsChange> = new Subject<MappingsChange>();
  private mappings: Mapping[] = [];
  private transactions: Transaction[];
  private tags: Tag[];
  private filters: Filter[];
  private tagAssignments: TransactionTagPair[];
  private tagSuppressions: TransactionTagPair[];

  get mappings$(): Observable<Mapping[]> {
    return this._mappings$.asObservable();
  }

  get mappingsChanges$(): Observable<MappingsChange> {
    return this._mappingsChanges$;
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient, 
  private transactionService: TransactionService, private tagService: TagService, private filterService: FilterService) {
    forkJoin(
      this.transactionService.newTransactionsFetched$.pipe(take(1)),
      this.tagService.tags$.pipe(take(1)),
      this.filterService.filters$.pipe(take(1)),
      this.getTagAssignments().pipe(take(1)),
      this.getTagsuppressions().pipe(take(1))
    ).subscribe(([transactions, tags, filters, tagAssignments, tagSuppressions]) => {
      this.transactions = transactions;
      this.tags = tags;
      this.filters = filters;
      this.tagAssignments = tagAssignments;
      this.tagSuppressions = tagSuppressions;

      this.updateMappings(transactions, filters, [], tagAssignments, [], tagSuppressions, []);
    });

    this.transactionService.newTransactionsFetched$.pipe(skip(1)).subscribe(x => this.updateMappings(x, [], [], [], [], [], []));
  }

  addTransactionToTag(tagName: string, transactionId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.originUrl}api/tags/${tagName}/transactions`, `\"${transactionId}\"` , { headers: { 'Content-Type': 'application/json' } }).pipe(
      tap(() => {
        const index = this.tagSuppressions.findIndex(s => s.transactionId === transactionId && s.tagName === tagName);

        if (index >= 0) {
          const suppression = this.tagSuppressions.splice(index, 1)[0];
          this.updateMappings([], [], [], [], [], [], [suppression])
        } else {
          const assignment = { transactionId, tagName };
          this.tagAssignments.push(assignment);
          this.updateMappings([], [], [], [assignment], [], [], []);
        }
      })
    );
  }

  removeTransactionFromTag(tagName: string, transactionId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.originUrl}api/tags/${tagName}/transactions/${transactionId}`).pipe(
      tap(() => {
        const index = this.tagAssignments.findIndex(a => a.transactionId === transactionId && a.tagName === tagName);

        if (index >= 0) {
          const assignment = this.tagAssignments.splice(index, 1)[0];
          this.updateMappings([], [], [], [], [assignment], [], []);
        } else {
          const suppression = { transactionId, tagName };
          this.tagSuppressions.push(suppression);
          this.updateMappings([], [], [], [], [], [suppression], []);
        }
      })
    );
  }

  private getTagAssignments(): Observable<TransactionTagPair[]> {
    return this.httpClient.get<TransactionTagPair[]>(`${this.originUrl}api/tags/assignments`);
  }

  private getTagsuppressions(): Observable<TransactionTagPair[]> {
    return this.httpClient.get<TransactionTagPair[]>(`${this.originUrl}api/tags/suppressions`);
  }

  private updateMappings(newTransactions: Transaction[], newFilters: Filter[], deletedFilters: Filter[],
    newAssignments: TransactionTagPair[], deletedAssignments: TransactionTagPair[], 
    newSuppressions: TransactionTagPair[], deletedSuppressions: TransactionTagPair[]) {

    const newFiltersBasedMappings = this.transactions && this.transactions !== newTransactions ? 
      this.getFilterBasedMappings(this.transactions, newFilters) : [];
    const newAssignmentsBasedMappings = this.transactions && this.transactions !== newTransactions ? 
      this.getAssignmentBasedMappings(this.transactions, newAssignments) : [];
    const newDeletedSuppressionsBasedMappings = this.transactions && this.transactions !== newTransactions ? 
      this.getAssignmentBasedMappings(this.transactions, deletedSuppressions) : [];

    const newTransactionsFiltersBasedMappings = this.filters ?
      this.getFilterBasedMappings(newTransactions, this.filters) : [];
    const newTransactionsAssignmentsBasedMappings = this.getAssignmentBasedMappings(newTransactions, this.tagAssignments);
    const newTransactionsDeletedSuppressionsBasedMappings = this.getAssignmentBasedMappings(newTransactions, deletedSuppressions);

    const newMappings = newFiltersBasedMappings
      .concat(newAssignmentsBasedMappings)
      .concat(newDeletedSuppressionsBasedMappings)
      .concat(newTransactionsFiltersBasedMappings)
      .concat(newTransactionsAssignmentsBasedMappings)
      .concat(newTransactionsDeletedSuppressionsBasedMappings);
    this.spliceTransactionTagPairs(newMappings, this.tagSuppressions);

    const deletedFiltersBasedMappings = this.spliceMappingsBasedOnFilters(this.mappings, deletedFilters);
    const deletedSuppressionsBasedMappings = this.spliceTransactionTagPairs(this.mappings, newSuppressions);
    const deletedAssignmentsBasedMappings = this.spliceTransactionTagPairs(this.mappings, deletedAssignments);

    const deletedMappings = deletedFiltersBasedMappings
      .concat(deletedSuppressionsBasedMappings)
      .concat(deletedAssignmentsBasedMappings);
    
    const changes = { newMappings, deletedMappings };
    this._mappingsChanges$.next(changes);
    this.applyMappingChanges(changes);
  }

  private getFilterBasedMappings(transactions: Transaction[], filters: Filter[]): Mapping[] {
    const newMappings: Mapping[] = [];

    transactions.forEach(t => {
      filters.forEach(f => {
        if (this.filterService.doesTransactionMeetFilterConditions(t, f)) {
          f.tagNamesIfTrue.forEach(name => {
            const mapping = new Mapping(this.tags.find(x => x.name === name), t, f);

            if (!this.mappings.find(m => m.isEqual(mapping))) {
              newMappings.push(mapping);
            }
          });
        }
      })
    });

    return newMappings;
  }

  private getAssignmentBasedMappings(transactions: Transaction[], tagAssignments: TransactionTagPair[]): Mapping[] {
    if (transactions.length === 0) {
      return [];
    }

    const newMappings: Mapping[] = [];

    tagAssignments.forEach(a => {
      const transaction = transactions.find(t => t.id === a.transactionId);
      const tag = this.tags.find(t => t.name === a.tagName);
      const mapping = new Mapping(tag, transaction, null);

      if (!this.mappings.find(m => m.isEqual(mapping))) {
        newMappings.push(mapping);
      }
    });

    return newMappings;
  }

  private spliceMappingsBasedOnFilters(mappings: Mapping[], deletedFilters: Filter[]): Mapping[] {
    const deletedMappings: Mapping[] = [];

    deletedFilters.forEach(df => {
      const filterIndex = this.filters.findIndex(f => f.id === df.id)
      this.filters.splice(filterIndex, 1);

      let mappingIndex: number = null;
      while (mappingIndex = mappings.findIndex(m => m.filter.id === df.id)) {
        deletedMappings.push(...mappings.splice(mappingIndex, 1));
      }
    });

    return deletedMappings;
  }

  private spliceTransactionTagPairs(mappings: Mapping[], tagSuppressions: TransactionTagPair[]): Mapping[] {
    const deletedMappings: Mapping[] = [];
    
    tagSuppressions.forEach(s => {
      const index = mappings.findIndex(m => m.transaction.id === s.transactionId && m.tag.name === s.tagName);

      if (index >= 0) {
        deletedMappings.push(...mappings.splice(index, 1));
      }
    });

    return deletedMappings;
  }

  private applyMappingChanges(changes: MappingsChange) {
    changes.deletedMappings.forEach(dm => {
      const index = this.mappings.findIndex(m => m.isEqual(dm));

      this.mappings.splice(index, 1);
    });

    this.mappings = this.mappings.concat(changes.newMappings)
    this._mappings$.next(this.mappings);
  }
}
