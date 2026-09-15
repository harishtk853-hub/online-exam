const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const examRoutes = require('./exam.routes');
const groupRoutes = require('./group.routes');
const adminRoutes = require('./admin.routes');
const { successResponse } = require('../utils/response');
const { checkDatabaseConnection } = require('../config/db');

// Health Check Endpoint
router.get('/health', async (req, res) => {
    const dbStatus = await checkDatabaseConnection();
    return successResponse(res, {
        status: 'healthy',
        service: 'online-exam-platform-api',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        uptime: process.uptime()
    }, 'API is operational');
});

// Mount Module Routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/exams', examRoutes);
router.use('/groups', groupRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
