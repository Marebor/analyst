namespace Analyst.Core.Models
{
    public class TagAssignment
    {
        public int TransactionId { get; set; }
        public string TagName { get; set; }
        public decimal Amount { get; set; }
    }
}
