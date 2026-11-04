using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETrental.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidenceFileName",
                table: "PaymentTransactions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidenceFileName",
                table: "PaymentTransactions");
        }
    }
}
