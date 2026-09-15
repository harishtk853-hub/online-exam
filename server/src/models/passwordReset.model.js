const { query } = require('../config/db');

const memoryResets = [];

class PasswordResetModel {
    static async createResetToken(email, tokenHash, expiresAt) {
        const normalizedEmail = email.toLowerCase().trim();
        try {
            await query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);
            await query(
                'INSERT INTO password_resets (email, token_hash, expires_at) VALUES (?, ?, ?)',
                [normalizedEmail, tokenHash, expiresAt]
            );
            return true;
        } catch (err) {
            const index = memoryResets.findIndex(r => r.email === normalizedEmail);
            if (index !== -1) memoryResets.splice(index, 1);
            memoryResets.push({ email: normalizedEmail, token_hash: tokenHash, expires_at: expiresAt });
            return true;
        }
    }

    static async findValidToken(email, tokenHash) {
        const normalizedEmail = email.toLowerCase().trim();
        try {
            const results = await query(
                'SELECT * FROM password_resets WHERE email = ? AND token_hash = ? AND expires_at > NOW() LIMIT 1',
                [normalizedEmail, tokenHash]
            );
            return results.length ? results[0] : null;
        } catch (err) {
            const now = new Date();
            const record = memoryResets.find(r => 
                r.email === normalizedEmail && 
                r.token_hash === tokenHash && 
                new Date(r.expires_at) > now
            );
            return record || null;
        }
    }

    static async deleteTokensByEmail(email) {
        const normalizedEmail = email.toLowerCase().trim();
        try {
            await query('DELETE FROM password_resets WHERE email = ?', [normalizedEmail]);
            return true;
        } catch (err) {
            const index = memoryResets.findIndex(r => r.email === normalizedEmail);
            if (index !== -1) memoryResets.splice(index, 1);
            return true;
        }
    }

    static clearMemoryStore() {
        memoryResets.length = 0;
    }
}

module.exports = PasswordResetModel;
