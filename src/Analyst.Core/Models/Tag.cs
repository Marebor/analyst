using Analyst.Core.Models.Abstract;

namespace Analyst.Core.Models
{
    public class Tag : IEntity
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Color { get; set; }
    }
}
