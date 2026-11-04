using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETrental.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveAgencyFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE TEMP TABLE "_AgencyUserIds" ON COMMIT DROP AS
                SELECT user_role."UserId"
                FROM "AspNetUserRoles" AS user_role
                INNER JOIN "AspNetRoles" AS role ON role."Id" = user_role."RoleId"
                WHERE role."Name" = 'Agency'
                UNION
                SELECT membership."UserId"
                FROM "AgencyMemberships" AS membership
                UNION
                SELECT assignment."UserId"
                FROM "AgencyPropertyAssignments" AS assignment;

                CREATE TEMP TABLE "_AgencyPropertyIds" ON COMMIT DROP AS
                SELECT property."Id"
                FROM "Properties" AS property
                WHERE property."AgencyId" IS NOT NULL
                   OR property."LandlordId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR property."AssignedAgentId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                UNION
                SELECT assignment."PropertyId"
                FROM "AgencyPropertyAssignments" AS assignment;

                UPDATE "SupportTickets"
                SET "Category" = 9
                WHERE "Category" = 2;

                DELETE FROM "RentalAgreements"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "LandlordId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR "RenterId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "RentalApplications"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "ApplicantId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "PropertyInquiries"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "RenterId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "ViewingAppointments"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "RenterId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "Favorites"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "ListingReviews"
                WHERE "PropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "ReviewerId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "UserReports"
                WHERE "ReportedPropertyId" IN (SELECT "Id" FROM "_AgencyPropertyIds")
                   OR "ReporterId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "UserReports"
                SET "ReportedUserId" = NULL,
                    "AssignedToId" = NULL
                WHERE "ReportedUserId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR "AssignedToId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "Properties"
                WHERE "Id" IN (SELECT "Id" FROM "_AgencyPropertyIds");

                UPDATE "Properties"
                SET "RentedToTenantId" = NULL,
                    "RentedToTenantName" = NULL
                WHERE "RentedToTenantId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "Properties"
                SET "ModeratedBy" = NULL,
                    "ListingFeeVerifiedBy" = NULL
                WHERE "ModeratedBy" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR "ListingFeeVerifiedBy" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "PaymentTransactions"
                SET "VerifiedBy" = NULL
                WHERE "VerifiedBy" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "PlatformSettings"
                SET "UpdatedBy" = NULL
                WHERE "UpdatedBy" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "AspNetUsers"
                SET "RestrictedBy" = NULL
                WHERE "RestrictedBy" IN (SELECT "UserId" FROM "_AgencyUserIds");

                UPDATE "SupportTickets"
                SET "AssignedAgentId" = NULL
                WHERE "AssignedAgentId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "SupportTicketMessages"
                WHERE "SenderId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "SupportTicketMessages"
                WHERE "TicketId" IN (
                    SELECT "Id" FROM "SupportTickets"
                    WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                );

                DELETE FROM "SupportTickets"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "PaymentTransactions"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "Subscriptions"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "AuditLogs"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR "EntityName" IN ('Agency', 'AgencyMembership', 'AgencyPropertyAssignment');

                DELETE FROM "Notifications"
                WHERE "Type" = 5
                   OR "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "SavedSearches"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "PasswordResetTokens"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "RenterProfiles"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "LandlordProfiles"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds");

                DELETE FROM "AspNetUserRoles"
                WHERE "UserId" IN (SELECT "UserId" FROM "_AgencyUserIds")
                   OR "RoleId" IN (SELECT "Id" FROM "AspNetRoles" WHERE "Name" = 'Agency');

                DELETE FROM "AspNetRoles"
                WHERE "Name" = 'Agency';

                DELETE FROM "AspNetUsers"
                WHERE "Id" IN (SELECT "UserId" FROM "_AgencyUserIds");
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Properties_Agencies_AgencyId",
                table: "Properties");

            migrationBuilder.DropForeignKey(
                name: "FK_Properties_AspNetUsers_AssignedAgentId",
                table: "Properties");

            migrationBuilder.DropTable(
                name: "AgencyMemberships");

            migrationBuilder.DropTable(
                name: "AgencyPropertyAssignments");

            migrationBuilder.DropTable(
                name: "Agencies");

            migrationBuilder.DropIndex(
                name: "IX_Properties_AgencyId",
                table: "Properties");

            migrationBuilder.DropIndex(
                name: "IX_Properties_AssignedAgentId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AgencyId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "AssignedAgentId",
                table: "Properties");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AgencyId",
                table: "Properties",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AssignedAgentId",
                table: "Properties",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Agencies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessLicenseNumber = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedBy = table.Column<string>(type: "text", nullable: true),
                    DeletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    LastModifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    OfficeAddress = table.Column<string>(type: "text", nullable: true),
                    OfficialEmail = table.Column<string>(type: "text", nullable: false),
                    OfficialPhone = table.Column<string>(type: "text", nullable: false),
                    RejectionReason = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    SubCity = table.Column<string>(type: "text", nullable: false),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    TaxIdentificationNumber = table.Column<string>(type: "text", nullable: false),
                    VerificationDocumentUrl = table.Column<string>(type: "text", nullable: true),
                    VerificationNotes = table.Column<string>(type: "text", nullable: true),
                    VerifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerifiedBy = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agencies", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AgencyMemberships",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    JoinedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgencyMemberships", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgencyMemberships_Agencies_AgencyId",
                        column: x => x.AgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgencyMemberships_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgencyPropertyAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    AgencyId = table.Column<Guid>(type: "uuid", nullable: false),
                    PropertyId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    AssignedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgencyPropertyAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgencyPropertyAssignments_Agencies_AgencyId",
                        column: x => x.AgencyId,
                        principalTable: "Agencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgencyPropertyAssignments_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgencyPropertyAssignments_Properties_PropertyId",
                        column: x => x.PropertyId,
                        principalTable: "Properties",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_AgencyId",
                table: "Properties",
                column: "AgencyId");

            migrationBuilder.CreateIndex(
                name: "IX_Properties_AssignedAgentId",
                table: "Properties",
                column: "AssignedAgentId");

            migrationBuilder.CreateIndex(
                name: "IX_AgencyMemberships_AgencyId_UserId",
                table: "AgencyMemberships",
                columns: new[] { "AgencyId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgencyMemberships_UserId",
                table: "AgencyMemberships",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgencyPropertyAssignments_AgencyId_UserId_PropertyId",
                table: "AgencyPropertyAssignments",
                columns: new[] { "AgencyId", "UserId", "PropertyId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgencyPropertyAssignments_PropertyId",
                table: "AgencyPropertyAssignments",
                column: "PropertyId");

            migrationBuilder.CreateIndex(
                name: "IX_AgencyPropertyAssignments_UserId",
                table: "AgencyPropertyAssignments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_Agencies_AgencyId",
                table: "Properties",
                column: "AgencyId",
                principalTable: "Agencies",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_AspNetUsers_AssignedAgentId",
                table: "Properties",
                column: "AssignedAgentId",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }
    }
}
