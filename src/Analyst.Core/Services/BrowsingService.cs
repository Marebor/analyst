using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class BrowsingService
    {
        IStore<Filter> filterStore;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;
        IStore<Comment> commentStore;
        IStore<TransactionIgnore> ignoredTransactionsStore;

        public BrowsingService(
            IStore<Filter> filterStore, 
            IStore<TagAssignment> tagAssignmentStore, 
            IStore<TagSuppression> tagSuppressionStore, 
            IStore<Comment> commentStore,
            IStore<TransactionIgnore> ignoredTransactionsStore)
        {
            this.filterStore = filterStore;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
            this.commentStore = commentStore;
            this.ignoredTransactionsStore = ignoredTransactionsStore;
        }

        public async Task<BrowsingData> Browse(IEnumerable<Transaction> transactions)
        {
            var filters = await filterStore.Query(q => q);
            var assignments = await tagAssignmentStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));
            var suppressions = await tagSuppressionStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));
            var comments = await commentStore.Query(q => q.Where(c => transactions.Any(t => c.TransactionId == t.Id)));
            var ignoredTransactions = await ignoredTransactionsStore.Query(q => q.Where(c => transactions.Any(t => c.TransactionId == t.Id)));

            var tagsPerTransaction = transactions.ToDictionary(x => x, _ => new HashSet<TagReadModel>());

            AddTagsFromAssignments(tagsPerTransaction, assignments);
            AddTagsFromFilters(tagsPerTransaction, filters, suppressions);

            return new BrowsingData(
                transactions: transactions
                    .OrderByDescending(t => t.OrderDate)
                    .Select(transaction => new TransactionReadModel(
                        transaction, 
                        tagsPerTransaction[transaction].ToArray(),
                        comments.SingleOrDefault(c => c.TransactionId == transaction.Id)?.Text,
                        ignoredTransactions.Any(it => it.TransactionId == transaction.Id)))
                    .ToArray(),
                spendingsPerTag: tagsPerTransaction
                    .Where(x => x.Key.Amount < 0)
                    .Where(x => !ignoredTransactions
                        .Any(y => y.TransactionId == x.Key.Id))
                    .SelectMany(x => x.Value)
                    .GroupBy(x => x.Name)
                    .ToDictionary(
                        x => x.Key,
                        x => x.Sum(y => y.Amount)),
                otherSpendings: tagsPerTransaction
                    .Where(x => x.Key.Amount < 0)
                    .Where(x => !ignoredTransactions
                        .Any(y => y.TransactionId == x.Key.Id))
                    .Sum(x => Math.Abs(x.Key.Amount) - x.Value.Sum(y => y.Amount)),
                summary: new Summary(
                    totalIncome: transactions
                        .Where(t => t.Amount > 0)
                        .Where(t => !ignoredTransactions.Any(it => it.TransactionId == t.Id))
                        .Sum(t => t.Amount),
                    totalExpenses: transactions
                        .Where(t => t.Amount < 0)
                        .Where(t => !ignoredTransactions.Any(it => it.TransactionId == t.Id))
                        .Sum(t => -t.Amount)));
        }

        private void AddTagsFromFilters(
            Dictionary<Transaction, HashSet<TagReadModel>> tagsPerTransaction,
            IEnumerable<Filter> filters, 
            IEnumerable<TagSuppression> suppressions)
        {
            foreach (var filter in filters)
            {
                var transactionsWithoutTagsAssigned = tagsPerTransaction
                    .Where(x => x.Value.Count == 0)
                    .Select(x => x.Key);
                var filteredTransactions = filter.Apply(transactionsWithoutTagsAssigned);

                foreach (var transaction in filteredTransactions)
                {
                    var notSuppressedTagNames = filter.TagNamesIfTrue.Where(tag => !suppressions.Any(s => s.TransactionId == transaction.Id && s.TagName == tag));

                    foreach (var tagName in notSuppressedTagNames)
                    {
                        TryAdd(tagsPerTransaction, new TagReadModel(tagName, Math.Abs(transaction.Amount)), transaction);
                    }
                }
            }
        }

        private void AddTagsFromAssignments(
            Dictionary<Transaction, HashSet<TagReadModel>> tagsPerTransaction,
            IEnumerable<TagAssignment> assignments)
        {
            foreach (var assignment in assignments)
            {
                var transaction = tagsPerTransaction.Keys.FirstOrDefault(t => t.Id == assignment.TransactionId);

                TryAdd(tagsPerTransaction, new TagReadModel(assignment.TagName, assignment.Amount), transaction);
            }
        }

        private void TryAdd(Dictionary<Transaction, HashSet<TagReadModel>> tagsPerTransaction, TagReadModel tag, Transaction transaction)
        {
            if (!tagsPerTransaction[transaction].Any(x => x.Name == tag.Name))
            {
                tagsPerTransaction[transaction].Add(tag);
            }
        }
    }
}
