const path = require('path');
module.paths.push(path.join(__dirname, '../server/node_modules'));
const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function runMigrations() {
    const config = {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        multipleStatements: true
    };

    console.log(`Connecting to MySQL at ${config.host}:${config.port} as ${config.user}...`);
    let connection;
    try {
        connection = await mysql.createConnection(config);
        const dbName = process.env.DB_NAME || 'online_exam_platform';

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`Database '${dbName}' verified/created.`);

        await connection.changeUser({ database: dbName });

        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            console.log(`Executing migration: ${file}...`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await connection.query(sql);
            console.log(`Migration ${file} executed successfully.`);
        }

        console.log('All migrations completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
