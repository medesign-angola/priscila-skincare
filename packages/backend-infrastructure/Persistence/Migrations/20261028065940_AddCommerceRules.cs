using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommerceRules : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "delivery_rate_id",
                table: "orders",
                type: "char(36)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "discount",
                table: "orders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "promotion_name",
                table: "orders",
                type: "varchar(160)",
                maxLength: 160,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "delivery_rates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Name = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    Country = table.Column<string>(type: "varchar(80)", maxLength: 80, nullable: false),
                    Province = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    Carrier = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Service = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Currency = table.Column<string>(type: "varchar(3)", maxLength: 3, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MinimumDays = table.Column<int>(type: "int", nullable: false),
                    MaximumDays = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Version = table.Column<Guid>(type: "char(36)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_rates", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "promotions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    Name = table.Column<string>(type: "varchar(160)", maxLength: 160, nullable: false),
                    Coupon = table.Column<string>(type: "varchar(60)", maxLength: 60, nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    StartsAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    EndsAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    Benefit = table.Column<int>(type: "int", nullable: false),
                    Value = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "varchar(3)", maxLength: 3, nullable: false),
                    MinimumSubtotal = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MaximumUses = table.Column<int>(type: "int", nullable: true),
                    MaximumUsesPerCustomer = table.Column<int>(type: "int", nullable: true),
                    FirstPurchaseOnly = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ItemReference = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    ItemType = table.Column<int>(type: "int", nullable: true),
                    Version = table.Column<Guid>(type: "char(36)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promotions", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "promotion_usage",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    PromotionId = table.Column<Guid>(type: "char(36)", nullable: false),
                    OrderId = table.Column<Guid>(type: "char(36)", nullable: false),
                    CustomerId = table.Column<Guid>(type: "char(36)", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "datetime", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_promotion_usage", x => x.Id);
                    table.ForeignKey(
                        name: "FK_promotion_usage_promotions_PromotionId",
                        column: x => x.PromotionId,
                        principalTable: "promotions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_promotion_usage_OrderId",
                table: "promotion_usage",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_promotion_usage_PromotionId_CustomerId",
                table: "promotion_usage",
                columns: new[] { "PromotionId", "CustomerId" });

            migrationBuilder.CreateIndex(
                name: "IX_promotions_Coupon",
                table: "promotions",
                column: "Coupon",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "delivery_rates");

            migrationBuilder.DropTable(
                name: "promotion_usage");

            migrationBuilder.DropTable(
                name: "promotions");

            migrationBuilder.DropColumn(
                name: "delivery_rate_id",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "discount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "promotion_name",
                table: "orders");
        }
    }
}
