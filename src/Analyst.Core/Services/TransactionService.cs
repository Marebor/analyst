using Analyst.Core.DomainMessages;
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
        IStore<TransactionsUpload> uploadStore;
        TagService tagService;
        MessageBus messageBus;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;
        IStore<Comment> commentStore;

        public TransactionService(
            IStore<Transaction> transactionStore,
            IStore<TransactionsUpload> uploadStore,
            TagService tagService, 
            MessageBus messageBus,
            IStore<TagAssignment> tagAssignmentStore, 
            IStore<TagSuppression> tagSuppressionStore, 
            IStore<Comment> commentStore)
        {
            this.transactionStore = transactionStore;
            this.uploadStore = uploadStore;
            this.tagService = tagService;
            this.messageBus = messageBus;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
            this.commentStore = commentStore;
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

        public async Task SaveTransactionTags(int transactionId, IEnumerable<TagReadModel> tagsToAssign)
        {
            if (tagsToAssign.Any(x => x.Amount < 0))
            {
                throw new Exception("Incorrect amount.");
            }

            var tags = await tagService.GetTagsByName(tagsToAssign.Select(x => x.Name));

            if (tags.Count != tagsToAssign.Count())
            {
                throw new Exception($"Some of specified tags does not exist.");
            }

            var transaction = (await transactionStore.Query(q => q.Where(t => t.Id == transactionId))).SingleOrDefault();

            if (transaction == null)
            {
                throw new Exception($"Transaction with id = {transactionId} does not exist.");
            }

            if (tagsToAssign.Sum(x => x.Amount) > Math.Abs(transaction.Amount))
            {
                throw new Exception("Sum of amount values is higher than transaction amount.");
            }

            var tagAssignments = await tagAssignmentStore.Query(q => q.Where(x => x.TransactionId == transactionId));
            var tagSuppressions = await tagSuppressionStore.Query(q => q.Where(x => x.TransactionId == transactionId));

            var newAssignments = tagsToAssign
                .Where(x => x.Amount > 0)
                .Select(x => new TagAssignment
                {
                    TransactionId = transaction.Id,
                    TagName = x.Name,
                    Amount = x.Amount,
                });

            var assignmentsToDelete = tagAssignments
                .Where(x => !newAssignments
                    .Select(y => y.TagName)
                    .Contains(x.TagName) ||
                    newAssignments.Any(a => a.TagName == x.TagName && a.Amount != x.Amount));

            var suppressionsToDelete = tagSuppressions
                .Where(x => newAssignments
                    .Select(y => y.TagName)
                    .Contains(x.TagName));

            await tagAssignmentStore.Delete(assignmentsToDelete);
            await tagSuppressionStore.Delete(suppressionsToDelete);
            await tagAssignmentStore.Save(newAssignments);
        }

        public async Task RemoveTagFromTransaction(int transactionId, string tagName)
        {
            var transaction = (await transactionStore.Query(q => q.Where(t => t.Id == transactionId))).SingleOrDefault();

            if (transaction == null)
            {
                throw new Exception($"Transaction with id = {transactionId} does not exist.");
            }

            var tag = await tagService.GetTagByName(tagName);

            if (tag is null)
            {
                throw new Exception($"Tag with name {tagName} does not exist.");
            }

            var tagAssignment = (await tagAssignmentStore.Query(q => q.Where(x => x.TagName == tagName && x.TransactionId == transactionId))).SingleOrDefault();
            var tagSuppression = (await tagSuppressionStore.Query(q => q.Where(x => x.TagName == tagName && x.TransactionId == transactionId))).SingleOrDefault();

            if (tagAssignment is null && tagSuppression is null)
            {
                await tagSuppressionStore.Save(new TagSuppression
                {
                    TransactionId = transactionId,
                    TagName = tagName,
                });
            }
            else if (tagAssignment != null)
            {
                await tagAssignmentStore.Delete(tagAssignment);
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
    }
}
