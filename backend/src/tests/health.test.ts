import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Health and System Routes', () => {
  const app = createApp();

  it('GET /api/health returns 200 and standard response structure', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('status', 'ok');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.meta).toHaveProperty('timestamp');
  });

  it('GET /api/unknown-endpoint returns 404 standard error format', async () => {
    const response = await request(app).get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('success', false);
    expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    expect(response.body.error).toHaveProperty('message');
  });
});
