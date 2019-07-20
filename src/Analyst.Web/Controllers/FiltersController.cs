using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [Route("api/filters")]
    public class FiltersController : Controller
    {
        private readonly IStore<Filter> filterStore;

        public FiltersController(IStore<Filter> filterStore)
        {
            this.filterStore = filterStore;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllFilters()
        {
            return Ok(await filterStore.Query(q => q));
        }
    }
}
