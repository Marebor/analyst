export interface IBrowsingData {
    startDate: Date,
    EndDate: Date,
    spendingsPerTag: { [tagName: string]: number[]}[],
    transactionsPerTag: { [tagName: string]: number[]}[]
}