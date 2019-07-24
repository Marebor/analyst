using Analyst.Core.Models.Abstract;

namespace Analyst.Core.Models
{
    public class TagSuppression : IEntity
    {
        public int Id { get; set; }
        public int TransactionId { get; set; }
        public string TagName { get; set; }
    }
}
