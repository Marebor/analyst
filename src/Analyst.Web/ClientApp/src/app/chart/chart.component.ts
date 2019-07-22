import { FilterService } from './../services/filter.service';
import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { Subscription } from 'rxjs/Subscription';
import { Filter } from '../models/filter.model';
import { ChartDataItem } from './chart-data-item.model';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() transactions$: Observable<Transaction[]>;
  @Input() tags$: Observable<Tag[]>;
  @Input() filters$: Observable<Filter[]>;
  @Output() tagSelected: EventEmitter<Tag> = new EventEmitter<Tag>();
  transactions: Transaction[];
  tags: Tag[];
  filters: Filter[];
  data: ChartDataItem[] = [];
  private transactionsSubscription: Subscription;
  private tagsSubscription: Subscription;
  private filtersSubscription: Subscription;

  pieChartLabels: string[];
  pieChartData: number[];
  pieChartColors: any;
  pieChartType: string = 'pie';
  pieChartOptions = {
    responsive: true
  };

  get dataAvailable(): boolean {
    return this.tags && this.tags.length > 0 && this.transactions && this.transactions.length > 0;
  }

  get displayChart(): boolean {
    return !!this.pieChartLabels && !!this.pieChartData && this.dataAvailable;
  }

  get total(): number {
    return this.transactions.reduce((a, b) => a - b.amount, 0);
  }

  constructor(private filterService: FilterService) {
  }

  ngOnInit() {
    this.transactionsSubscription = this.transactions$.subscribe(transactions => {
      this.transactions = transactions.filter(trans => trans.amount < 0);
      this.refresh();
    });
    
    this.tagsSubscription = this.tags$.subscribe(tags => {
      this.tags = tags;
      this.refresh();
    });
    
    this.filtersSubscription = this.filters$.subscribe(filters => {
      this.filters = filters;
      this.refresh();
    });
  }

  ngOnDestroy() {
    this.transactionsSubscription.unsubscribe();
    this.tagsSubscription.unsubscribe();
    this.filtersSubscription.unsubscribe();
  }

  chartHovered($event: any) {
    
  }

  chartClicked($event: any) {

  }

  private refresh() {
    if (!this.dataAvailable) {
      return;
    }

    this.pieChartLabels = null;

    this.data = this.tags.map(tag => <ChartDataItem>{
      tag,
      transactions: this.filterService.filterTransactions(tag.name, this.transactions, this.filters),
    })
    .sort((a, b) => this.getTotalAmount(a.transactions) > this.getTotalAmount(b.transactions) ? -1 : 1);

    const otherTransactions = this.transactions.filter(transaction => !this.data.find(item => item.transactions.find(t => t.id === transaction.id)));

    this.data.push({ tag: { name: 'Inne', color: 'lightgray' }, transactions: otherTransactions });

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
