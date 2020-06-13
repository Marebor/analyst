using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class BrowsingData
    {
        public BrowsingData(
            IReadOnlyCollection<TransactionReadModel> transactions, 
            IReadOnlyDictionary<string, decimal> spendingsPerTag, 
            decimal otherSpendings,
            Summary summary)
        {
            Transactions = transactions;
            SpendingsPerTag = spendingsPerTag;
            OtherSpendings = otherSpendings;
            Summary = summary;
        }

        public IReadOnlyCollection<TransactionReadModel> Transactions { get; }
        public IReadOnlyDictionary<string, decimal> SpendingsPerTag { get; }
        public decimal OtherSpendings { get; }
        public Summary Summary { get; }
    }
}
