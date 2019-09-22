import { Tag } from "./tag.model";

export interface Transaction {
  id: number,
  orderDate: Date,
  executionDate: Date,
  type: string,
  description: string,
  amount: number,
  endingBalance: number,
  tags: Tag[],
  ignored: boolean,
}