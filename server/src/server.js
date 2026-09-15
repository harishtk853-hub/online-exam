const app = require('./app');
const config = require('./config/env');
const { checkDatabaseConnection } = require('./config/db');

async function startServer() {
    try {
        const dbStatus = await checkDatabaseConnection();
        if (dbStatus.connected) {
            console.log(`[DB] Connected to MySQL database '${config.db.database}' on ${config.db.host}:${config.db.port}`);
        } else {
            console.warn(`[DB] Database connection warning: ${dbStatus.error}`);
        }

        const server = app.listen(config.port, () => {
            console.log(`[Server] Online Examination Platform API running on port ${config.port} (${config.nodeEnv})`);
            console.log(`[Server] Health check: http://localhost:${config.port}/api/health`);
        });

        const shutdown = () => {
            console.log('\n[Server] Graceful shutdown initiated...');
            server.close(() => {
                console.log('[Server] HTTP server closed.');
                process.exit(0);
            });
        };

        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    } catch (err) {
        console.error('[Server] Fatal startup error:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
