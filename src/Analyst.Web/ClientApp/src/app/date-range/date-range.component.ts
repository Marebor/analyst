import { Component, Output, EventEmitter, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { NgbDate } from '@ng-bootstrap/ng-bootstrap/datepicker/ngb-date';
import * as moment from "moment";
import { NgbDatepicker, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-date-range',
  templateUrl: './date-range.component.html',
  styleUrls: ['./date-range.component.css']
})
export class DateRangeComponent implements OnInit {
  @ViewChild('dp') datepicker: NgbDatepicker;
  @Output() dateRangeChange: EventEmitter<{from: Date, to: Date }> = new EventEmitter<{from: Date, to: Date }>();
  hoveredDate: NgbDate;
  fromDate: Date;
  toDate: Date;
  maxDate: NgbDateStruct;

  ngOnInit() {
    const now = new Date();
    this.maxDate = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };
    this.datepicker.navigateTo({ year: this.maxDate.year, month: this.maxDate.month - 1 });
  }

  onDateSelection(ngbDate: NgbDate) {
    const date = this.transformDate(ngbDate);

    if (!this.fromDate && !this.toDate) {
      this.fromDate = date;
    } else if (this.fromDate && !this.toDate && moment(date).isAfter(this.fromDate)) {
      this.toDate = date;
      this.dateRangeChange.emit({ from: this.fromDate, to: this.toDate });
    } else {
      this.toDate = null;
      this.fromDate = date;
    }
  }

  isHovered(ngbDate: NgbDate) {
    const date = this.transformDate(ngbDate);
    return this.fromDate && !this.toDate && this.hoveredDate && moment(date).isAfter(this.fromDate) && moment(date).isBefore(this.transformDate(this.hoveredDate));
  }

  isInside(ngbDate: NgbDate) {
    const date = this.transformDate(ngbDate);
    return this.fromDate && this.toDate && moment(date).isAfter(this.fromDate) && moment(date).isBefore(this.toDate);
  }

  isRange(ngbDate: NgbDate) {
    const date = this.transformDate(ngbDate);
    return moment(date).isSame(this.fromDate) || moment(date).isSame(this.toDate) || this.isInside(ngbDate) || this.isHovered(ngbDate);
  }

  isInFuture(ngbDate: NgbDate) {
    const now = new Date();
    const date = this.transformDate(ngbDate);
    return moment(date).isAfter(now);
  }

  private transformDate(date: NgbDate): Date {
    return new Date(date.year, date.month - 1, date.day);
  }
}
