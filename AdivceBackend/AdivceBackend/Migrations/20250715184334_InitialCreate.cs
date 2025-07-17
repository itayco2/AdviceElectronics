using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AdivceBackend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    PasswordHash = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    PasswordSalt = table.Column<byte[]>(type: "varbinary(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Buildings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    NumberOfFloors = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Buildings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Buildings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ElevatorCalls",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RequestedFloor = table.Column<int>(type: "int", nullable: false),
                    DestinationFloor = table.Column<int>(type: "int", nullable: true),
                    CallTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletionTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsHandled = table.Column<bool>(type: "bit", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    PassengerCount = table.Column<int>(type: "int", nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElevatorCalls", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ElevatorCalls_Buildings_BuildingId",
                        column: x => x.BuildingId,
                        principalTable: "Buildings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Elevators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BuildingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CurrentFloor = table.Column<int>(type: "int", nullable: false),
                    MinFloor = table.Column<int>(type: "int", nullable: false),
                    MaxFloor = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DoorStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DoorOpenTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    CurrentLoad = table.Column<int>(type: "int", nullable: false),
                    TotalDistance = table.Column<double>(type: "float", nullable: false),
                    LastMaintenanceDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsExpress = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Elevators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Elevators_Buildings_BuildingId",
                        column: x => x.BuildingId,
                        principalTable: "Buildings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ElevatorCallAssignments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ElevatorId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ElevatorCallId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignmentTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PickupTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DropoffTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ElevatorCallAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ElevatorCallAssignments_ElevatorCalls_ElevatorCallId",
                        column: x => x.ElevatorCallId,
                        principalTable: "ElevatorCalls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ElevatorCallAssignments_Elevators_ElevatorId",
                        column: x => x.ElevatorId,
                        principalTable: "Elevators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Buildings_UserId",
                table: "Buildings",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ElevatorCallAssignments_ElevatorCallId",
                table: "ElevatorCallAssignments",
                column: "ElevatorCallId");

            migrationBuilder.CreateIndex(
                name: "IX_ElevatorCallAssignments_ElevatorId",
                table: "ElevatorCallAssignments",
                column: "ElevatorId");

            migrationBuilder.CreateIndex(
                name: "IX_ElevatorCalls_BuildingId",
                table: "ElevatorCalls",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Elevators_BuildingId",
                table: "Elevators",
                column: "BuildingId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ElevatorCallAssignments");

            migrationBuilder.DropTable(
                name: "ElevatorCalls");

            migrationBuilder.DropTable(
                name: "Elevators");

            migrationBuilder.DropTable(
                name: "Buildings");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
