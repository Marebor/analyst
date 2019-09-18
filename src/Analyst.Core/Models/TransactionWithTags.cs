using System;
using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class TransactionWithTags
    {
        public Transaction Transaction { get; }
        public IEnumerable<string> Tags { get; }
    }
}
