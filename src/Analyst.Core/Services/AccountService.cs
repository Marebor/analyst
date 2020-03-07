using Analyst.Core.DomainMessages;
using Analyst.Core.Models;
using Analyst.Core.Services.Abstract;
using System.Linq;
using System.Threading.Tasks;

namespace Analyst.Core.Services
{
    public class AccountService :
        IHandle<TransactionsUploaded>
    {
        IStore<Account> accountStore;

        public AccountService(IStore<Account> accountStore)
        {
            this.accountStore = accountStore;
        }

        public async Task TryAddAccount(string number)
        {
            var accountExists = (await accountStore.Query(q => q.Where(a => a.Number == number))).Any();

            if (accountExists)
            {
                return;
            }

            await accountStore.Save(new Account { Number = number });
        }

        public async Task ChangeName(string number, string name)
        {
            var account = (await accountStore.Query(q => q.Where(a => a.Number == number))).SingleOrDefault();

            if (account is null)
            {
                throw new System.Exception($"Account with number {number} does not exist");
            }

            account.Name = name;

            await accountStore.Save(account);
        }

        async Task IHandle<TransactionsUploaded>.Handle(TransactionsUploaded message)
        {
            var accountsNumbers = message.Transactions.Select(t => t.AccountNumber).Distinct();

            foreach (var accountNumber in accountsNumbers)
            {
                await TryAddAccount(accountNumber);
            }
        }
    }
}
