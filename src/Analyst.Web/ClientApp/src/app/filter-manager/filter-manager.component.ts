import { ChangesHandler } from './../services/changes';
import { TagService } from './../services/tag.service';
import { Tag } from './../models/tag.model';
import { FilterService } from './../services/filter.service';
import { Component, OnInit, ViewChild, AfterViewChecked, Output, EventEmitter, Input } from '@angular/core';
import { Filter } from '../models/filter.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-filter-manager',
  templateUrl: './filter-manager.component.html',
  styleUrls: ['./filter-manager.component.css']
})
export class FilterManagerComponent implements OnInit, AfterViewChecked {
  @Input() tagSelected$: Observable<Tag>;
  @ViewChild('addFilterRow') addFilterRow: HTMLTableRowElement;
  scrollTarget: HTMLElement;
  scrolled: boolean;
  filters: Filter[] = [];
  tags: Tag[] = [];
  selectedFilter: Filter;
  selectedFilterElement: HTMLElement;
  addingNewFilter: boolean;
  showDeleteFilterTooltip: boolean;
  expressionButtonText: string;
  editedFilter: { id: number, tags: Tag[], expression: string };
  expressionNotChecked: boolean;
  expressionOk: boolean;
  expressionWrong: boolean;

  get dataAvailable(): boolean {
    return !!this.filters && !!this.tags;
  }

  constructor(private filterService: FilterService, private tagService: TagService) {
  }
  
  ngOnInit() {
    this.filterService.filtersChanged$.subscribe(x => ChangesHandler.handle(x, this.filters, (a, b) => a.id === b.id));
    this.tagService.tags$.subscribe(x => this.tags = x);
    this.tagSelected$.subscribe(tag => {
      if (this.editedFilter && !this.editedFilter.tags.find(t => t.name === tag.name)) {
        this.editedFilter.tags.push(tag);
      }
    });
  }

  ngAfterViewChecked() {
    if (this.addFilterRow && !this.scrolled) {
      this.scrollTarget.scrollIntoView();
      this.scrolled = true;
    }
  }

  getTags(filter: Filter): Tag[] {
    return filter.tagNamesIfTrue.map(name => this.tags.find(t => t.name === name));
  }

  addingNewFilterRequested(scrollTarget: HTMLElement) {
    if (!this.editedFilter) {
      this.scrollTarget = scrollTarget;
      this.addingNewFilter = true;
      this.editedFilter = { id: null, tags: [], expression: null };
      this.expressionChanged(null);
    }
  }

  editFilterRequested() {
    if (!this.selectedFilter) {
      return;
    }

    this.editedFilter = { 
      id: this.selectedFilter.id, 
      tags: this.selectedFilter.tagNamesIfTrue.map(x => this.tags.find(t => t.name === x)),
      expression: this.selectedFilter.expression 
    };
    this.addingNewFilter = false;
    this.selectedFilterElement.scrollIntoView();
  }

  deleteFilterRequested() {
    if (this.selectedFilter) {
      this.showDeleteFilterTooltip = true;
    }
  }

  deleteSelectedFilter() {
    this.filterService.deleteFilter(this.selectedFilter).subscribe();
    this.showDeleteFilterTooltip = false;
  }

  addTagToEditedFilter(tagNameInput: HTMLInputElement) {
    const tag = this.tags.find(x => x.name === tagNameInput.value);

    if (tag) {
      this.editedFilter.tags.push(tag);
    } else {
      this.tagService.createTag(tagNameInput.value, 'gray').subscribe(newTag => {
        this.editedFilter.tags.push(newTag);
      });
    }

    tagNameInput.value = null;
  }

  filterClicked(filter: Filter, element: HTMLElement) {
    if (this.editedFilter) {
      return;
    } else if (this.selectedFilter === filter) {
      this.selectedFilter = null;
    } else {
      this.selectedFilter = filter;
      this.selectedFilterElement = element;
    }
  }

  tagRemovalRequested(tag: Tag) {
    if (this.editedFilter) {
      const index = this.editedFilter.tags.findIndex(t => t.name === tag.name);
      this.editedFilter.tags.splice(index, 1);
    }
  }

  checkEditedFilterExpression() {
    const isCorrect = this.filterService.isExpressionCorrect(this.editedFilter.expression);

    if (isCorrect) {
      this.expressionNotChecked = false;
      this.expressionOk = true;
      this.expressionWrong = false;
      this.expressionButtonText = 'Ok';
    } else {
      this.expressionNotChecked = false;
      this.expressionOk = false;
      this.expressionWrong = true;
      this.expressionButtonText = 'Błąd';
    }
  }

  expressionChanged(input: HTMLInputElement) {
    this.editedFilter.expression = input ? input.value : null;
    this.expressionNotChecked = true;
    this.expressionOk = false;
    this.expressionWrong = false;
    this.expressionButtonText = 'Sprawdź';
  }

  confirmChanges() {
    const onSucceeded = () => {
      this.addingNewFilter = false;
      this.editedFilter = null;
    }

    if (!this.expressionOk || this.editedFilter.tags.length === 0) {
      return;
    } else if (this.addingNewFilter) {
      this.filterService.createFilter(this.editedFilter.tags, this.editedFilter.expression).subscribe(_ => this.cancelEditMode());
    } else {
      this.filterService.editFilter(this.editedFilter.id, this.editedFilter.tags, this.editedFilter.expression).subscribe(() => this.cancelEditMode());
    }

    this.selectedFilter = null;
  }

  cancelEditMode() {
    this.editedFilter = null;
    this.addingNewFilter = null;
    this.selectedFilter = null;
  }
}
