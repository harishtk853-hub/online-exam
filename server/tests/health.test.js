const request = require('supertest');
const app = require('../src/app');

describe('API Foundation & Health Check Tests', () => {
    it('GET /api/health returns 200 with healthy status', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success', true);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('status', 'healthy');
        expect(res.body.data).toHaveProperty('service', 'online-exam-platform-api');
    });

    it('GET /api/nonexistent returns 404 with standard error structure', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body).toHaveProperty('message');
        expect(res.body.message).toContain('Route not found');
    });
});
