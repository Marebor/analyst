import { TagService } from './../services/tag.service';
import { MappingService } from '../services/mapping.service';
import { Transaction } from '../models/transaction.model';
import { FilterService } from '../services/filter.service';
import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';

@Component({
  selector: 'app-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.css']
})
export class TagComponent {
  @Input() tag: Tag
  @Input() forbidden: boolean;
  @Input() tooltipDebounceTime: number = 0;
  @Input() tooltipSide: string = 'left';
  @Input() allowDelete: boolean;
  @Input() allowChangeColor: boolean;
  @Output() removalRequested: EventEmitter<void> = new EventEmitter<void>();
  @ViewChild('tagColorInput') tagColorInput: HTMLInputElement;
  showTooltip: boolean;
  changingTagColor: boolean;

  private tooltipRequested: boolean;

  constructor(private tagService: TagService) {}

  mouseEntered() {
    if (this.allowChangeColor || this.allowDelete) {
      this.tooltipRequested = true;
      
      setTimeout(() => {
        if (this.tooltipRequested) {
          this.showTooltip = true;
        }
      }, this.tooltipDebounceTime);
    }
  }

  mouseLeft() {
    this.tooltipRequested = false;
    this.showTooltip = false;
    this.changingTagColor = false;
  }

  restoreRequested() {
  }

  changeColorClicked() {
    this.changingTagColor = true;
  }

  colorInputLoaded() {

  }
  
  onColorChangeRequested(tagColorInput: any) {
    this.tagService.changeTagColor(this.tag.name, tagColorInput.value).subscribe();
    tagColorInput.value = null;
    this.changingTagColor = false;
    this.showTooltip = false;
  }

  onRemovalRequested() {
    this.removalRequested.emit();
  }
}
