export interface ITransactionChanged {
    transactionId: number,
    action: 'tagAdded' | 'tagRemoved',
    tagName: string,
}