const request = require('supertest');
const app = require('./index');

describe('API Endpoints', () => {
  it('GET /api/health returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toEqual('ok');
  });

  it('GET /api/hello returns greeting', async () => {
    const res = await request(app).get('/api/hello');
    expect(res.body.message).toContain('Hello');
  });
});