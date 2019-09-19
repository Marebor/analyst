using System;
using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class BrowsingData
    {
        public BrowsingData(IReadOnlyCollection<TransactionWithTags> transactions, IReadOnlyDictionary<string, decimal> spendingsPerTag, decimal otherSpendings)
        {
            Transactions = transactions;
            SpendingsPerTag = spendingsPerTag;
            OtherSpendings = otherSpendings;
        }

        public IReadOnlyCollection<TransactionWithTags> Transactions { get; }
        public IReadOnlyDictionary<string, decimal> SpendingsPerTag { get; }
        public decimal OtherSpendings { get; }
    }
}
