using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStockLocations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "stock_locations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "char(36)", nullable: false),
                    name = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    is_warehouse = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_active = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    pickup_enabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    country = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: true),
                    city = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    address = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    phone = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: true),
                    pickup_instructions = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true),
                    version = table.Column<Guid>(type: "char(36)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_locations", x => x.id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.InsertData(
                table: "stock_locations",
                columns: new[] { "id", "address", "city", "country", "is_active", "is_warehouse", "name", "phone", "pickup_enabled", "pickup_instructions", "version" },
                values: new object[] { new Guid("334a7da4-f292-48dc-a346-8ff03170fd0d"), null, null, null, true, true, "Armazém central", null, false, null, new Guid("4ce97c6f-9e27-4e42-8de3-0291556df489") });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "stock_locations");
        }
    }
}
