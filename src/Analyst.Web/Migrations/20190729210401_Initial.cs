using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Analyst.Web.Migrations
{
    public partial class Initial : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Filters",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    TagNamesIfTrue = table.Column<string>(nullable: true),
                    Expression = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Filters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TagAssignments",
                columns: table => new
                {
                    TransactionId = table.Column<int>(nullable: false),
                    TagName = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagAssignments", x => new { x.TagName, x.TransactionId });
                });

            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Name = table.Column<string>(nullable: false),
                    Color = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Name);
                });

            migrationBuilder.CreateTable(
                name: "TagSuppressions",
                columns: table => new
                {
                    TransactionId = table.Column<int>(nullable: false),
                    TagName = table.Column<string>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TagSuppressions", x => new { x.TagName, x.TransactionId });
                });

            migrationBuilder.CreateTable(
                name: "Transactions",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    OrderDate = table.Column<DateTime>(nullable: false),
                    ExecutionDate = table.Column<DateTime>(nullable: false),
                    Type = table.Column<string>(nullable: true),
                    Description = table.Column<string>(nullable: true),
                    Amount = table.Column<decimal>(nullable: false),
                    EndingBalance = table.Column<decimal>(nullable: false),
                    Ignored = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Transactions", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Filters");

            migrationBuilder.DropTable(
                name: "TagAssignments");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "TagSuppressions");

            migrationBuilder.DropTable(
                name: "Transactions");
        }
    }
}
