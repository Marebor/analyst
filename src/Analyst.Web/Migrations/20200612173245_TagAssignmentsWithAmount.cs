using Microsoft.EntityFrameworkCore.Migrations;

namespace Analyst.Web.Migrations
{
    public partial class TagAssignmentsWithAmount : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "TagAssignments",
                nullable: false,
                defaultValue: 0m);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amount",
                table: "TagAssignments");
        }
    }
}
