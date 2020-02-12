using System.Threading.Tasks;

namespace Analyst.Core.DomainMessages
{
    public interface IHandle
    {
    }

    public interface IHandle<T> : IHandle
    {
        Task Handle(T message);
    }
}
