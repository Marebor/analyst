using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class Filter
    {
        public int Id { get; set; }
        public IEnumerable<string> TagNamesIfTrue { get; set; }
        public IEnumerable<string> Keywords { get; set; }
    }
}
