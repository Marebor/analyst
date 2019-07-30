using Analyst.Core.Models;
using Newtonsoft.Json;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Analyst.Web.Infrastructure
{
    public class Seeder
    {
        public static void SeedDb(AnalystDbContext db)
        {
            var filepath = Path.Combine(Directory.GetCurrentDirectory(), "seed.json");

            using (var fs = File.OpenRead(filepath))
            using (var reader = new StreamReader(fs))
            {
                var content = reader.ReadToEnd();
                var seed = JsonConvert.DeserializeObject<Seed>(content);

                Save(db, seed);
            }
        }

        private static void Save(AnalystDbContext db, Seed seed)
        {
            foreach (var tag in seed.Tags)
            {
                if (!db.Tags.Any(x => x.Equals(tag)))
                {
                    db.Tags.Add(tag);
                }
            }


            foreach (var filter in seed.Filters)
            {
                if (!db.Filters.Any(x => x.Equals(filter)))
                {
                    db.Filters.Add(filter);
                }
            }

            db.SaveChanges();
        }

        public class Seed
        {
            public IEnumerable<Tag> Tags { get; set; }
            public IEnumerable<Filter> Filters { get; set; }
        }
    }
}
