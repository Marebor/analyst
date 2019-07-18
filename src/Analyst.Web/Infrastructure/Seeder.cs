using Analyst.Core.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;

namespace Analyst.Web.Infrastructure
{
    public class Seeder
    {
        public static void SeedStore(InMemoryStore store)
        {
            var filepath = Path.Combine(Directory.GetCurrentDirectory(), "seed.json");

            using (var fs = File.OpenRead(filepath))
            using (var reader = new StreamReader(fs))
            {
                var content = reader.ReadToEnd();
                var seed = JsonConvert.DeserializeObject<Seed>(content);

                store.Save(seed.Tags);
                store.Save(seed.Filters);
            }
        }

        public class Seed
        {
            public IEnumerable<Tag> Tags { get; set; }
            public IEnumerable<Filter> Filters { get; set; }
        }
    }
}
