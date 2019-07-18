using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using Microsoft.CodeAnalysis.Scripting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class AutoTagApplier
    {
        private readonly IStore<Filter> filterStore;

        public AutoTagApplier(IStore<Filter> filterStore)
        {
            this.filterStore = filterStore;
        }

        public async Task<IEnumerable<string>> GetTagNames(Transaction transaction)
        {
            var filters = (await filterStore.Query(q => q)).ToList();

            if (!filters.Any())
            {
                return Enumerable.Empty<string>();
            }

            var options = ScriptOptions.Default.AddReferences(typeof(Transaction).Assembly);
            var tagNames = new List<string>();

            filters.ForEach(filter =>
            {
                Func<Transaction, bool> expression = t =>
                    filter.Keywords.Any(keyword => t.Description.ToLowerInvariant().Contains(keyword.ToLowerInvariant()));
                
                if (expression(transaction))
                {
                    tagNames.Add(filter.TagName);
                }
            });

            return tagNames;
        }
    }
}
