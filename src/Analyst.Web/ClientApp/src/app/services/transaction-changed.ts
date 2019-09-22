export interface ITransactionChanged {
    transactionId: number,
    action: 'tagAdded' | 'tagRemoved' | 'ignoredValueChanged',
    tagName: string,
    ignored: boolean,
}