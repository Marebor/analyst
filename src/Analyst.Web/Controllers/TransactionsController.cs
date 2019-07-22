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
        private readonly TransactionService transactionService;
        private readonly IStore<Transaction> transactionStore;
        private readonly IStore<Tag> tagStore;

        public TransactionsController(TransactionService transactionService, IStore<Transaction> transactionStore, IStore<Tag> tagStore)
        {
            this.transactionService = transactionService;
            this.transactionStore = transactionStore;
            this.tagStore = tagStore;
        }

        [HttpGet]
        public async Task<IActionResult> GetFilteredTransactions(DateTime? dateFrom, DateTime? dateTo, string type, string description, decimal? amountFrom, decimal? amountTo)
        {
            return Ok(await transactionStore.Query(q =>
            {
                if (dateFrom.HasValue)
                    q = q.Where(x => x.OrderDate >= dateFrom.Value);
                if (dateTo.HasValue)
                    q = q.Where(x => x.OrderDate <= dateTo.Value);
                if (!string.IsNullOrEmpty(type))
                    q = q.Where(x => x.Type.Contains(type, StringComparison.InvariantCultureIgnoreCase));
                if (!string.IsNullOrEmpty(description))
                    q = q.Where(x => x.Description.Contains(description, StringComparison.InvariantCultureIgnoreCase));
                if (amountFrom.HasValue)
                    q = q.Where(x => x.Amount >= amountFrom.Value);
                if (amountTo.HasValue)
                    q = q.Where(x => x.Amount <= amountTo.Value);

                return q.OrderByDescending(x => x.OrderDate);
            }));
        }

        [HttpPost("xml")]
        public async Task<IActionResult> LoadFromXml()
        {
            Stream file = Request.Form.Files.First().OpenReadStream();
            IEnumerable<Transaction> newTransactions = await transactionService.SaveTransactionsFromXml(file);

            return Ok(newTransactions);
        }

        [HttpPost("{transactionId}/tags")]
        public async Task<IActionResult> AddTag(int transactionId, [FromBody]string tagName)
        {
            await transactionService.AddTagToTransaction(transactionId, tagName);

            return Ok();
        }

        [HttpDelete("{transactionId}/tags/{tagName}")]
        public async Task<IActionResult> RemoveTag(int transactionId, string tagName)
        {
            await transactionService.RemoveTagFromTransaction(tagName, transactionId);

            return Ok();
        }

        [HttpPost("{transactionId}/ignored")]
        public async Task<IActionResult> SetIgnored(int transactionId, [FromBody]bool value)
        {
            await transactionService.SetIgnoredValue(transactionId, value);

            return Ok();
        }
    }
}
