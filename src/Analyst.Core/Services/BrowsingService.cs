using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
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

            var transactionsPerTag = new Dictionary<string, HashSet<Transaction>>();

            AddTransactionsFromFilters(transactionsPerTag, transactions, filters, suppressions);
            AddTransactionsFromAssignments(transactionsPerTag, transactions, assignments);

            return new BrowsingData(
                transactions
                    .Select(t => new TransactionReadModel(t, transactionsPerTag
                        .Where(kvp => kvp.Value.Any(v => v.Id == t.Id))
                        .Select(kvp => kvp.Key),
                        comments.SingleOrDefault(c => c.TransactionId == t.Id)?.Text,
                        ignoredTransactions.Any(it => it.TransactionId == t.Id)))
                    .ToArray(),
                transactionsPerTag
                    .ToDictionary(kvp => kvp.Key, kvp => kvp.Value
                        .Where(t => t.Amount < 0)
                        .Where(t => !ignoredTransactions.Any(it => it.TransactionId == t.Id))
                        .Sum(t => -t.Amount)),
                transactions
                    .Where(t => !transactionsPerTag.SelectMany(kvp => kvp.Value).Any(v => t.Id == v.Id))
                    .Where(t => t.Amount < 0)
                    .Where(t => !ignoredTransactions.Any(it => it.TransactionId == t.Id))
                    .Sum(t => -t.Amount));
        }

        private void AddTransactionsFromFilters(
            Dictionary<string, HashSet<Transaction>> transactionsPerTag, 
            IEnumerable<Transaction> transactions, 
            IEnumerable<Filter> filters, 
            IEnumerable<TagSuppression> suppressions)
        {
            foreach (var filter in filters)
            {
                var filteredTransactions = filter.Apply(transactions);

                foreach (var transaction in filteredTransactions)
                {
                    var notSuppressedTags = filter.TagNamesIfTrue.Where(tag => !suppressions.Any(s => s.TransactionId == transaction.Id && s.TagName == tag));

                    foreach (var tag in notSuppressedTags)
                    {
                        Add(transactionsPerTag, tag, transaction);
                    }
                }
            }
        }

        private void AddTransactionsFromAssignments(
            Dictionary<string, HashSet<Transaction>> transactionsPerTag,
            IEnumerable<Transaction> transactions,
            IEnumerable<TagAssignment> assignments)
        {
            foreach (var assignment in assignments)
            {
                var transaction = transactions.FirstOrDefault(t => t.Id == assignment.TransactionId);

                Add(transactionsPerTag, assignment.TagName, transaction);
            }
        }

        private void Add(Dictionary<string, HashSet<Transaction>> transactionsPerTag, string tag, Transaction transaction)
        {
            if (transactionsPerTag.ContainsKey(tag))
            {
                transactionsPerTag[tag].Add(transaction);
            }
            else
            {
                transactionsPerTag.Add(tag, new HashSet<Transaction> { transaction });
            }
        }
    }
}
