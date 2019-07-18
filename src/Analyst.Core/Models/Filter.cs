using Analyst.Core.Models.Abstract;
using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class Filter : IEntity
    {
        public int Id { get; set; }
        public string TagName { get; set; }
        public IEnumerable<string> Keywords { get; set; }
    }
}
