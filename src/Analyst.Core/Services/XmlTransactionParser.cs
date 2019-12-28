using Analyst.Core.Models;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Xml.Linq;

namespace Analyst.Core.Services
{
    public class XmlTransactionParser
    {
        internal static IEnumerable<Transaction> GetTransactions(Stream stream)
        {
            XDocument xml = XDocument.Load(stream);

            var accountNumber = xml.Root.Element("search").Element("account").Value;
            var xmlTransactions = xml.Root.Element("operations").Elements("operation");

            foreach (var xmlTransaction in xmlTransactions)
            {
                yield return new Transaction
                {
                    AccountNumber = accountNumber,
                    OrderDate = DateTime.Parse(xmlTransaction.Element("order-date").Value, CultureInfo.InvariantCulture),
                    ExecutionDate = DateTime.Parse(xmlTransaction.Element("exec-date").Value, CultureInfo.InvariantCulture),
                    Type = xmlTransaction.Element("type").Value,
                    Description = xmlTransaction.Element("description").Value,
                    Amount = decimal.Parse(xmlTransaction.Element("amount").Value.Replace(',', '.'), CultureInfo.InvariantCulture),
                    EndingBalance = decimal.Parse(xmlTransaction.Element("ending-balance").Value.Replace(',', '.'), CultureInfo.InvariantCulture),
                };
            }
        }
    }
}
