using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [ApiController]
    [Route("api/transactions")]
    public class TransactionsController : Controller
    {
        private readonly BrowsingService browsingService;
        private readonly TransactionService transactionService;
        private readonly IStore<Transaction> transactionStore;
        private readonly IStore<Tag> tagStore;

        public TransactionsController(BrowsingService browsingService, TransactionService transactionService, IStore<Transaction> transactionStore, IStore<Tag> tagStore)
        {
            this.browsingService = browsingService;
            this.transactionService = transactionService;
            this.transactionStore = transactionStore;
            this.tagStore = tagStore;
        }

        [HttpGet]
        public async Task<IActionResult> GetTransactions([FromQuery] IEnumerable<int> transactionIds)
        {
            return Ok(await transactionStore.Query(q => transactionIds.Any() ? q.Where(t => transactionIds.Contains(t.Id)) : q));
        }

        [HttpGet("browse")]
        public async Task<IActionResult> BrowseTransactions(DateTime? dateFrom, DateTime? dateTo)
        {
            return Ok(await browsingService.Browse(dateFrom.HasValue ? dateFrom.Value : DateTime.Today.AddDays(-14), dateTo.HasValue ? dateTo.Value : DateTime.Today));
        }

        [HttpPost("xml")]
        public async Task<IActionResult> LoadFromXml()
        {
            Stream file = Request.Form.Files.First().OpenReadStream();
            IEnumerable<Transaction> newTransactions = await transactionService.SaveTransactionsFromXml(file);

            return Ok(newTransactions);
        }

        [HttpPost("{transactionId}/tags")]
        public async Task<IActionResult> AddTag(int transactionId, [FromBody] string tagName)
        {
            await transactionService.AddTagToTransaction(transactionId, tagName);

            return Ok();
        }

        [HttpDelete("{transactionId}/tags/{tagName}")]
        public async Task<IActionResult> RemoveTag(int transactionId, string tagName)
        {
            await transactionService.RemoveTagFromTransaction(transactionId, tagName);

            return Ok();
        }
    }
}
