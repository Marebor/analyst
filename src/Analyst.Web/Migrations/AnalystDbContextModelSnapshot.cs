﻿// <auto-generated />
using System;
using Analyst.Web.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Analyst.Web.Migrations
{
    [DbContext(typeof(AnalystDbContext))]
    partial class AnalystDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "2.1.4-rtm-31024");

            modelBuilder.Entity("Analyst.Core.Models.Filter", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("Keywords");

                    b.Property<string>("TagNamesIfTrue");

                    b.HasKey("Id");

                    b.ToTable("Filters");
                });

            modelBuilder.Entity("Analyst.Core.Models.Tag", b =>
                {
                    b.Property<string>("Name")
                        .ValueGeneratedOnAdd();

                    b.Property<string>("Color");

                    b.HasKey("Name");

                    b.ToTable("Tags");
                });

            modelBuilder.Entity("Analyst.Core.Models.TagAssignment", b =>
                {
                    b.Property<string>("TagName");

                    b.Property<int>("TransactionId");

                    b.HasKey("TagName", "TransactionId");

                    b.ToTable("TagAssignments");
                });

            modelBuilder.Entity("Analyst.Core.Models.TagSuppression", b =>
                {
                    b.Property<string>("TagName");

                    b.Property<int>("TransactionId");

                    b.HasKey("TagName", "TransactionId");

                    b.ToTable("TagSuppressions");
                });

            modelBuilder.Entity("Analyst.Core.Models.Transaction", b =>
                {
                    b.Property<int>("Id")
                        .ValueGeneratedOnAdd();

                    b.Property<decimal>("Amount");

                    b.Property<string>("Description");

                    b.Property<decimal>("EndingBalance");

                    b.Property<DateTime>("ExecutionDate");

                    b.Property<bool>("Ignored");

                    b.Property<DateTime>("OrderDate");

                    b.Property<string>("Type");

                    b.HasKey("Id");

                    b.ToTable("Transactions");
                });
#pragma warning restore 612, 618
        }
    }
}
