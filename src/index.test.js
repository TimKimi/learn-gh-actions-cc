const request = require('supertest');
const { app, server } = require('./index');

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

// 🔧 关键：所有测试完成后关闭服务器，让 Jest 正常退出
afterAll((done) => {
  server.close(done);
});