const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/env');

function generateToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
    });
}

function verifyToken(token) {
    return jwt.verify(token, config.jwt.secret);
}

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

function generateRandomToken(bytes = 32) {
    const rawToken = crypto.randomBytes(bytes).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    return { rawToken, tokenHash };
}

function hashToken(rawToken) {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    generateRandomToken,
    hashToken
};
