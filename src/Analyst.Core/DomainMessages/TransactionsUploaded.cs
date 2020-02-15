using Analyst.Core.Models;
using System.Collections.Generic;

namespace Analyst.Core.DomainMessages
{
    internal class TransactionsUploaded
    {
        public TransactionsUploaded(IEnumerable<Transaction> transactions)
        {
            Transactions = transactions;
        }

        public IEnumerable<Transaction> Transactions { get; }
    }
}
