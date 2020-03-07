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
        private readonly IStore<TransactionsUpload> uploadStore;

        public TransactionsController(BrowsingService browsingService, TransactionService transactionService, IStore<Transaction> transactionStore, IStore<TransactionsUpload> uploadStore)
        {
            this.browsingService = browsingService;
            this.transactionService = transactionService;
            this.transactionStore = transactionStore;
            this.uploadStore = uploadStore;
        }

        [HttpGet("upload/{uploadId}/browse")]
        public async Task<IActionResult> BrowseTransactionsFromUpload(string uploadId)
        {
            var transactionsIds = (await uploadStore.Query(q => q.Where(x => x.Id == uploadId))).SingleOrDefault()?.TransactionsIds;

            var transactions = await transactionStore.Query(q => q.Where(x => transactionsIds.Contains(x.Id)));

            return Ok(await browsingService.Browse(transactions));
        }

        [HttpGet("browse")]
        public async Task<IActionResult> BrowseTransactions(DateTime? dateFrom, DateTime? dateTo, string[] accountNumbers)
        {
            var startDate = dateFrom.HasValue ? dateFrom.Value : DateTime.Today.AddDays(-14);
            var endDate = dateTo.HasValue ? dateTo.Value : DateTime.Today;

            var transactions = await transactionStore.Query(q => q
                .Where(t => t.OrderDate >= startDate && t.OrderDate <= endDate)
                .Where(t => accountNumbers.Contains(t.AccountNumber))
                .OrderByDescending(t => t.OrderDate));

            return Ok(await browsingService.Browse(transactions));
        }

        [HttpPost("xml")]
        public async Task<IActionResult> LoadFromXml()
        {
            Stream file = Request.Form.Files.First().OpenReadStream();
            var uploadIdAndTransactions = await transactionService.SaveTransactionsFromXml(file);

            return Ok(new
            {
                uploadIdAndTransactions.UploadId,
                Data = await browsingService.Browse(uploadIdAndTransactions.Transactions)
            });
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
