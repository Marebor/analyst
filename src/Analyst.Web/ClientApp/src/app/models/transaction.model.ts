export interface Transaction {
  id: number,
  orderDate: Date,
  executionDate: Date,
  type: string,
  description: string,
  amount: number,
  endingBalance: number,
  ignored: boolean,
  assignedTagNames: string[],
  forbiddenTagNames: string[],
}