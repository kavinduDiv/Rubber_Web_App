const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setup() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || '127.0.0.1',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
        });

        console.log('Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE || 'rubber_db'}\``);
        console.log(`Database '${process.env.MYSQL_DATABASE || 'rubber_db'}' created or exists.`);

        await connection.end();

        // Now create tables
        const dbConnection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || '127.0.0.1',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'rubber_db'
        });

        await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS trees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255) UNIQUE,
        lat DOUBLE,
        lng DOUBLE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255),
        cuts INT,
        milk_amount FLOAT,
        timestamp DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        console.log('Tables created successfully.');
        await dbConnection.end();

    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}

setup();
