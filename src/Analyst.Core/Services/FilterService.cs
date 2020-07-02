using Analyst.Core.DomainMessages;
using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class FilterService
    {
        IStore<Filter> filterStore;
        TagService tagService;
        MessageBus messageBus;

        public FilterService(IStore<Filter> filterStore, TagService tagService, MessageBus messageBus)
        {
            this.filterStore = filterStore;
            this.tagService = tagService;
            this.messageBus = messageBus;
        }

        public async Task<Filter> CreateFilter(Filter filter)
        {
            if (filter.TagNamesIfTrue == null || !filter.TagNamesIfTrue.Any())
            {
                throw new Exception("Cannot create filter without any tag assigned");
            }

            var tagsTasks = filter.TagNamesIfTrue.ToDictionary(tagName => tagName, tagName => tagService.GetTagByName(tagName));

            await Task.WhenAll(tagsTasks.Values);

            var notExistingTags = tagsTasks.Where(task => task.Value.Result == null).ToDictionary(x => x.Key, x => x.Value);

            if (notExistingTags.Count > 0)
            {
                throw new Exception($"Cannot create filter with not existing tag assigned. Incorrect tags: {string.Join(", ", notExistingTags.Keys)}");
            }

            Func<IEnumerable<string>, IEnumerable<string>> keywordsSequence = keywords => keywords
                    .Select(kw => kw.ToLowerInvariant())
                    .OrderBy(kw => kw);

            var existingFilter = (await filterStore.Query(q => q
                .Where(f => keywordsSequence(f.Keywords).SequenceEqual(keywordsSequence(filter.Keywords)))))
                .FirstOrDefault();

            if (existingFilter != null)
            {
                throw new Exception("Filter with specified expression already exists.");
            }

            filter = await filterStore.Save(filter);

            return filter;
        }

        public async Task EditFilter(int id, Filter filter)
        {
            var filterEntity = (await filterStore.Query(q => q.Where(x => x.Id == id))).FirstOrDefault();

            if (filterEntity == null)
            {
                throw new Exception($"Filter with id = {id} does not exist.");
            }

            filterEntity.TagNamesIfTrue = filter.TagNamesIfTrue;
            filterEntity.Keywords = filter.Keywords;

            await filterStore.Save(filterEntity);
        }

        public async Task DeleteFilter(int id)
        {
            var filterEntity = (await filterStore.Query(q => q.Where(x => x.Id == id))).FirstOrDefault();

            if (filterEntity == null)
            {
                throw new Exception($"Filter with id = {id} does not exist.");
            }
            
            await filterStore.Delete(filterEntity);
        }
    }
}
