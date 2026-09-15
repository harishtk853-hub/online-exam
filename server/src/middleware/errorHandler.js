const { errorResponse } = require('../utils/response');

function errorHandler(err, req, res, next) {
    if (process.env.NODE_ENV !== 'test') {
        console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
    }

    if (err.type === 'entity.parse.failed') {
        return errorResponse(res, 'Malformed JSON in request body', 400);
    }

    const statusCode = err.statusCode || err.status || 500;
    const message = process.env.NODE_ENV === 'production' && statusCode === 500
        ? 'Internal Server Error'
        : (err.message || 'Internal Server Error');

    return errorResponse(res, message, statusCode, err.errors || null);
}

function notFoundHandler(req, res) {
    return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
}

module.exports = {
    errorHandler,
    notFoundHandler
};
