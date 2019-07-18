using Analyst.Core.Models;
using System;
using System.Collections.Generic;
using System.IO;
using System.Xml.Linq;

namespace Analyst.Core.Services
{
    public class XmlTransactionParser
    {
        internal static IEnumerable<Transaction> GetTransactions(Stream stream)
        {
            XDocument xml = XDocument.Load(stream);

            var xmlTransactions = xml.Root.Element("operations").Elements("operation");

            foreach (var xmlTransaction in xmlTransactions)
            {
                yield return new Transaction
                {
                    OrderDate = DateTime.Parse(xmlTransaction.Element("order-date").Value),
                    ExecutionDate = DateTime.Parse(xmlTransaction.Element("exec-date").Value),
                    Type = xmlTransaction.Element("type").Value,
                    Description = xmlTransaction.Element("description").Value,
                    Amount = decimal.Parse(xmlTransaction.Element("amount").Value),
                    EndingBalance = decimal.Parse(xmlTransaction.Element("ending-balance").Value),
                };
            }
        }
    }
}
