using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class FilterService
    {
        private readonly IStore<Filter> filterStore;

        public FilterService(IStore<Filter> filterStore)
        {
            this.filterStore = filterStore;
        }

        public async Task<Filter> CreateFilter(Filter filter)
        {
            var existingFilter = (await filterStore.Query(q => q.Where(x => x.Expression.ToLowerInvariant() == filter.Expression.ToLowerInvariant()))).FirstOrDefault();

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
            filterEntity.Expression = filter.Expression;

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
