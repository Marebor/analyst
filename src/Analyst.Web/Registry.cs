using Analyst.Core.DomainMessages;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;

namespace Analyst.Web
{
    public static class Registry
    {
        public static IServiceCollection AddHandlersFactory(this IServiceCollection services)
        {
            services.AddScoped(sp =>
            {
                Func<Type, IEnumerable<IHandle>> handlersFactory = type =>
                {
                    var handlerType = typeof(IHandle<>).MakeGenericType(type);

                    var handlers = sp.GetServices(handlerType);

                    return handlers.Cast<IHandle>();
                };

                return handlersFactory;
            });

            return services;
        }

        public static IServiceCollection AddMessageHandlers(this IServiceCollection services)
        {
            var analystAssemblies = AppDomain.CurrentDomain.GetAssemblies().Where(a => a.FullName.Contains(nameof(Analyst)));

            foreach (var assembly in analystAssemblies)
            {
                var handlersTypesMapping = assembly
                    .GetTypes()
                    .Where(t => t.IsClass)
                    .Where(t => typeof(IHandle).IsAssignableFrom(t))
                    .Select(t => (
                        Type: t,
                        HandledMessages: t.GetInterfaces()
                            .Where(i => typeof(IHandle).IsAssignableFrom(i))
                            .Where(i => i.IsGenericType)
                            .Select(i => i.GetGenericArguments().Single())));

                foreach (var typeMapping in handlersTypesMapping)
                {
                    foreach (var messageType in typeMapping.HandledMessages)
                    {
                        var handlerType = typeof(IHandle<>).MakeGenericType(messageType);

                        services.AddScoped(handlerType, typeMapping.Type);
                    }
                }
            }

            return services;
        }
    }
}
