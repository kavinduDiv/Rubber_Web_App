import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function ensureTables() {
    const connection = await pool.getConnection();
    try {
        // Modify tables to include new fields if they don't exist
        // For simplicity in this script, we just CREATE IF NOT EXISTS.
        // In a real migration, we'd alter.
        // Let's try to run ALTER statements safely (ignore if exists) or just rely on CREATE for fresh setup.
        // Given the prototype nature, I'll attempt to Create with new schema.

        await connection.query(`
      CREATE TABLE IF NOT EXISTS trees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255) UNIQUE,
        lat DOUBLE,
        lng DOUBLE,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await connection.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tree_id VARCHAR(255),
        cuts INT,
        milk_amount FLOAT,
        note TEXT,
        timestamp DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Attempt to add columns if they are missing (simple migration)
        try { await connection.query("ALTER TABLE trees ADD COLUMN note TEXT"); } catch (e) { }
        try { await connection.query("ALTER TABLE collections ADD COLUMN note TEXT"); } catch (e) { }

    } finally {
        connection.release();
    }
}

export async function POST(req: Request) {
    try {
        const { trees, collections } = await req.json();

        await ensureTables();
        const connection = await pool.getConnection();

        try {
            if (trees && trees.length > 0) {
                const treeValues = trees.map((t: any) => [
                    t.tree_id,
                    t.lat,
                    t.lng,
                    t.note || null
                    // created_at is automatic in DB or we can pass it if we want to sync the client creation time
                ]);

                // We need to handle the params for the query dynamically or just standard bulk insert
                // INSERT INTO trees (tree_id, lat, lng, note) VALUES ? ON DUPLICATE KEY UPDATE lat=VALUES(lat), lng=VALUES(lng), note=VALUES(note)

                await connection.query(
                    'INSERT INTO trees (tree_id, lat, lng, note) VALUES ? ON DUPLICATE KEY UPDATE lat=VALUES(lat), lng=VALUES(lng), note=VALUES(note)',
                    [treeValues]
                );
            }

            if (collections && collections.length > 0) {
                // Insert collections
                const collectionValues = collections.map((c: any) => [
                    c.tree_id,
                    c.cuts,
                    c.milk_amount,
                    c.note || null,
                    new Date(c.timestamp)
                ]);

                await connection.query(
                    'INSERT INTO collections (tree_id, cuts, milk_amount, note, timestamp) VALUES ?',
                    [collectionValues]
                );
            }

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
    }
}
