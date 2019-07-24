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

            await transactionStore.Save(transactionsToSave);

            return transactionsToSave;
        }

        public async Task SetIgnoredValue(int transactionId, bool value)
        {
            var transaction = await GetTransaction(transactionId);

            transaction.Ignored = value;

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
