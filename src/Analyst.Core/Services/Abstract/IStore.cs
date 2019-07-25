using Analyst.Core.Models.Abstract;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services.Abstract
{
    public interface IStore<T> where T : class, IEntity
    {
        Task<T> Save(T entity);
        Task<IEnumerable<T>> Save(IEnumerable<T> entities);
        Task Delete(T entity);
        Task<IEnumerable<TOut>> Query<TOut>(Func<IQueryable<T>, IQueryable<TOut>> filter);
    }
}
