using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETrental.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddListingFeeTransactionUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ListingFeeTransactionUrl",
                table: "Properties",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ListingFeeTransactionUrl",
                table: "Properties");
        }
    }
}
