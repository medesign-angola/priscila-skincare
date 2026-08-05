using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PriscilaSkincare.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class TrackOtpDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "delivery_status",
                table: "otp_challenges",
                type: "varchar(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "sent_at",
                table: "otp_challenges",
                type: "datetime",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE otp_challenges SET delivery_status = 'Sent', sent_at = created_at");

            migrationBuilder.AlterColumn<string>(
                name: "delivery_status",
                table: "otp_challenges",
                type: "varchar(16)",
                maxLength: 16,
                nullable: false,
                defaultValue: "Pending",
                oldClrType: typeof(string),
                oldType: "varchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_otp_challenges_email_delivery_status_sent_at",
                table: "otp_challenges",
                columns: new[] { "email", "delivery_status", "sent_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_otp_challenges_email_delivery_status_sent_at",
                table: "otp_challenges");

            migrationBuilder.DropColumn(
                name: "delivery_status",
                table: "otp_challenges");

            migrationBuilder.DropColumn(
                name: "sent_at",
                table: "otp_challenges");
        }
    }
}
