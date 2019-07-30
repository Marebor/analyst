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

            services.AddDbContext<AnalystDbContext>((System.IServiceProvider sp, DbContextOptionsBuilder builder) =>
            {
                IHostingEnvironment env = sp.GetRequiredService<IHostingEnvironment>();
                builder.UseSqlite(Configuration.GetConnectionString("Sqlite").Replace("[ROOT]", env.ContentRootPath));
            });
            services.AddScoped<IStore<Transaction>, Store>();
            services.AddScoped<IStore<Tag>, Store>();
            services.AddScoped<IStore<Filter>, Store>();
            services.AddScoped<IStore<TagAssignment>, Store>();
            services.AddScoped<IStore<TagSuppression>, Store>();
            services.AddScoped<TransactionService>();
            services.AddScoped<TagService>();
            services.AddScoped<FilterService>();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, AnalystDbContext store)
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

            store.Database.Migrate();
        }
    }
}
