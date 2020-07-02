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

        public BrowsingService(
            IStore<Filter> filterStore, 
            IStore<TagAssignment> tagAssignmentStore, 
            IStore<TagSuppression> tagSuppressionStore, 
            IStore<Comment> commentStore)
        {
            this.filterStore = filterStore;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
            this.commentStore = commentStore;
        }

        public async Task<BrowsingData> Browse(IEnumerable<Transaction> transactions)
        {
            var filters = await filterStore.Query(q => q);
            var assignments = await tagAssignmentStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));
            var suppressions = await tagSuppressionStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));
            var comments = await commentStore.Query(q => q.Where(c => transactions.Any(t => c.TransactionId == t.Id)));

            var tagsPerTransaction = transactions.ToDictionary(x => x, _ => new HashSet<TagReadModel>());

            AddTagsFromAssignments(tagsPerTransaction, assignments);
            AddTagsFromFilters(tagsPerTransaction, filters, suppressions);
            
            return new BrowsingData(
                transactions: transactions
                    .OrderByDescending(t => t.OrderDate)
                    .Select(transaction => new TransactionReadModel(
                        transaction, 
                        tagsPerTransaction[transaction].ToArray(),
                        comments.SingleOrDefault(c => c.TransactionId == transaction.Id)?.Text))
                    .ToArray(),
                spendingsPerTag: tagsPerTransaction
                    .Where(x => x.Key.Amount < 0)
                    .SelectMany(x => x.Value)
                    .GroupBy(x => x.Name)
                    .Where(x => x.Key != "IGNORE")
                    .ToDictionary(
                        x => x.Key,
                        x => x.Sum(y => y.Amount)),
                otherSpendings: tagsPerTransaction
                    .Where(x => x.Key.Amount < 0)
                    .Sum(x => Math.Abs(x.Key.Amount) - x.Value.Sum(y => y.Amount)),
                summary: new Summary(
                    totalIncome: tagsPerTransaction
                        .Where(t => t.Key.Amount > 0)
                        .Sum(t => Math.Abs(t.Key.Amount) - t.Value.Where(tag => tag.Name == "IGNORE").Sum(tag => tag.Amount)),
                    totalExpenses: tagsPerTransaction
                        .Where(t => t.Key.Amount < 0)
                        .Sum(t => Math.Abs(t.Key.Amount) - t.Value.Where(tag => tag.Name == "IGNORE").Sum(tag => tag.Amount))));
        }

        private void AddTagsFromFilters(
            Dictionary<Transaction, HashSet<TagReadModel>> tagsPerTransaction,
            IEnumerable<Filter> filters, 
            IEnumerable<TagSuppression> suppressions)
        {
            var orderedFilters = filters.OrderBy(f => !f.TagNamesIfTrue.Any(t => t == "IGNORE"));

            foreach (var filter in orderedFilters)
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
                        if (!tagsPerTransaction[transaction].Any())
                        {
                            TryAdd(tagsPerTransaction, new TagReadModel(tagName, Math.Abs(transaction.Amount)), transaction);
                        }
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
