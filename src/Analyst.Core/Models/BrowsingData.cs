using System;
using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class BrowsingData
    {
        public BrowsingData(DateTime startDate, DateTime endDate, IReadOnlyDictionary<string, decimal> spendingsPerTag, IReadOnlyDictionary<string, IEnumerable<int>> transactionsPerTag)
        {
            StartDate = startDate;
            EndDate = endDate;
            SpendingsPerTag = spendingsPerTag;
            TransactionsPerTag = transactionsPerTag;
        }

        public DateTime StartDate { get; }
        public DateTime EndDate { get; }
        public IReadOnlyDictionary<string, decimal> SpendingsPerTag { get; }
        public IReadOnlyDictionary<string, IEnumerable<int>> TransactionsPerTag { get; }
    }
}
