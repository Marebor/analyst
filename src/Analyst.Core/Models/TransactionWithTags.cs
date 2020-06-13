using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class TransactionWithTags
    {
        public TransactionWithTags(Transaction transaction, IEnumerable<string> tags)
        {
            Transaction = transaction;
            Tags = tags;
        }

        public Transaction Transaction { get; }
        public IEnumerable<string> Tags { get; }
    }
}
