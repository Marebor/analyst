import { IBrowsingData } from './../models/browsing-data';
import { TagService } from './../services/tag.service';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Tag } from '../models/tag.model';
import { Subscription } from 'rxjs/Subscription';
import { ChartDataItem } from './chart-data-item.model';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent {
  @Input() data: ChartDataItem[];
  @Output() tagClicked: EventEmitter<Tag> = new EventEmitter<Tag>();

  get sortedData(): ChartDataItem[] {
    return this.data
      .filter(x => x.spendings > 0)
      .sort((a, b) => a.tag.name === 'Inne' ? 1 : b.spendings - a.spendings);
  }
  get pieChartLabels(): string[] {
    return this.sortedData ? this.sortedData.map(x => x.tag.name) : [];
  }
  get pieChartData(): number[] {
    return this.sortedData ? this.sortedData.map(x => x.spendings) : [];
  }
  get pieChartColors(): any {
    return this.sortedData ? [{ backgroundColor: this.sortedData.map(x => x.tag.color) }] : [{ backgroundColor: [] }];
  }
  pieChartType: string = 'pie';
  pieChartOptions = {
    responsive: true
  };

  get dataAvailable(): boolean {
    return this.sortedData && this.sortedData.length > 0;
  }

  get total(): number {
    return this.sortedData.reduce((a, b) => a + b.spendings, 0);
  }

  chartHovered($event: any) {
    
  }

  chartClicked($event: any) {
    const tag = this.sortedData[$event.active[0]._index].tag;
    this.onTagClicked(tag);
  }

  onTagClicked(tag: Tag) {
    this.tagClicked.emit(tag);
  }
}
