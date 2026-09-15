const request = require('supertest');
const app = require('../src/app');

describe('API Error Handling & Middleware Tests', () => {
    it('returns 404 with structured error JSON when requesting an unknown route', async () => {
        const res = await request(app).get('/api/unknown-endpoint');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: 'Route not found: GET /api/unknown-endpoint'
        });
    });

    it('returns 400 when malformed JSON is sent to the API', async () => {
        const res = await request(app)
            .post('/api/health')
            .set('Content-Type', 'application/json')
            .send('{"invalid_json": ');

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty('success', false);
        expect(res.body.message).toContain('Malformed JSON');
    });
});
