const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

async function seedUsers() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const adminPassword = await bcrypt.hash("Admin123!", 12);
  const petugasPassword = await bcrypt.hash("Petugas123!", 12);

  await db.execute(
    `INSERT INTO users
    (name, username, password, role)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role)`,
    ["Administrator", "admin", adminPassword, "admin"]
  );

  await db.execute(
    `INSERT INTO users
    (name, username, password, role)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    password = VALUES(password),
    role = VALUES(role)`,
    ["Petugas Kasir", "petugas", petugasPassword, "petugas"]
  );

  console.log("User berhasil dibuat!");

  await db.end();
}

seedUsers().catch((error) => {
  console.error("Seed gagal:", error);
  process.exit(1);
});