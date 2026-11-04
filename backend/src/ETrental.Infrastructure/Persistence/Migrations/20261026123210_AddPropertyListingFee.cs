using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETrental.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyListingFee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ListingFeeAmountETB",
                table: "Properties",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ListingFeeProvider",
                table: "Properties",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingFeeReference",
                table: "Properties",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ListingFeeStatus",
                table: "Properties",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ListingFeeVerifiedAtUtc",
                table: "Properties",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ListingFeeVerifiedBy",
                table: "Properties",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ListingFeeAmountETB",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingFeeProvider",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingFeeReference",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingFeeStatus",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingFeeVerifiedAtUtc",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "ListingFeeVerifiedBy",
                table: "Properties");
        }
    }
}
