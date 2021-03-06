﻿using Analyst.Core.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;

namespace Analyst.Web.Infrastructure
{
    public class AnalystDbContext : DbContext
    {
        public DbSet<TransactionsUpload> TransactionsUploads { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Filter> Filters { get; set; }
        public DbSet<TagAssignment> TagAssignments { get; set; }
        public DbSet<TagSuppression> TagSuppressions { get; set; }
        public DbSet<Comment> Comments { get; set; }
        [Obsolete]
        public DbSet<TransactionIgnore> IgnoredTransactions { get; set; }
        public DbSet<Account> Accounts { get; set; }

        public AnalystDbContext(DbContextOptions options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Transaction>().ToTable("Transactions");
            modelBuilder.Entity<Transaction>().Property(x => x.Id).ValueGeneratedOnAdd();

            modelBuilder.Entity<TransactionsUpload>().ToTable("TransactionsUploads");
            modelBuilder.Entity<TransactionsUpload>().HasKey(x => x.Id);
            modelBuilder.Entity<TransactionsUpload>().Property(x => x.TransactionsIds).HasConversion(
                x => string.Join(';', x.ToArray()),
                x => x.Split(';', StringSplitOptions.None).Select(y => int.Parse(y)).ToList());

            modelBuilder.Entity<Tag>().ToTable("Tags");
            modelBuilder.Entity<Tag>().HasKey(x => x.Name);

            modelBuilder.Entity<Filter>().ToTable("Filters");
            modelBuilder.Entity<Filter>().Property(x => x.Id).ValueGeneratedOnAdd();
            modelBuilder.Entity<Filter>().Property(x => x.TagNamesIfTrue).HasConversion(
                x => string.Join(';', x.ToArray()),
                x => x.Split(';', StringSplitOptions.None).ToList());
            modelBuilder.Entity<Filter>().Property(x => x.Keywords).HasConversion(
                x => string.Join(';', x.ToArray()),
                x => x.Split(';', StringSplitOptions.None).ToList());

            modelBuilder.Entity<TagAssignment>().ToTable("TagAssignments");
            modelBuilder.Entity<TagAssignment>().HasKey(x => new { x.TagName, x.TransactionId });

            modelBuilder.Entity<TagSuppression>().ToTable("TagSuppressions");
            modelBuilder.Entity<TagSuppression>().HasKey(x => new { x.TagName, x.TransactionId });

            modelBuilder.Entity<Comment>().ToTable("Comments");
            modelBuilder.Entity<Comment>().HasKey(x => new { x.TransactionId });

            modelBuilder.Entity<TransactionIgnore>().ToTable("IgnoredTransactions");
            modelBuilder.Entity<TransactionIgnore>().HasKey(x => new { x.TransactionId });

            modelBuilder.Entity<Account>().ToTable("Accounts");
            modelBuilder.Entity<Account>().HasKey(x => new { x.Number });
        }
    }
}
