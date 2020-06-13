import { Filter } from '../models/filter.model';
import { BrowsingService } from '../services/browsing.service';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { TagService } from '../services/tag.service';
import { Tag } from '../models/tag.model';
import { FilterService } from '../services/filter.service';
import { Component, OnInit, ViewChild, AfterViewChecked, Output, EventEmitter, Input, HostListener } from '@angular/core';
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
  showDeleteFilterTooltip: boolean;
  newFilter: Filter;

  get dataAvailable(): boolean {
    return !!this.filters && !!this.tags;
  }

  constructor(
    private filterService: FilterService, 
    private tagService: TagService,
    private browsingService: BrowsingService) {
  }
  
  ngOnInit() {
    this.tagSelected$.subscribe(tag => {
      if (this.newFilter && !this.newFilter.tags.find(t => t.name === tag.name)) {
        this.newFilter.tags.push(tag);
      } else if (this.selectedFilter && !this.selectedFilter.tags.find(t => t.name === tag.name)) {
        this.selectedFilter.tags.push(tag);

        this.filterService.editFilter(this.selectedFilter.id, this.selectedFilter.tags, this.selectedFilter.keywords).subscribe();
      }      
    });

    this.refresh();
    this.browsingService.stateChange.subscribe(() => this.refresh());
  }

  ngAfterViewChecked() {
    if (this.addFilterRow && !this.scrolled) {
      this.scrollTarget.scrollIntoView();
      this.scrolled = true;
    }
  }

  mapTags(): void {
    this.filters.forEach(filter => {
      filter.tags = filter.tagNamesIfTrue.map(name => this.tags.find(t => t.name === name));
    })
  }

  addingNewFilterRequested(scrollTarget: HTMLElement) {
    if (!this.newFilter) {
      this.scrollTarget = scrollTarget;
      this.newFilter = { id: null, tagNamesIfTrue: [], tags: [], keywords: [] };
    }
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

  filterClicked(filter: Filter, element: HTMLElement) {
    if (this.newFilter) {
      return;
    } else if (this.selectedFilter === filter) {
      this.selectedFilter = null;
    } else {
      this.selectedFilter = filter;
      this.selectedFilterElement = element;
    }
  }

  tagRemovalRequested(filter: Filter, tag: Tag) {
    const index = filter.tags.findIndex(t => t.name === tag.name);

    if (index >= 0) {
      filter.tags.splice(index, 1);

      if (filter !== this.newFilter) {
        this.filterService.editFilter(filter.id, filter.tags, filter.keywords).subscribe();
      }
    }
  }

  addTagToEditedFilter(tagNameInput: HTMLInputElement) {
    const tag = this.tags.find(x => x.name === tagNameInput.value);

    if (tag) {
      this.newFilter.tags.push(tag);
    } else {
      this.tagService.createTag(tagNameInput.value, 'gray').subscribe(newTag => {
        this.newFilter.tags.push(newTag);
      });
    }

    tagNameInput.value = null;
  }

  keywordRemovalRequested(filter: Filter, keyword: string) {
    const index = filter.keywords.findIndex(k => k === keyword);

    if (index >= 0) {
      filter.keywords.splice(index, 1);

      if (filter !== this.newFilter) {
        this.filterService.editFilter(filter.id, filter.tags, filter.keywords).subscribe();
      }
    }
  }

  addKeyword(filter: Filter, expressionInput: HTMLInputElement): void {
    const index = filter.keywords.findIndex(k => k === expressionInput.value);

    if (index === -1) {
      filter.keywords.push(expressionInput.value);

      if (filter !== this.newFilter) {
        this.filterService.editFilter(filter.id, filter.tags, filter.keywords).subscribe();
      }

      expressionInput.value = null;
    }
  }

  confirmChanges() {
    if (this.newFilter.tags.length === 0 || this.newFilter.keywords.length === 0) {
      return;
    } else {
      this.filterService.createFilter(this.newFilter.tags, this.newFilter.keywords).subscribe(_ => this.cancelEditMode());
    }

    this.selectedFilter = null;
  }

  cancelEditMode() {
    this.newFilter = null;
  }

  private refresh(): void {
    forkJoin(
      this.filterService.getFilters(),
      this.tagService.getTags())
    .subscribe(([filters, tags]) => {
      this.filters = filters;
      this.tags = tags;
      this.mapTags();
    });
  }
}
