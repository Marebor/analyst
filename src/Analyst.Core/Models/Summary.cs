namespace Analyst.Core.Models
{
    public class Summary
    {
        public Summary(decimal totalIncome, decimal totalExpenses)
        {
            TotalIncome = totalIncome;
            TotalExpenses = totalExpenses;

            Profit = TotalIncome - TotalExpenses;
        }

        public decimal TotalIncome { get; }
        public decimal TotalExpenses { get; }
        public decimal Profit { get; }
    }
}
