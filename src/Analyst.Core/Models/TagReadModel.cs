namespace Analyst.Core.Models
{
    public sealed class TagReadModel
    {
        public TagReadModel(string name, decimal amount)
        {
            Name = name;
            Amount = amount;
        }

        public string Name { get; }
        public decimal Amount { get; }
    }
}
