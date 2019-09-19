using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class TransactionService
    {
        IStore<Transaction> transactionStore;
        TagService tagService;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;

        public TransactionService(IStore<Transaction> transactionStore, TagService tagService, IStore<TagAssignment> tagAssignmentStore, IStore<TagSuppression> tagSuppressionStore)
        {
            this.transactionStore = transactionStore;
            this.tagService = tagService;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
        }

        public async Task<IEnumerable<Transaction>> SaveTransactionsFromXml(Stream xml)
        {
            var transactions = XmlTransactionParser.GetTransactions(xml).ToList();
            var alreadyExistingtransactions = await transactionStore.Query(q => q);

            var transactionsToSave = transactions
                .Where(x => !alreadyExistingtransactions.Any(t => t.OrderDate == x.OrderDate && t.Amount == x.Amount && t.EndingBalance == x.EndingBalance))
                .ToList();

            await transactionStore.Save(transactionsToSave);

            return transactionsToSave;
        }

        public async Task AddTagToTransaction(int transactionId, string tagName)
        {
            var tag = await tagService.GetTagByName(tagName);

            if (tag == null)
            {
                throw new Exception($"Tag {tagName} does not exist.");
            }

            var transaction = (await transactionStore.Query(q => q.Where(t => t.Id == transactionId))).SingleOrDefault();

            if (transaction == null)
            {
                throw new Exception($"Transaction with id = {transactionId} does not exist.");
            }

            var tagAssignment = (await tagAssignmentStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();
            var tagSuppression = (await tagSuppressionStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();

            if (tagSuppression != null)
            {
                await tagSuppressionStore.Delete(tagSuppression);

                return;
            }

            if (tagAssignment != null)
            {
                return;
            }

            await tagAssignmentStore.Save(new TagAssignment { TagName = tagName, TransactionId = transactionId });
        }

        public async Task RemoveTagFromTransaction(int transactionId, string tagName)
        {
            var tagAssignment = (await tagAssignmentStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();

            if (tagAssignment != null)
            {
                await tagAssignmentStore.Delete(tagAssignment);

                return;
            }

            var tagSuppression = (await tagSuppressionStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();

            if (tagSuppression == null)
            {
                await tagSuppressionStore.Save(new TagSuppression { TagName = tagName, TransactionId = transactionId });
            }
        }

        public async Task SetIgnoredValue(int transactionId, bool newValue)
        {
            var transaction = (await transactionStore.Query(q => q.Where(t => t.Id == transactionId))).SingleOrDefault();

            if (transaction == null)
            {
                throw new Exception($"Transaction with id = {transactionId} does not exist.");
            }

            transaction.Ignored = newValue;

            await transactionStore.Save(transaction);
        }
    }
}
