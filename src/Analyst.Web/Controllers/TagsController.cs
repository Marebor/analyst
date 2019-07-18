using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [Route("api/tags")]
    public class TagsController : Controller
    {
        private readonly TagService tagService;
        private readonly IStore<Tag> tagStore;

        public TagsController(TagService tagService, IStore<Tag> tagStore)
        {
            this.tagService = tagService;
            this.tagStore = tagStore;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            return Ok(await tagStore.Query(q => q));
        }
        
        [HttpPost("{tagName}/color")]
        public async Task<IActionResult> ChangeTagColor(string tagName, [FromBody]string color)
        {
            await tagService.ChangeTagColor(tagName, color);

            return Ok();
        }
    }
}
