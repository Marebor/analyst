﻿using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class TagService
    {
        IStore<Tag> tagStore;

        public TagService(IStore<Tag> tagStore)
        {
            this.tagStore = tagStore;
        }

        public async Task ChangeTagColor(string tagName, string color)
        {
            var tag = await GetTagByName(tagName);

            if (tag == null)
            {
                throw new Exception($"Tag {tagName} does not exist.");
            }

            tag.Color = color;

            await tagStore.Save(tag);
        }

        private async Task<Tag> GetTagByName(string tagName, Expression<Func<Tag, bool>> additionalFilter = null)
            => (await tagStore.Query(q => q
                .Where(x => x.Name == tagName)
                .Where(additionalFilter == null ? x => true : additionalFilter)))
                .FirstOrDefault();
    }
}
