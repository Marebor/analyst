using Analyst.Core.Models;
using System.Linq;

namespace Analyst.Web.Infrastructure
{
    public static class Migrator
    {
        public static void MigrateTransactionIgnore(this AnalystDbContext db)
        {
            var ignoredTransactions = db.Transactions.Where(t => t.Ignored).ToArray();
            var ignores = ignoredTransactions.Select(t => new TransactionIgnore { TransactionId = t.Id });

            db.IgnoredTransactions.AddRange(ignores);
            
            foreach (var transaction in ignoredTransactions)
            {
                transaction.Ignored = false;
            }

            db.SaveChanges();
        }

        public static void AddAccountNumberToTransactionsIfEmpty(this AnalystDbContext db, string accountNumber)
        {
            var transactionsToEdit = db.Transactions.Where(t => string.IsNullOrEmpty(t.AccountNumber)).ToArray();

            foreach (var transaction in transactionsToEdit)
            {
                transaction.AccountNumber = accountNumber;
            }

            db.SaveChanges();
        }
    }
}
