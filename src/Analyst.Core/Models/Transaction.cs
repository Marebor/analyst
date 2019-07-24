using Analyst.Core.Models.Abstract;
using System;

namespace Analyst.Core.Models
{
    public class Transaction : IEntity
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public DateTime ExecutionDate { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public decimal Amount { get; set; }
        public decimal EndingBalance { get; set; }
        public bool Ignored { get; set; }
    }
}
