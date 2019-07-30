﻿using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Web.Infrastructure
{
    public class Store : IStore<Transaction>, IStore<Tag>, IStore<Filter>, IStore<TagAssignment>, IStore<TagSuppression>
    {
        private readonly AnalystDbContext dbContext;

        public Store(AnalystDbContext dbContext)
        {
            this.dbContext = dbContext;
            Seeder.SeedStore(this);
            dbContext.SaveChanges();
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

        public Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<Transaction>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Transactions));

        public Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<Tag>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Tags));

        public Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<Filter>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.Filters));

        public Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<TagAssignment>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.TagAssignments));

        public Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<TagSuppression>, IQueryable<TOut>> filter)
            => Query(filter(dbContext.TagSuppressions));

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

        private async Task<T> SaveEntity<T>(T entity, DbSet<T> set) where T : class
        {
            if (!set.Any(x => x.Equals(entity)))
            {
                set.Add(entity);
            }

            await dbContext.SaveChangesAsync();

            return entity;
        }

        private async Task<IEnumerable<T>> SaveEntities<T>(IEnumerable<T> entities, DbSet<T> set) where T : class
        {
            var returnedEntities = new List<T>();

            foreach (var entity in entities)
            {
                returnedEntities.Add(await SaveEntity(entity, set));
            }

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

        private async Task<IEnumerable<T>> Query<T>(IQueryable<T> query)
        {
            var returned = await query.ToListAsync();

            return returned;
        }
    }
}