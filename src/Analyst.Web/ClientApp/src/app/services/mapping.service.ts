import { Filter } from './../models/filter.model';
import { Tag } from './../models/tag.model';
import { Transaction } from './../models/transaction.model';
import { FilterService } from './filter.service';
import { TagService } from './tag.service';
import { TransactionService } from './transaction.service';
import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Mapping, TransactionTagPair } from './mapping.model';
import { Subject } from 'rxjs';
import { tap, skip, switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { take } from 'rxjs/operators';
import { Changes, ChangesHandler } from './changes';


@Injectable()
export class MappingService {
  private _mappingsChanges$: Subject<Changes<Mapping>> = new Subject<Changes<Mapping>>();
  private mappings: Mapping[] = [];
  private transactions: Transaction[] = [];
  private tags: Tag[] = [];
  private filters: Filter[] = [];
  private tagAssignments: TransactionTagPair[] = [];
  private tagSuppressions: TransactionTagPair[] = [];

  get mappingsChanges$(): Observable<Changes<Mapping>> {
    return this._mappingsChanges$;
  }

  constructor(@Inject('BASE_URL') private originUrl: string, private httpClient: HttpClient, 
  private transactionService: TransactionService, private tagService: TagService, private filterService: FilterService) {
    forkJoin(
      this.transactionService.newTransactionsFetched$.pipe(take(1)),
      this.tagService.tags$.pipe(take(1)),
      this.filterService.filtersChanged$.pipe(take(1)),
      this.getTagAssignments().pipe(take(1)),
      this.getTagsuppressions().pipe(take(1))
    ).subscribe(([transactions, tags, filtersChange, tagAssignments, tagSuppressions]) => {
      this.transactions = transactions;
      this.tags = tags;
      this.tagAssignments = tagAssignments;
      this.tagSuppressions = tagSuppressions;

      ChangesHandler.handle(filtersChange, this.filters, (a, b) => a.id === b.id);
      this.updateMappings(transactions, filtersChange.new, filtersChange.deleted, tagAssignments, [], tagSuppressions, []);
    });

    this.transactionService.newTransactionsFetched$.pipe(skip(1)).subscribe(x => this.updateMappings(x, [], [], [], [], [], []));
    this.filterService.filtersChanged$.pipe(skip(1)).subscribe(x => {
      ChangesHandler.handle(x, this.filters, (a, b) => a.id === b.id);
      this.updateMappings([], x.new, x.deleted, [], [], [], []);
    });
  }

  addTransactionToTag(tagName: string, transactionId: number): Observable<void> {
    const observable = this.httpClient.post<void>(`${this.originUrl}api/tags/${tagName}/transactions`, `\"${transactionId}\"` , { headers: { 'Content-Type': 'application/json' } }).pipe(
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

    if (!this.tags.find(t => t.name === tagName)) {
      return this.tagService.createTag(tagName, 'gray').pipe(
        switchMap(_ => observable)
      );
    } else {
      return observable;
    }
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

  private handleFiltersChange(changes: Changes<Filter>) {
    changes
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
    
    const changes = { new: newMappings, deleted: deletedMappings };
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

      if (!transaction) {
        return;
      }

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
      deletedMappings.push(...mappings.filter(m => m.filter && m.filter.id === df.id));
    });

    return deletedMappings;
  }

  private spliceTransactionTagPairs(mappings: Mapping[], tagSuppressions: TransactionTagPair[]): Mapping[] {
    const deletedMappings: Mapping[] = [];
    
    tagSuppressions.forEach(s => {
      const mapping = mappings.find(m => m.transaction.id === s.transactionId && m.tag.name === s.tagName && !m.filter);

      if (mapping) {
        deletedMappings.push(mapping);
      }
    });

    return deletedMappings;
  }

  private applyMappingChanges(changes: Changes<Mapping>) {
    changes.deleted.forEach(dm => {
      const index = this.mappings.findIndex(m => m.isEqual(dm));

      if (index >= 0) {
        this.mappings.splice(index, 1);
      }
    });

    this.mappings.push(...changes.new);
    this._mappingsChanges$.next(changes);
  }
}
