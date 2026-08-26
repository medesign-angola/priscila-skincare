using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderEmailOutbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "email_outbox",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    kind = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false),
                    aggregate_id = table.Column<Guid>(type: "char(36)", nullable: false),
                    recipient = table.Column<string>(type: "varchar(320)", maxLength: 320, nullable: false),
                    payload = table.Column<string>(type: "longtext", nullable: false),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    attempts = table.Column<int>(type: "int", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    next_attempt_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    sent_at = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                    last_error = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_outbox", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_email_outbox_kind_aggregate_id",
                table: "email_outbox",
                columns: new[] { "kind", "aggregate_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_email_outbox_status_next_attempt_at",
                table: "email_outbox",
                columns: new[] { "status", "next_attempt_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "email_outbox");
        }
    }
}
