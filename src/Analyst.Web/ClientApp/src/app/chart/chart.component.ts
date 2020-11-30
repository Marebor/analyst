import { IBrowsingData } from '../models/browsing-data';
import { TagService } from '../services/tag.service';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Tag } from '../models/tag.model';
import { Subscription } from 'rxjs/Subscription';
import { ChartDataItem } from './chart-data-item.model';
import { Observable } from '../../../node_modules/rxjs/Observable';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() data$: Observable<ChartDataItem[]>;
  @Output() tagClicked: EventEmitter<Tag> = new EventEmitter<Tag>();
  data: ChartDataItem[];
  dataSubscription: Subscription;
  hiddenTags: string[] = [];

  get othersDataItem(): ChartDataItem {
    return this.data.find(x => x.tag.name === 'Inne');
  }
  get pieChartLabels(): string[] {
    return this.data ? this.dataToDisplay.map(x => x.tag.name) : [];
  }
  get pieChartData(): number[] {
    return this.data ? this.dataToDisplay.map(x => x.spendings) : [];
  }
  get pieChartColors(): any {
    return this.data ? [{ backgroundColor: this.dataToDisplay.map(x => x.tag.color) }] : [{ backgroundColor: [] }];
  }
  pieChartType: string = 'pie';
  pieChartOptions = {
    responsive: true
  };

  get dataAvailable(): boolean {
    return this.data && this.data.length > 0;
  }

  get total(): number {
    return this.dataToDisplay.reduce((a, b) => a + b.spendings, 0);
  }

  ngOnInit() {
    this.dataSubscription = this.data$.subscribe(data => {
      this.data = null;
      setTimeout(() => this.data = data);
    });
  }

  ngOnDestroy() {
    this.dataSubscription.unsubscribe();
  }

  chartHovered($event: any) {
    
  }

  chartClicked($event: any) {
    const tag = this.dataToDisplay[$event.active[0]._index].tag;
    this.onTagClicked(tag);
  }

  onTagClicked(tag: Tag) {
    this.tagClicked.emit(tag);
  }

  isItemVisible(item: ChartDataItem) {
    return this.hiddenTags.findIndex(t => t === item.tag.name) === -1;
  }

  changeItemVisibility(item: ChartDataItem) {
    if (this.isItemVisible(item)) {
      this.hiddenTags.push(item.tag.name);
    } else {
      this.hiddenTags = this.hiddenTags.filter(t => t !== item.tag.name);
    }

    let data = this.data;
    
    this.data = null;
    setTimeout(() => this.data = data);
  }

  private get dataToDisplay(): ChartDataItem[] {
    return this.data.filter(i => this.hiddenTags.findIndex(t => t === i.tag.name) === -1);
  }
}
