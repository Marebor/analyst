using Analyst.Core.Models.Abstract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services.Abstract
{
    public interface IStore<T> where T : class, IEntity
    {
        Task Save(T entity);
        Task Save(IEnumerable<T> entities);
        Task Delete(T entity);
        Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<T>, IQueryable<TOut>> filter);
    }
}
