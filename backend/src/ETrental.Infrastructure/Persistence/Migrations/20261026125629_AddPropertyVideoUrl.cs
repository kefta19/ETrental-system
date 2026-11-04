using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETrental.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyVideoUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "VideoUrl",
                table: "Properties",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VideoUrl",
                table: "Properties");
        }
    }
}
