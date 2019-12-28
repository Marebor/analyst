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

        public TransactionsController(BrowsingService browsingService, TransactionService transactionService, IStore<Transaction> transactionStore)
        {
            this.browsingService = browsingService;
            this.transactionService = transactionService;
            this.transactionStore = transactionStore;
        }

        [HttpGet("browse")]
        public async Task<IActionResult> BrowseTransactions(DateTime? dateFrom, DateTime? dateTo)
        {
            var startDate = dateFrom.HasValue ? dateFrom.Value : DateTime.Today.AddDays(-14);
            var endDate = dateTo.HasValue ? dateTo.Value : DateTime.Today;

            var transactions = await transactionStore.Query(q => q
                .Where(t => t.OrderDate >= startDate && t.OrderDate <= endDate)
                .OrderByDescending(t => t.OrderDate));

            return Ok(await browsingService.Browse(transactions));
        }

        [HttpPost("xml")]
        public async Task<IActionResult> LoadFromXml()
        {
            Stream file = Request.Form.Files.First().OpenReadStream();
            IEnumerable<Transaction> newTransactions = await transactionService.SaveTransactionsFromXml(file);

            return Ok(await browsingService.Browse(newTransactions));
        }

        [HttpPost("{transactionId}/tags")]
        public async Task<IActionResult> AddTag(int transactionId, [FromBody] string tagName)
        {
            await transactionService.AddTagToTransaction(transactionId, tagName);

            return Ok();
        }

        [HttpPost("{transactionId}/comment")]
        public async Task<IActionResult> EditComment(int transactionId, [FromBody] string text)
        {
            await transactionService.EditComment(transactionId, text);

            return Ok();
        }

        [HttpPut("{transactionId}/ignored")]
        public async Task<IActionResult> SetIgnoredValue(int transactionId, [FromBody] bool newValue)
        {
            await transactionService.SetIgnoredValue(transactionId, newValue);

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
