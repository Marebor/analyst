using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services.Abstract
{
    public interface IStore<T> where T : class
    {
        Task<T> Save(T entity);
        Task<IEnumerable<T>> Save(IEnumerable<T> entities);
        Task Delete(T entity);
        Task Delete(IEnumerable<T> entities);
        Task<IReadOnlyCollection<TOut>> Query<TOut>(Func<IQueryable<T>, IQueryable<TOut>> filter);
    }
}
