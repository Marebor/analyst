import { Transaction } from "./transaction.model";

export interface IBrowsingData {
    startDate: Date,
    EndDate: Date,
    spendingsPerTag: { [tagName: string]: number[]}[],
    transactions: { transaction: Transaction, tags: string[] }[]
}