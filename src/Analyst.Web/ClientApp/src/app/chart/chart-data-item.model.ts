import { Transaction } from '../models/transaction.model';
import { Tag } from "../models/tag.model";

export interface ChartDataItem {
  tag: Tag,
  spendings: number,
}