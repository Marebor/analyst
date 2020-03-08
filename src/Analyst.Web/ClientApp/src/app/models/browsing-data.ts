import { Transaction } from "./transaction.model";

export interface IBrowsingData {
    spendingsPerTag: { [tagName: string]: number },
    otherSpendings: number;
    transactions: { 
        transaction: Transaction, 
        tags: string[],
        comment: string,
        ignored: boolean,
    }[],
    summary: ISummary,
}

export interface ISummary {
    totalIncome: number,
    totalSpendings: number,
    profit: number,
}

export interface IUploadResult {
    uploadId: string,
    data: IBrowsingData,
}