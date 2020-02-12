using System.Collections.Generic;
using System.Linq;

namespace Analyst.Core.Models
{
    public class Filter
    {
        public int Id { get; set; }
        public IEnumerable<string> TagNamesIfTrue { get; set; }
        public IEnumerable<string> Keywords { get; set; }

        public IEnumerable<Transaction> Apply(IEnumerable<Transaction> transactions)
            => transactions.Where(t => Keywords.Any(kw => t.Description.ToLowerInvariant().Contains(kw.ToLowerInvariant())));
    }
}
