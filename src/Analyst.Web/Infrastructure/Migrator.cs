using Analyst.Core.Models;
using System.Linq;

namespace Analyst.Web.Infrastructure
{
    public static class Migrator
    {
        public static void MigrateTransactionIgnore(AnalystDbContext db)
        {
            var ignoredTransactions = db.Transactions.Where(t => t.Ignored);
            var ignores = ignoredTransactions.Select(t => new TransactionIgnore { TransactionId = t.Id });

            db.IgnoredTransactions.AddRange(ignores);
            
            foreach (var transaction in ignoredTransactions)
            {
                transaction.Ignored = false;
            }

            db.SaveChanges();
        }
    }
}
