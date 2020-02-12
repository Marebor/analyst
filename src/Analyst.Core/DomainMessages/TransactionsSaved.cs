using Analyst.Core.Models;
using System.Collections.Generic;

namespace Analyst.Core.DomainMessages
{
    internal class TransactionsSaved
    {
        public TransactionsSaved(IEnumerable<Transaction> transactions)
        {
            Transactions = transactions;
        }

        public IEnumerable<Transaction> Transactions { get; }
    }
}
