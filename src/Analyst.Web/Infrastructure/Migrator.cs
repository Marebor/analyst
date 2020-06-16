using Analyst.Core.Models;
using System;
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

        public static void ApplyAutomaticIgnoreForHistoricalTransactions(this AnalystDbContext db)
        {
            var ignoredTransactionsIds = db.IgnoredTransactions.Select(x => x.TransactionId).ToArray();
            var notIgnoredTransactions = db.Transactions.Where(t => !ignoredTransactionsIds.Contains(t.Id)).ToArray();
            var filtersWithIgnoreTag = db.Filters.Where(f => f.TagNamesIfTrue.Contains("IGNORE"));

            var transactionsToIgnore = filtersWithIgnoreTag
                .SelectMany(f => f.Apply(notIgnoredTransactions))
                .Select(t => t.Id)
                .Distinct();

            var ignores = transactionsToIgnore
                .Select(x => new TransactionIgnore { TransactionId = x });

            db.IgnoredTransactions.AddRange(ignores);

            db.SaveChanges();
        }

        public static void AddDefaultValuesToZeroAmountTagAssignments(this AnalystDbContext db)
        {
            var zeroAmountAssignments = db.TagAssignments
                .Where(x => x.Amount == 0)
                .ToArray();
            var zeroAmountAssignmentsGroupedByTransaction = zeroAmountAssignments
                .GroupBy(x => x.TransactionId);
            var transactionsWithZeroTagAssignments = db.Transactions
                .Where(x => zeroAmountAssignments
                    .Select(y => y.TransactionId)
                    .Distinct()
                    .Contains(x.Id))
                .ToArray();
            var anotherAssignmentsOfFoundTransactions = db.TagAssignments
                .Where(x => transactionsWithZeroTagAssignments
                    .Select(y => y.Id)
                    .Contains(x.TransactionId))
                .Where(x => x.Amount != 0)
                .ToArray();
            var transactionsWithOnlyZeroAmountTag = transactionsWithZeroTagAssignments
                .Where(x => !anotherAssignmentsOfFoundTransactions
                    .Select(y => y.TransactionId)
                    .Distinct()
                    .Contains(x.Id))
                .ToArray();
            var assignmentsToUpdate = zeroAmountAssignments
                .Where(x => transactionsWithOnlyZeroAmountTag
                    .Select(y => y.Id)
                    .Distinct()
                    .Contains(x.TransactionId))
                .Where(x => zeroAmountAssignmentsGroupedByTransaction.First(y => y.Key == x.TransactionId).Count() == 1)
                .ToArray();

            if (assignmentsToUpdate.Length < zeroAmountAssignments.Length)
            {
                Console.WriteLine($"COULD NOT UPDATE {zeroAmountAssignments.Length - assignmentsToUpdate.Length} TAG ASSIGNMENTS AMOUNT :((");
            }

            foreach (var assignment in assignmentsToUpdate)
            {
                assignment.Amount = Math.Abs(transactionsWithOnlyZeroAmountTag.First(x => x.Id == assignment.TransactionId).Amount);
            }

            db.TagAssignments.UpdateRange(assignmentsToUpdate);

            db.SaveChanges();
        }
    }
}
