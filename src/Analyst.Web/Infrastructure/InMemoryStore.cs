using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Models.Abstract;
using Analyst.Core.Services.Abstract;

namespace Analyst.Web.Infrastructure
{
    public class InMemoryStore : IStore<Transaction>, IStore<Tag>, IStore<Filter>, IStore<TagAssignment>, IStore<TagSuppression>
    {
        private readonly List<Transaction> transactions = new List<Transaction>();
        private readonly List<Tag> tags = new List<Tag>();
        private readonly List<Filter> filters = new List<Filter>();
        private readonly List<TagAssignment> tagAssignments = new List<TagAssignment>();
        private readonly List<TagSuppression> tagSuppressions = new List<TagSuppression>();

        public InMemoryStore()
        {
            Seeder.SeedStore(this);
        }

        public Task Delete(Transaction entity)
            => Task.FromResult(transactions.Remove(entity));

        public Task Delete(Tag entity)
            => Task.FromResult(tags.Remove(entity));

        public Task Delete(Filter entity)
            => Task.FromResult(filters.Remove(entity));

        public Task Delete(TagAssignment entity)
            => Task.FromResult(tagAssignments.Remove(entity));

        public Task Delete(TagSuppression entity)
            => Task.FromResult(tagSuppressions.Remove(entity));

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Transaction>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(transactions.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Tag>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(tags.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Filter>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(filters.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<TagAssignment>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(tagAssignments.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<TagSuppression>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(tagSuppressions.AsQueryable()).AsEnumerable());

        public Task<Transaction> Save(Transaction entity)
            => SaveEntity(entity, transactions);

        public Task<Tag> Save(Tag entity)
            => SaveEntity(entity, tags);

        public Task<Filter> Save(Filter entity)
            => SaveEntity(entity, filters);

        public Task<TagAssignment> Save(TagAssignment entity)
            => SaveEntity(entity, tagAssignments);

        public Task<TagSuppression> Save(TagSuppression entity)
            => SaveEntity(entity, tagSuppressions);

        public Task<IEnumerable<Transaction>> Save(IEnumerable<Transaction> entities)
            => SaveEntities(entities, transactions);

        public Task<IEnumerable<Tag>> Save(IEnumerable<Tag> entities)
            => SaveEntities(entities, tags);

        public Task<IEnumerable<Filter>> Save(IEnumerable<Filter> entities)
            => SaveEntities(entities, filters);

        public Task<IEnumerable<TagAssignment>> Save(IEnumerable<TagAssignment> entities)
            => SaveEntities(entities, tagAssignments);

        public Task<IEnumerable<TagSuppression>> Save(IEnumerable<TagSuppression> entities)
            => SaveEntities(entities, tagSuppressions);

        private Task<T> SaveEntity<T>(T entity, List<T> list) where T : IEntity
        {
            if (!list.Contains(entity))
            {
                entity.Id = list.Any() ? list.Max(x => x.Id) + 1 : 1;
                list.Add(entity);
            }

            return Task.FromResult(entity);
        }

        private Task<IEnumerable<T>> SaveEntities<T>(IEnumerable<T> entities, List<T> list) where T : IEntity
        {
            foreach (var entity in entities)
            {
                SaveEntity(entity, list);
            }

            return Task.FromResult(entities);
        }
    }
}
