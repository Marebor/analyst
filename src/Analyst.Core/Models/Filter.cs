using System.Collections.Generic;

namespace Analyst.Core.Models
{
    public class Filter
    {
        public int Id { get; set; }
        public IEnumerable<string> TagNamesIfTrue { get; set; }
        public string Expression { get; set; }

        public override bool Equals(object obj)
        {
            var other = obj as Filter;

            return other != null ? other.Id == Id : false;
        }

        public override int GetHashCode()
        {
            var hashCode = -805798031;
            hashCode = hashCode * -1521134295 + Id.GetHashCode();
            return hashCode;
        }
    }
}
