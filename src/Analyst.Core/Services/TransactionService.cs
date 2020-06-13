﻿using Analyst.Core.DomainMessages;
using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class TransactionService :
        IHandle<IgnoreTransactions>
    {
        IStore<Transaction> transactionStore;
        IStore<TransactionsUpload> uploadStore;
        TagService tagService;
        MessageBus messageBus;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;
        IStore<Comment> commentStore;
        IStore<TransactionIgnore> ignoredTransactionsStore;

        public TransactionService(
            IStore<Transaction> transactionStore,
            IStore<TransactionsUpload> uploadStore,
            TagService tagService, 
            MessageBus messageBus,
            IStore<TagAssignment> tagAssignmentStore, 
            IStore<TagSuppression> tagSuppressionStore, 
            IStore<Comment> commentStore,
            IStore<TransactionIgnore> ignoredTransactionsStore)
        {
            this.transactionStore = transactionStore;
            this.uploadStore = uploadStore;
            this.tagService = tagService;
            this.messageBus = messageBus;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
            this.commentStore = commentStore;
            this.ignoredTransactionsStore = ignoredTransactionsStore;
        }

        public async Task<(string UploadId, IEnumerable<Transaction> Transactions)> SaveTransactionsFromXml(Stream xml)
        {
            var transactions = XmlTransactionParser.GetTransactions(xml).ToList();
            var alreadyExistingtransactions = await transactionStore.Query(q => q);

            var transactionsToSave = transactions
                .Where(x => !alreadyExistingtransactions.Any(t => t.OrderDate == x.OrderDate && t.Amount == x.Amount && t.EndingBalance == x.EndingBalance)) // TODO: warunek jest niewystarczający
                .ToList();

            await transactionStore.Save(transactionsToSave);

            var upload = new TransactionsUpload(Guid.NewGuid().ToString(), transactionsToSave.Select(t => t.Id));

            await uploadStore.Save(upload);

            await messageBus.Publish(new TransactionsUploaded(transactionsToSave));

            return (upload.Id, transactionsToSave);
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

            var ignore = (await ignoredTransactionsStore.Query(q => q.Where(t => t.TransactionId == transactionId))).SingleOrDefault();

            if (newValue == true && ignore == null)
            {
                await ignoredTransactionsStore.Save(new TransactionIgnore { TransactionId = transactionId });
            }
            else if (newValue == false && ignore != null)
            {
                await ignoredTransactionsStore.Delete(ignore);
            }
        }

        public async Task EditComment(int transactionId, string text)
        {
            var comment = (await commentStore.Query(q => q.Where(c => c.TransactionId == transactionId))).SingleOrDefault();

            if (comment == null)
            {
                comment = new Comment
                {
                    TransactionId = transactionId,
                    Text = text,
                };

                if (!string.IsNullOrWhiteSpace(text))
                {
                    await commentStore.Save(comment);
                }
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(text))
                {
                    comment.Text = text;

                    await commentStore.Save(comment);
                }
                else
                {
                    await commentStore.Delete(comment);
                }
            }
        }

        async Task IHandle<IgnoreTransactions>.Handle(IgnoreTransactions message)
        {
            await Task.WhenAll(message.TransactionsIds.Select(id => SetIgnoredValue(id, true)));
        }
    }
}
