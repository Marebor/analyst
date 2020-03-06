using Analyst.Core.DomainMessages;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Analyst.Web.Infrastructure;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Analyst.Web
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_1);

            // In production, the Angular files will be served from this directory
            services.AddSpaStaticFiles(configuration =>
            {
                configuration.RootPath = "ClientApp/dist";
            });

            services.AddDbContext<AnalystDbContext>((IServiceProvider sp, DbContextOptionsBuilder builder) =>
            {
                IHostingEnvironment env = sp.GetRequiredService<IHostingEnvironment>();
                builder.UseSqlite(Configuration.GetConnectionString("Sqlite").Replace("[ROOT]", env.ContentRootPath));
            });
            services.AddScoped<IStore<Transaction>, Store>();
            services.AddScoped<IStore<TransactionsUpload>, Store>();
            services.AddScoped<IStore<Tag>, Store>();
            services.AddScoped<IStore<Filter>, Store>();
            services.AddScoped<IStore<TagAssignment>, Store>();
            services.AddScoped<IStore<TagSuppression>, Store>();
            services.AddScoped<IStore<Comment>, Store>();
            services.AddScoped<IStore<TransactionIgnore>, Store>();
            services.AddScoped<IStore<Account>, Store>();
            services.AddScoped<MessageBus>();
            services.AddHandlersFactory();
            services.AddMessageHandlers();
            services.AddScoped<BrowsingService>();
            services.AddScoped<TransactionService>();
            services.AddScoped<TagService>();
            services.AddScoped<FilterService>();

            services.AddLogging();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, IServiceProvider serviceProvider)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Error");
            }

            app.UseStaticFiles();
            app.UseSpaStaticFiles();

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller}/{action=Index}/{id?}");
            });

            app.UseSpa(spa =>
            {
                // To learn more about options for serving an Angular SPA from ASP.NET Core,
                // see https://go.microsoft.com/fwlink/?linkid=864501

                spa.Options.SourcePath = "ClientApp";

                if (env.IsDevelopment())
                {
                    spa.UseAngularCliServer(npmScript: "start");
                }
            });

            var db = serviceProvider.GetRequiredService<AnalystDbContext>();
            db.Database.Migrate();

            if (bool.TryParse(Configuration["SeedDatabase"], out bool seed) && seed)
            {
                Seeder.SeedDb(db);
            }

            if (bool.TryParse(Configuration["MigrateTransactionIgnore"], out bool migrate) && migrate)
            {
                db.MigrateTransactionIgnore();
            }

            if (bool.TryParse(Configuration["AddAccountNumberToTransactionsIfEmpty"], out bool addAccountNumber) && addAccountNumber)
            {
                db.AddAccountNumberToTransactionsIfEmpty(Configuration["AccountNumber"]);
            }
        }
    }
}
