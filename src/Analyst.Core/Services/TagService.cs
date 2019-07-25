using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class TagService
    {
        IStore<Tag> tagStore;
        IStore<TagAssignment> tagAssignmentStore;
        IStore<TagSuppression> tagSuppressionStore;

        public TagService(IStore<Tag> tagStore, IStore<TagAssignment> tagAssignmentStore, IStore<TagSuppression> tagSuppressionStore)
        {
            this.tagStore = tagStore;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
        }

        public async Task<Tag> CreateTag(string tagName, string color)
        {
            var tag = await GetTagByName(tagName);

            if (tag != null)
            {
                throw new Exception($"Tag {tagName} already exist.");
            }

            return await tagStore.Save(new Tag { Name = tagName, Color = color });
        }

        public async Task DeleteTag(string tagName)
        {
            var tag = await GetTagByName(tagName);

            if (tag != null)
            {
                await tagStore.Delete(tag);
            }
        }

        public async Task ChangeTagColor(string tagName, string color)
        {
            var tag = await GetTagByName(tagName);

            if (tag == null)
            {
                throw new Exception($"Tag {tagName} does not exist.");
            }

            tag.Color = color;

            await tagStore.Save(tag);
        }

        public async Task AddTransactionToTag(int transactionId, string tagName)
        {
            var tag = await GetTagByName(tagName);

            if (tag == null)
            {
                throw new Exception($"Tag {tagName} does not exist.");
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

        public async Task RemoveTransactionFromTag(int transactionId, string tagName)
        {
            var tagAssignment = (await tagAssignmentStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();
            var tagSuppression = (await tagSuppressionStore.Query(q => q.Where(x => x.TransactionId == transactionId && x.TagName == tagName))).SingleOrDefault();

            if (tagAssignment != null)
            {
                await tagAssignmentStore.Delete(tagAssignment);

                return;
            }

            if (tagSuppression == null)
            {
                await tagSuppressionStore.Save(new TagSuppression { TagName = tagName, TransactionId = transactionId });
            }
        }

        private async Task<Tag> GetTagByName(string tagName, Expression<Func<Tag, bool>> additionalFilter = null)
            => (await tagStore.Query(q => q
                .Where(x => x.Name == tagName)
                .Where(additionalFilter == null ? x => true : additionalFilter)))
                .FirstOrDefault();
    }
}
