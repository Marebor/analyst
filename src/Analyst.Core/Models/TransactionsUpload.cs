using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class TransactionsUpload
    {
        public TransactionsUpload(string id, IEnumerable<int> transactionsIds)
        {
            Id = id;
            TransactionsIds = transactionsIds;
        }

        public string Id { get; }
        public IEnumerable<int> TransactionsIds { get; }
    }
}
