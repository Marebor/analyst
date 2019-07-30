namespace Analyst.Core.Models
{
    public class Tag
    {
        public string Name { get; set; }
        public string Color { get; set; }

        public override bool Equals(object obj)
        {
            var other = obj as Tag;

            return other != null ? other.Name == Name : false;
        }

        public override int GetHashCode()
        {
            var hashCode = -805798031;
            hashCode = hashCode * -1521134295 + Name.GetHashCode();
            return hashCode;
        }
    }
}
