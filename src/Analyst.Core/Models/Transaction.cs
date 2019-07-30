using System;

namespace Analyst.Core.Models
{
    public class Transaction
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExecutionDate { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public decimal Amount { get; set; }
        public decimal EndingBalance { get; set; }
        public bool Ignored { get; set; }

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
