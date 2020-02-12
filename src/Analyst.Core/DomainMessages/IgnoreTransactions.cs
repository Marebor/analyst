using System.Collections.Generic;

namespace Analyst.Core.DomainMessages
{
    internal class IgnoreTransactions
    {
        public IgnoreTransactions(IEnumerable<int> transactionsIds)
        {
            TransactionsIds = transactionsIds;
        }

        public IEnumerable<int> TransactionsIds { get; }
    }
}
