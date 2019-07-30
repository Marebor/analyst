namespace Analyst.Core.Models
{
    public class TagAssignment
    {
        public int TransactionId { get; set; }
        public string TagName { get; set; }

        public override bool Equals(object obj)
        {
            var other = obj as TagAssignment;

            return other != null ? other.TransactionId == TransactionId && other.TagName == TagName : false;
        }

        public override int GetHashCode()
        {
            var hashCode = -805798031;
            hashCode = hashCode * -1521134295 + TransactionId.GetHashCode();
            hashCode = hashCode * -1521134295 + TagName.GetHashCode();
            return hashCode;
        }
    }
}
