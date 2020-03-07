using System.Threading.Tasks;
using Analyst.Core.Models;
using Analyst.Core.Services;
using Analyst.Core.Services.Abstract;
using Microsoft.AspNetCore.Mvc;

namespace Analyst.Web.Controllers
{
    [ApiController]
    [Route("api/accounts")]
    public class AccountsController : Controller
    {
        private readonly IStore<Account> accountStore;
        private readonly AccountService accountService;

        public AccountsController(IStore<Account> accountStore, AccountService accountService)
        {
            this.accountStore = accountStore;
            this.accountService = accountService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAccounts()
        {
            return Ok(await accountStore.Query(q => q));
        }

        [HttpPut("{accountNumber}")]
        public async Task<IActionResult> ChangeAccountName(string accountNumber, string name)
        {
            await accountService.ChangeName(accountNumber, name);

            return Ok();
        }
    }
}
