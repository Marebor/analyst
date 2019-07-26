import { ChangesHandler } from './../services/changes';
import { TagService } from './../services/tag.service';
import { Tag } from './../models/tag.model';
import { FilterService } from './../services/filter.service';
import { Component, OnInit, ViewChild, AfterViewChecked } from '@angular/core';
import { Filter } from '../models/filter.model';

@Component({
  selector: 'app-filter-manager',
  templateUrl: './filter-manager.component.html',
  styleUrls: ['./filter-manager.component.css']
})
export class FilterManagerComponent implements OnInit, AfterViewChecked {
  @ViewChild('addFilterRow') addFilterRow: HTMLTableRowElement;
  scrollTarget: HTMLElement;
  scrolled: boolean;
  filters: Filter[] = [];
  tags: Tag[] = [];
  addingNewFilter: boolean;
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
  }

  cancelEditMode() {
    this.editedFilter = null;
    this.addingNewFilter = null;
  }
}
