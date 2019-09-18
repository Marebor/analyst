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
        IStore<Transaction> transactionStore;
        IStore<Filter> filterStore;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;

        public BrowsingService(IStore<Transaction> transactionStore, IStore<Filter> filterStore, IStore<TagAssignment> tagAssignmentStore, IStore<TagSuppression> tagSuppressionStore)
        {
            this.transactionStore = transactionStore;
            this.filterStore = filterStore;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
        }

        public async Task<BrowsingData> Browse(DateTime startDate, DateTime endDate)
        {
            var transactions = await transactionStore.Query(q => q
                .Where(t => t.OrderDate >= startDate && t.OrderDate <= endDate)
                .OrderByDescending(x => x.OrderDate));
            var filters = await filterStore.Query(q => q);
            var assignments = await tagAssignmentStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));
            var suppressions = await tagSuppressionStore.Query(q => q.Where(a => transactions.Any(t => a.TransactionId == t.Id)));

            var transactionsPerTag = new Dictionary<string, HashSet<Transaction>>();

            AddTransactionsFromFilters(transactionsPerTag, transactions, filters, suppressions);
            AddTransactionsFromAssignments(transactionsPerTag, transactions, assignments);

            return new BrowsingData(
                startDate,
                endDate,
                transactionsPerTag.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Where(t => t.Amount < 0).Sum(t => t.Amount)),
                transactionsPerTag.ToDictionary(kvp => kvp.Key, kvp => kvp.Value.Select(t => t.Id)));
        }

        private void AddTransactionsFromFilters(
            Dictionary<string, HashSet<Transaction>> transactionsPerTag, 
            IEnumerable<Transaction> transactions, 
            IEnumerable<Filter> filters, 
            IEnumerable<TagSuppression> suppressions)
        {
            foreach (var filter in filters)
            {
                var filteredTransactions = transactions.Where(t => filter.Keywords.Any(kw => t.Description.Contains(kw)));

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
