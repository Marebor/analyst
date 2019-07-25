using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [ApiController]
    [Route("api/tags")]
    public class TagsController : Controller
    {
        private readonly TagService tagService;
        private readonly IStore<Tag> tagStore;
        private readonly IStore<TagAssignment> tagAssignmentStore;
        private readonly IStore<TagSuppression> tagSuppressionStore;

        public TagsController(TagService tagService, IStore<Tag> tagStore, IStore<TagAssignment> tagAssignmentStore, 
            IStore<TagSuppression> tagSuppressionStore)
        {
            this.tagService = tagService;
            this.tagStore = tagStore;
            this.tagAssignmentStore = tagAssignmentStore;
            this.tagSuppressionStore = tagSuppressionStore;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTags()
        {
            return Ok(await tagStore.Query(q => q));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTag(Tag tag)
        {
            return Ok(await tagService.CreateTag(tag.Name, tag.Color));
        }

        [HttpDelete("{tagName}")]
        public async Task<IActionResult> DeleteTag(string tagName)
        {
            await tagService.DeleteTag(tagName);
            
            return Ok();
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAllTagsAssignments()
        {
            return Ok(await tagAssignmentStore.Query(q => q));
        }

        [HttpGet("suppressions")]
        public async Task<IActionResult> GetAllTagsSuppressions()
        {
            return Ok(await tagSuppressionStore.Query(q => q));
        }

        [HttpPost("{tagName}/color")]
        public async Task<IActionResult> ChangeTagColor(string tagName, [FromBody]string color)
        {
            await tagService.ChangeTagColor(tagName, color);

            return Ok();
        }

        [HttpPost("{tagName}/transactions")]
        public async Task<IActionResult> AddTransaction(string tagName, [FromBody]int transactionId)
        {
            await tagService.AddTransactionToTag(transactionId, tagName);

            return Ok();
        }

        [HttpDelete("{tagName}/transactions/{transactionId}")]
        public async Task<IActionResult> RemoveTransaction(int transactionId, string tagName)
        {
            await tagService.RemoveTransactionFromTag(transactionId, tagName);

            return Ok();
        }
    }
}
