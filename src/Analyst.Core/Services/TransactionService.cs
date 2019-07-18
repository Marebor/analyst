using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class TransactionService
    {
        IStore<Transaction> transactionStore;
        IStore<Tag> tagStore;
        AutoTagApplier autoTagApplier;

        public TransactionService(IStore<Transaction> transactionStore, IStore<Tag> tagStore, AutoTagApplier autoTagApplier)
        {
            this.transactionStore = transactionStore;
            this.tagStore = tagStore;
            this.autoTagApplier = autoTagApplier;
        }

        public async Task SaveTransactionsFromXml(Stream xml)
        {
            var transactions = XmlTransactionParser.GetTransactions(xml).ToList();
            var alreadyExistingtransactions = await transactionStore.Query(q => q);

            var transactionsToSave = transactions
                .Where(x => !alreadyExistingtransactions.Any(t => t.OrderDate == x.OrderDate && t.Amount == x.Amount && t.EndingBalance == x.EndingBalance))
                .ToList();

            await transactionStore.Save(transactionsToSave);

            await AddTags(transactionsToSave);
        }

        public async Task AddTagToTransaction(int transactionId, string tagName)
        {
            await ValidateTransactionId(transactionId);

            var tag = await GetTagByName(tagName);

            if (tag == null)
            {
                tag = new Tag
                {
                    Name = tagName,
                    Color = "gray",
                    TransactionsIds = new List<int>(),
                };
            }

            tag.TransactionsIds.Add(transactionId);

            await tagStore.Save(tag);
        }

        public async Task RemoveTagFromTransaction(string tagName, int transactionId)
        {
            await ValidateTransactionId(transactionId);

            var tag = await GetTagByName(tagName, x => x.TransactionsIds.Contains(transactionId));

            if (tag == null)
            {
                throw new Exception($"Tag {tagName} is not related to transaction with ID = {transactionId}.");
            }

            tag.TransactionsIds.Remove(transactionId);

            if (!tag.TransactionsIds.Any())
            {
                await tagStore.Delete(tag);
            }
            else
            {
                await tagStore.Save(tag);
            }
        }

        private async Task ValidateTransactionId(int transactionId)
        {
            var transactionExists = (await transactionStore.Query(q => q.Where(x => x.Id == transactionId))).Any();

            if (!transactionExists)
            {
                throw new Exception($"transaction with ID = {transactionId} does not exist.");
            }
        }

        private async Task<Tag> GetTagByName(string tagName, Expression<Func<Tag, bool>> additionalFilter = null)
            => (await tagStore.Query(q => q
                .Where(x => x.Name == tagName)
                .Where(additionalFilter == null ? x => true : additionalFilter)))
                .FirstOrDefault();

        private async Task AddTags(IEnumerable<Transaction> transactions)
        {
            foreach (var transaction in transactions)
            {
                var tagNames = await autoTagApplier.GetTagNames(transaction);

                foreach (var tagName in tagNames)
                {
                    var savedTag = await GetTagByName(tagName);

                    if (savedTag == null)
                    {
                        savedTag = new Tag
                        {
                            Name = tagName,
                            TransactionsIds = new List<int>(),
                        };
                    }

                    if (!savedTag.TransactionsIds.Contains(transaction.Id))
                    {
                        savedTag.TransactionsIds.Add(transaction.Id);
                    }

                    await tagStore.Save(savedTag);
                }
            }
        }
    }
}
