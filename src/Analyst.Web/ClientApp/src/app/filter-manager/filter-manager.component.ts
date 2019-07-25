import { TagService } from './../services/tag.service';
import { Tag } from './../models/tag.model';
import { FilterService } from './../services/filter.service';
import { Component, OnInit } from '@angular/core';
import { Filter } from '../models/filter.model';

@Component({
  selector: 'app-filter-manager',
  templateUrl: './filter-manager.component.html',
  styleUrls: ['./filter-manager.component.css']
})
export class FilterManagerComponent implements OnInit {
  filters: Filter[];
  tags: Tag[];

  get dataAvailable(): boolean {
    return !!this.filters && !!this.tags;
  }

  constructor(private filterService: FilterService, private tagService: TagService) {
  }
  
  ngOnInit() {
    this.filterService.filters$.subscribe(x => this.filters = x);
    this.tagService.tags$.subscribe(x => this.tags = x);
  }

  getTags(names: string[]): Tag[] {
    return names.map(name => this.tags.find(t => t.name === name));
  }
}
