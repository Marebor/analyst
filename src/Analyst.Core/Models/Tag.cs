using Analyst.Core.Models.Abstract;
using System;
using System.Collections.Generic;
using System.Text;

namespace Analyst.Core.Models
{
    public class Tag : IEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
        public ICollection<int> TransactionsIds;

        public Tag()
        {
            TransactionsIds = new List<int>();
        }
    }
}
