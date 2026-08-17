using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSimulatedCommerceFlow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_shopping_cart_items_cart_id",
                table: "shopping_cart_items",
                column: "cart_id");

            migrationBuilder.DropIndex(
                name: "IX_shopping_cart_items_cart_id_product_sku_variant_id",
                table: "shopping_cart_items");

            migrationBuilder.RenameColumn(name: "product_sku", table: "shopping_cart_items", newName: "item_reference");
            migrationBuilder.RenameColumn(name: "product_sku", table: "order_items", newName: "item_reference");
            migrationBuilder.AlterColumn<string>(name: "item_reference", table: "shopping_cart_items", type: "varchar(100)", maxLength: 100, nullable: false, oldClrType: typeof(string), oldType: "varchar(64)", oldMaxLength: 64);
            migrationBuilder.AlterColumn<string>(name: "item_reference", table: "order_items", type: "varchar(100)", maxLength: 100, nullable: false, oldClrType: typeof(string), oldType: "varchar(64)", oldMaxLength: 64);

            migrationBuilder.AddColumn<string>(
                name: "item_type",
                table: "shopping_cart_items",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Product");

            migrationBuilder.AddColumn<string>(
                name: "item_type",
                table: "order_items",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Product");

            migrationBuilder.CreateTable(
                name: "payments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    order_id = table.Column<Guid>(type: "char(36)", nullable: false),
                    provider = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false),
                    reference = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    currency = table.Column<string>(type: "varchar(3)", maxLength: 3, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payments", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "stock_movements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    order_id = table.Column<Guid>(type: "char(36)", nullable: false),
                    product_sku = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false),
                    quantity = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<string>(type: "varchar(10)", maxLength: 10, nullable: false),
                    occurred_at = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stock_movements", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_cart_items_cart_id_item_type_item_reference_variant~",
                table: "shopping_cart_items",
                columns: new[] { "cart_id", "item_type", "item_reference", "variant_id" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_shopping_cart_items_cart_id",
                table: "shopping_cart_items");

            migrationBuilder.CreateIndex(
                name: "IX_payments_order_id",
                table: "payments",
                column: "order_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_payments_reference",
                table: "payments",
                column: "reference",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_order_id_product_sku_type",
                table: "stock_movements",
                columns: new[] { "order_id", "product_sku", "type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_stock_movements_product_sku",
                table: "stock_movements",
                column: "product_sku");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_shopping_cart_items_cart_id",
                table: "shopping_cart_items",
                column: "cart_id");
            migrationBuilder.DropTable(
                name: "payments");

            migrationBuilder.DropTable(
                name: "stock_movements");

            migrationBuilder.DropIndex(
                name: "IX_shopping_cart_items_cart_id_item_type_item_reference_variant~",
                table: "shopping_cart_items");

            migrationBuilder.AlterColumn<string>(name: "item_reference", table: "shopping_cart_items", type: "varchar(64)", maxLength: 64, nullable: false, oldClrType: typeof(string), oldType: "varchar(100)", oldMaxLength: 100);
            migrationBuilder.RenameColumn(name: "item_reference", table: "shopping_cart_items", newName: "product_sku");

            migrationBuilder.DropColumn(
                name: "item_type",
                table: "shopping_cart_items");

            migrationBuilder.AlterColumn<string>(name: "item_reference", table: "order_items", type: "varchar(64)", maxLength: 64, nullable: false, oldClrType: typeof(string), oldType: "varchar(100)", oldMaxLength: 100);
            migrationBuilder.RenameColumn(name: "item_reference", table: "order_items", newName: "product_sku");

            migrationBuilder.DropColumn(
                name: "item_type",
                table: "order_items");

            migrationBuilder.CreateIndex(
                name: "IX_shopping_cart_items_cart_id_product_sku_variant_id",
                table: "shopping_cart_items",
                columns: new[] { "cart_id", "product_sku", "variant_id" },
                unique: true);

            migrationBuilder.DropIndex(
                name: "IX_shopping_cart_items_cart_id",
                table: "shopping_cart_items");
        }
    }
}
