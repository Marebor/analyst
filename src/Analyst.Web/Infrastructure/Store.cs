using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Web.Infrastructure
{
    public class Store : IStore<Transaction>, IStore<Tag>, IStore<Filter>, IStore<TagAssignment>, IStore<TagSuppression>, IStore<Comment>
    {
        private readonly AnalystDbContext dbContext;

        public Store(AnalystDbContext dbContext)
        {
            this.dbContext = dbContext;
        }

        public Task Delete(Transaction entity)
            => SaveChanges(() => dbContext.Transactions.Remove(entity));

        public Task Delete(Tag entity)
            => SaveChanges(() => dbContext.Tags.Remove(entity));

        public Task Delete(Filter entity)
            => SaveChanges(() => dbContext.Filters.Remove(entity));

        public Task Delete(TagAssignment entity)
            => SaveChanges(() => dbContext.TagAssignments.Remove(entity));

        public Task Delete(TagSuppression entity)
            => SaveChanges(() => dbContext.TagSuppressions.Remove(entity));

        public Task Delete(Comment entity)
            => SaveChanges(() => dbContext.Comments.Remove(entity));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<Transaction>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Transactions));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<Tag>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Tags));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<Filter>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Filters));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<TagAssignment>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.TagAssignments));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<TagSuppression>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.TagSuppressions));

        public Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<Comment>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Comments));

        public Task<Transaction> Save(Transaction entity)
            => SaveEntity(entity, dbContext.Transactions);

        public Task<Tag> Save(Tag entity)
            => SaveEntity(entity, dbContext.Tags);

        public Task<Filter> Save(Filter entity)
            => SaveEntity(entity, dbContext.Filters);

        public Task<TagAssignment> Save(TagAssignment entity)
            => SaveEntity(entity, dbContext.TagAssignments);

        public Task<TagSuppression> Save(TagSuppression entity)
            => SaveEntity(entity, dbContext.TagSuppressions);

        public Task<Comment> Save(Comment entity)
            => SaveEntity(entity, dbContext.Comments);

        public Task<IEnumerable<Transaction>> Save(IEnumerable<Transaction> entities)
            => SaveEntities(entities, dbContext.Transactions);

        public Task<IEnumerable<Tag>> Save(IEnumerable<Tag> entities)
            => SaveEntities(entities, dbContext.Tags);

        public Task<IEnumerable<Filter>> Save(IEnumerable<Filter> entities)
            => SaveEntities(entities, dbContext.Filters);

        public Task<IEnumerable<TagAssignment>> Save(IEnumerable<TagAssignment> entities)
            => SaveEntities(entities, dbContext.TagAssignments);

        public Task<IEnumerable<TagSuppression>> Save(IEnumerable<TagSuppression> entities)
            => SaveEntities(entities, dbContext.TagSuppressions);

        public Task<IEnumerable<Comment>> Save(IEnumerable<Comment> entities)
            => SaveEntities(entities, dbContext.Comments);

        private async Task<T> SaveEntity<T>(T entity, DbSet<T> set, bool saveChanges = true) where T : class
        {
            if (!set.Any(x => x.Equals(entity)))
            {
                entity = set.Add(entity).Entity;
            }

            if (saveChanges)
            {
                await dbContext.SaveChangesAsync();
            }

            return entity;
        }

        private async Task<IEnumerable<T>> SaveEntities<T>(IEnumerable<T> entities, DbSet<T> set) where T : class
        {
            var returnedEntities = new List<T>();

            foreach (var entity in entities)
            {
                returnedEntities.Add(await SaveEntity(entity, set, false));
            }

            await dbContext.SaveChangesAsync();

            return returnedEntities;
        }

        private async Task<T> SaveChanges<T>(Func<T> func)
        {
            T returned = func();
            await dbContext.SaveChangesAsync();

            return returned;
        }

        private async Task SaveChanges(Action action)
        {
            action();
            await dbContext.SaveChangesAsync();
        }

        private async Task<IReadOnlyCollection<T>> Query<T>(IQueryable<T> query)
        {
            var returned = await query.ToListAsync();

            return returned;
        }
    }
}
