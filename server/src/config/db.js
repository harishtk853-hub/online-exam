const mysql = require('mysql2/promise');
const config = require('./env');

let pool = null;

function getPool() {
    if (!pool) {
        pool = mysql.createPool(config.db);
    }
    return pool;
}

async function query(sql, params) {
    const currentPool = getPool();
    const [results] = await currentPool.execute(sql, params);
    return results;
}

async function checkDatabaseConnection() {
    try {
        const currentPool = getPool();
        const connection = await currentPool.getConnection();
        await connection.ping();
        connection.release();
        return { connected: true, host: config.db.host, database: config.db.database };
    } catch (err) {
        return { connected: false, error: err.message };
    }
}

module.exports = {
    getPool,
    query,
    checkDatabaseConnection
};
