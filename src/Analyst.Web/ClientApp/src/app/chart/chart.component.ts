import { Component, Input, OnInit, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Transaction } from '../models/transaction.model';
import { Observable } from 'rxjs/Observable';
import { Tag } from '../models/tag.model';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css']
})
export class ChartComponent implements OnInit, OnDestroy {
  @Input() transactions$: Observable<Transaction[]>;
  @Input() tags$: Observable<Tag[]>;
  @Output() tagSelected: EventEmitter<Tag> = new EventEmitter<Tag>();
  transactions: Transaction[];
  tags: Tag[];
  total: number;
  private transactionsSubscription: Subscription;
  private tagsSubscription: Subscription;

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
    return !!this.pieChartLabels && !!this.pieChartData;
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
  }

  ngOnDestroy() {
    this.transactionsSubscription.unsubscribe();
    this.tagsSubscription.unsubscribe();
  }

  private refresh() {
    if (!this.dataAvailable) {
      return;
    }

    this.pieChartLabels = null;
    this.pieChartData = null;
    
    let pieChartLabels = this.tags.map(tag => tag.name);
    let pieChartColors = [{ backgroundColor: this.tags.map(tag => tag.color) }];
    let pieChartData = this.tags.map(tag => tag.transactionsIds.reduce((prev, id) => {
      const transaction = this.transactions.find(trans => trans.id == id);
      if (transaction) {
        return prev - transaction.amount;
      } else {
        return prev;
      };
    }, 0));

    let data: { tagName: string, tagColor: string, amount: number }[] = [];
    pieChartLabels.forEach((label, index) => {
      data.push({ tagName: label, tagColor: pieChartColors[0].backgroundColor[index], amount: pieChartData[index]});
    });

    data.sort((a, b) => a.amount > b.amount ? -1 : 1);
    this.tags = data.map(x => this.tags.find(t => t.name === x.tagName));
    
    const otherTransactions = this.transactions.filter(
      trans => this.tags.map(tag => tag.transactionsIds).reduce((prev, current) => {
        return prev.concat(current);
      }, [])
      .findIndex(id => trans.id === id) === -1);
    const othersAmount = otherTransactions.reduce((prev, curr) => prev - curr.amount, 0);

    data.push({ tagName: 'Inne', tagColor: 'lightgray', amount: othersAmount });
    data = data.map(x => { return { ...x, amount: Math.round(x.amount * 100) / 100 } });
    this.total = data.reduce((a, b) => a + b.amount, 0);

    setTimeout(() => {
      this.pieChartLabels = data.map(x => x.tagName);
      this.pieChartData = data.map(x => x.amount);
      this.pieChartColors = [{ backgroundColor: data.map(x => x.tagColor) }];
    });
  }
}
