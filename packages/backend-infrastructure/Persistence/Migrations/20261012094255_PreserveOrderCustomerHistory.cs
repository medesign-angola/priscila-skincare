using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PreserveOrderCustomerHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "customer_account_deleted_at",
                table: "orders",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_email_snapshot",
                table: "orders",
                type: "varchar(320)",
                maxLength: 320,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "customer_name_snapshot",
                table: "orders",
                type: "varchar(160)",
                maxLength: 160,
                nullable: true);

            // Preenche o histórico das contas ainda ativas. Para perfis já
            // anonimizados não existe fonte legítima para reconstruir dados.
            migrationBuilder.Sql("""
                UPDATE orders AS o
                INNER JOIN customers AS c ON c.id = o.customer_id AND c.is_active = 1
                SET
                    o.customer_name_snapshot = COALESCE(NULLIF(TRIM(c.name), ''), o.recipient),
                    o.customer_email_snapshot = c.email
                WHERE o.customer_name_snapshot IS NULL OR o.customer_email_snapshot IS NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "customer_account_deleted_at",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "customer_email_snapshot",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "customer_name_snapshot",
                table: "orders");
        }
    }
}
