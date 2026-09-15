const { verifyToken } = require('../utils/token');
const UserModel = require('../models/user.model');

async function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.user = null;
        return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        req.user = (user && user.status === 'active') ? user : null;
    } catch (err) {
        req.user = null;
    }

    next();
}

module.exports = optionalAuthenticate;
