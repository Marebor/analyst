using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class TransactionReadModel
    {
        public TransactionReadModel(Transaction transaction, IEnumerable<string> tags, string comment, bool ignored)
        {
            Transaction = transaction;
            Tags = tags;
            Comment = comment;
            Ignored = ignored;
        }

        public Transaction Transaction { get; }
        public IEnumerable<string> Tags { get; }
        public string Comment { get; }
        public bool Ignored { get; }
    }
}
