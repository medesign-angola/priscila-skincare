using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260917091000_AddIntegrationInboxOutbox")]
public partial class AddIntegrationInboxOutbox : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "integration_inbox",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false),
                type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                processed_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_integration_inbox", x => x.Id));

        migrationBuilder.CreateTable(
            name: "integration_outbox",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "char(36)", nullable: false),
                type = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                destination = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                payload = table.Column<string>(type: "longtext", nullable: false),
                status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                attempts = table.Column<int>(type: "int", nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                next_attempt_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                published_at = table.Column<DateTimeOffset>(type: "datetime", nullable: true),
                last_error = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
            },
            constraints: table => table.PrimaryKey("PK_integration_outbox", x => x.Id));

        migrationBuilder.CreateIndex("IX_integration_outbox_status_next_attempt_at",
            "integration_outbox", new[] { "status", "next_attempt_at" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("integration_inbox");
        migrationBuilder.DropTable("integration_outbox");
    }
}
