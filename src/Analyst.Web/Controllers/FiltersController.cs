using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [ApiController]
    [Route("api/filters")]
    public class FiltersController : Controller
    {
        private readonly IStore<Filter> filterStore;
        private readonly FilterService filterService;

        public FiltersController(IStore<Filter> filterStore, FilterService filterService)
        {
            this.filterStore = filterStore;
            this.filterService = filterService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFilters()
        {
            return Ok(await filterStore.Query(q => q));
        }

        [HttpPost]
        public async Task<IActionResult> CreateFilter(Filter filter)
        {
            return Ok(await filterService.CreateFilter(filter));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> EditFilter(int id, Filter filter)
        {
            await filterService.EditFilter(id, filter);

            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFilter(int id)
        {
            await filterService.DeleteFilter(id);

            return Ok();
        }
    }
}
