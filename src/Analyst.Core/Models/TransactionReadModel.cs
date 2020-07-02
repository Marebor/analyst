using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class TransactionReadModel
    {
        public TransactionReadModel(Transaction transaction, IEnumerable<TagReadModel> tags, string comment)
        {
            Transaction = transaction;
            Tags = tags;
            Comment = comment;
        }

        public Transaction Transaction { get; }
        public IEnumerable<TagReadModel> Tags { get; }
        public string Comment { get; }
    }
}
