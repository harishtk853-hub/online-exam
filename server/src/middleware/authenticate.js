const { verifyToken } = require('../utils/token');
const { errorResponse } = require('../utils/response');
const UserModel = require('../models/user.model');

async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'Authentication required. No Bearer token provided.', 401);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return errorResponse(res, 'Authentication token is empty.', 401);
    }

    try {
        const decoded = verifyToken(token);
        const user = await UserModel.findById(decoded.id);

        if (!user) {
            return errorResponse(res, 'User associated with token no longer exists.', 401);
        }

        if (user.status !== 'active') {
            return errorResponse(res, `Account is currently ${user.status}. Access restricted.`, 403);
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
        }
        return errorResponse(res, 'Invalid authentication token.', 401);
    }
}

module.exports = authenticate;
