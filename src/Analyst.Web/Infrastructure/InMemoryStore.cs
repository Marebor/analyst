using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Models.Abstract;
using Analyst.Core.Services.Abstract;

namespace Analyst.Web.Infrastructure
{
    public class InMemoryStore : IStore<Transaction>, IStore<Tag>, IStore<Filter>
    {
        private readonly List<Transaction> transactions = new List<Transaction>();
        private readonly List<Tag> tags = new List<Tag>();
        private readonly List<Filter> filters = new List<Filter>();

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

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Transaction>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(transactions.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Tag>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(tags.AsQueryable()).AsEnumerable());

        public Task<IEnumerable<TOut>> Query<TOut>(System.Func<IQueryable<Filter>, IQueryable<TOut>> filter)
            => Task.FromResult(filter(filters.AsQueryable()).AsEnumerable());

        public Task Save(Transaction entity)
            => SaveEntity(entity, transactions);

        public Task Save(Tag entity)
            => SaveEntity(entity, tags);

        public Task Save(Filter entity)
            => SaveEntity(entity, filters);

        public Task Save(IEnumerable<Transaction> entities)
            => SaveEntities(entities, transactions);

        public Task Save(IEnumerable<Tag> entities)
            => SaveEntities(entities, tags);

        public Task Save(IEnumerable<Filter> entities)
            => SaveEntities(entities, filters);

        private Task SaveEntity<T>(T entity, List<T> list) where T : IEntity
        {
            if (!list.Contains(entity))
            {
                entity.Id = list.Any() ? list.Max(x => x.Id) + 1 : 1;
                list.Add(entity);
            }

            return Task.CompletedTask;
        }

        private Task SaveEntities<T>(IEnumerable<T> entities, List<T> list) where T : IEntity
        {
            foreach (var entity in entities)
            {
                SaveEntity(entity, list);
            }

            return Task.CompletedTask;
        }
    }
}
