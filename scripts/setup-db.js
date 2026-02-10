const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function setup() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: Number(process.env.MYSQL_PORT), 
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 10000,
    });

    console.log("Connected to Railway MySQL");

    await connection.query(`
      CREATE TABLE IF NOT EXISTS trees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255) UNIQUE,
        lat DOUBLE,
        lng DOUBLE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255),
        cuts INT,
        milk_amount FLOAT,
        timestamp DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("Tables created successfully.");
    await connection.end();
  } catch (error) {
    console.error("Setup failed:", error);
  }
}

setup();
