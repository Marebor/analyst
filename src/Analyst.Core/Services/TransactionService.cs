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
        IStore<Tag> tagStore;

        public TransactionService(IStore<Transaction> transactionStore, IStore<Tag> tagStore)
        {
            this.transactionStore = transactionStore;
            this.tagStore = tagStore;
        }

        public async Task<IEnumerable<Transaction>> SaveTransactionsFromXml(Stream xml)
        {
            var transactions = XmlTransactionParser.GetTransactions(xml).ToList();
            var alreadyExistingtransactions = await transactionStore.Query(q => q);

            var transactionsToSave = transactions
                .Where(x => !alreadyExistingtransactions.Any(t => t.OrderDate == x.OrderDate && t.Amount == x.Amount && t.EndingBalance == x.EndingBalance))
                .ToList();

            transactionsToSave.ForEach(t => t.AssignedTagNames = new List<string>());

            await transactionStore.Save(transactionsToSave);

            return transactionsToSave;
        }

        public async Task AddTagToTransaction(int transactionId, string tagName)
        {
            var transaction = await GetTransaction(transactionId);

            var tag = await GetTagByName(tagName);

            if (tag == null)
            {
                tag = new Tag
                {
                    Name = tagName,
                    Color = "gray",
                };

                await tagStore.Save(tag);
            }

            transaction.AssignedTagNames.Add(tag.Name);

            await transactionStore.Save(transaction);
        }

        public async Task RemoveTagFromTransaction(string tagName, int transactionId)
        {
            var transaction = await GetTransaction(transactionId);

            transaction.AssignedTagNames.Remove(tagName);

            await transactionStore.Save(transaction);
        }

        private async Task<Transaction> GetTransaction(int transactionId)
        {
            var transaction = (await transactionStore.Query(q => q.Where(x => x.Id == transactionId))).FirstOrDefault();

            if (transaction == null)
            {
                throw new Exception($"transaction with ID = {transactionId} does not exist.");
            }

            return transaction;
        }

        private async Task<Tag> GetTagByName(string tagName)
            => (await tagStore.Query(q => q
                .Where(x => x.Name == tagName)))
                .FirstOrDefault();
    }
}
