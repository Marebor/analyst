using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.DomainMessages
{
    public class MessageBus
    {
        Func<Type, IEnumerable<IHandle>> handlersFactory;

        public MessageBus(Func<Type, IEnumerable<IHandle>> handlersFactory)
        {
            this.handlersFactory = handlersFactory;
        }

        public async Task Publish<T>(T @event)
        {
            var handlers = handlersFactory(typeof(T))
                .Cast<IHandle<T>>();

            foreach (var handler in handlers)
            {
                try
                {
                    await handler.Handle(@event);
                }
                catch (Exception ex)
                {
                    // TODO: log? ignore? fail?
                }
            }
        }
    }
}
