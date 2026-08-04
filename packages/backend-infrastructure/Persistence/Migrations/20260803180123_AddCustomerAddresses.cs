using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerAddresses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "customer_addresses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    customer_id = table.Column<Guid>(type: "char(36)", nullable: false),
                    label = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: false),
                    recipient = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    phone = table.Column<string>(type: "varchar(32)", maxLength: 32, nullable: false),
                    country = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false),
                    province = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    city = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    neighborhood = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: false),
                    street = table.Column<string>(type: "varchar(240)", maxLength: 240, nullable: false),
                    house_number = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: true),
                    apartment = table.Column<string>(type: "varchar(120)", maxLength: 120, nullable: true),
                    postal_code = table.Column<string>(type: "varchar(24)", maxLength: 24, nullable: true),
                    is_default = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_customer_addresses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_customer_addresses_customers_customer_id",
                        column: x => x.customer_id,
                        principalTable: "customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_customer_addresses_customer_id_is_default",
                table: "customer_addresses",
                columns: new[] { "customer_id", "is_default" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "customer_addresses");
        }
    }
}
