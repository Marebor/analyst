import { TagService } from './../services/tag.service';
import { FilterService } from './../services/filter.service';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { Subscription } from 'rxjs/Subscription';
import { ChartDataItem } from './chart-data-item.model';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() transactions$: Observable<Transaction[]>;
  @Output() tagClicked: EventEmitter<Tag> = new EventEmitter<Tag>();
  transactions: Transaction[];
  data: ChartDataItem[] = [];
  private transactionsSubscription: Subscription;

  pieChartLabels: string[];
  pieChartData: number[];
  pieChartColors: any;
  pieChartType: string = 'pie';
  pieChartOptions = {
    responsive: true
  };

  get dataAvailable(): boolean {
    return this.transactions && this.transactions.length > 0;
  }

  get displayChart(): boolean {
    return !!this.pieChartLabels && !!this.pieChartData && this.dataAvailable;
  }

  get total(): number {
    return this.transactions.reduce((a, b) => a - b.amount, 0);
  }

  constructor(private tagService: TagService) {
  }

  ngOnInit() {
    this.transactionsSubscription = this.transactions$.subscribe(transactions => {
      this.transactions = transactions.filter(trans => trans.amount < 0 && !trans.ignored);
      this.refresh();
    });

    this.tagService.tagColorChanged$.subscribe(_ => {
      this.pieChartColors = [{ backgroundColor: this.data.map(x => x.tag.color) }];
    });
  }

  ngOnDestroy() {
    this.transactionsSubscription.unsubscribe();
  }

  chartHovered($event: any) {
    
  }

  chartClicked($event: any) {
    const tag = <Tag>this.data[$event.active[0]._index].tag;
    this.onTagClicked(tag);
  }

  onTagClicked(tag: Tag) {
    this.tagClicked.emit(tag);
  }

  private refresh() {
    if (!this.dataAvailable) {
      return;
    }

    this.pieChartLabels = null;

    const chartDataItems: ChartDataItem[] = [];
    this.transactions.forEach(transaction => {
      if (transaction.tags) {
        transaction.tags.forEach(tag => {
          const item = chartDataItems.find(item => item.tag.name === tag.name);
  
          if (item) {
            item.transactions.push(transaction);
          } else {
            chartDataItems.push({ tag, transactions: [transaction], amount: null})
          }
        });
      }
    });

    chartDataItems.forEach(item => item.amount = this.getTotalAmount(item.transactions));
    chartDataItems.sort((a, b) => a.amount > b.amount ? -1 : 1);
    this.data = chartDataItems;

    const otherTransactions = this.transactions.filter(transaction => 
      !this.data.find(item => !!item.transactions.find(t => t.id === transaction.id)));

    if (otherTransactions.length > 0) {
      this.data.push({ 
        tag: { name: 'Inne', color: 'lightgray' }, 
        transactions: otherTransactions,
        amount: this.getTotalAmount(otherTransactions),
      });
    }

    setTimeout(() => {
      this.pieChartLabels = this.data.map(x => x.tag.name);
      this.pieChartColors = [{ backgroundColor: this.data.map(x => x.tag.color) }];
      this.pieChartData = this.data.map(x => this.getTotalAmount(x.transactions));
    });
  }

  private getTotalAmount(transactions: Transaction[]): number {
    return Math.round(transactions.reduce((sum, trans) => sum - trans.amount, 0) * 100) / 100;
  }
}
