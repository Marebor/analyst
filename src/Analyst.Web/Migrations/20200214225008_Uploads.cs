using Microsoft.EntityFrameworkCore.Migrations;

namespace Analyst.Web.Migrations
{
    public partial class Uploads : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TransactionsUploads",
                columns: table => new
                {
                    Id = table.Column<string>(nullable: false),
                    TransactionsIds = table.Column<string>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionsUploads", x => x.Id);
                });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransactionsUploads");
        }
    }
}
