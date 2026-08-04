using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class IntegrateProductReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_sync_attempt_at",
                table: "reviews",
                type: "datetime",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "last_sync_error",
                table: "reviews",
                type: "varchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "recommends",
                table: "reviews",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "strapi_document_id",
                table: "reviews",
                type: "varchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "sync_status",
                table: "reviews",
                type: "varchar(24)",
                maxLength: 24,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "title",
                table: "reviews",
                type: "varchar(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "updated_at",
                table: "reviews",
                type: "datetime",
                nullable: true);

            migrationBuilder.Sql("UPDATE `reviews` SET `updated_at` = `created_at`, `sync_status` = 'Pending' WHERE `updated_at` IS NULL;");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "updated_at",
                table: "reviews",
                type: "datetime",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetime",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "last_sync_attempt_at",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "last_sync_error",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "recommends",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "strapi_document_id",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "sync_status",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "title",
                table: "reviews");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "reviews");
        }
    }
}
