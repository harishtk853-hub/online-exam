const { checkDatabaseConnection, getPool } = require('../src/config/db');
const config = require('../src/config/env');

describe('Database Configuration & Connection Tests', () => {
    it('loads proper environment configuration for database', () => {
        expect(config.db).toBeDefined();
        expect(config.db.host).toBeDefined();
        expect(config.db.port).toBe(3306);
        expect(config.db.database).toBe('online_exam_platform');
    });

    it('checkDatabaseConnection handles connection check without throwing uncaught exceptions', async () => {
        const result = await checkDatabaseConnection();
        expect(result).toHaveProperty('connected');
        if (result.connected) {
            expect(result).toHaveProperty('database', 'online_exam_platform');
        } else {
            expect(result).toHaveProperty('error');
        }
    });
});
