import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createApp } from '../src/app.js';
import { initDatabase, clearDatabase, closeDb } from '../src/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_DB_PATH = path.resolve(__dirname, 'test_security.db');

describe('Security & Production Hardening Test Suite', () => {
  let app;

  beforeEach(() => {
    initDatabase(TEST_DB_PATH);
    clearDatabase();
    app = createApp();
  });

  afterAll(() => {
    closeDb();
    if (fs.existsSync(TEST_DB_PATH)) {
      try {
        fs.unlinkSync(TEST_DB_PATH);
      } catch (e) {}
    }
  });

  describe('Security Headers & Helmet', () => {
    it('should set secure HTTP response headers', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('Payload Body Size Limits', () => {
    it('should reject payloads exceeding 10KB with HTTP 413', async () => {
      const hugePayload = {
        name: 'Normal Habit',
        description: 'A'.repeat(15 * 1024), // 15KB
      };

      const res = await request(app)
        .post('/api/auth/signup')
        .send(hugePayload)
        .set('Content-Type', 'application/json');

      expect(res.status).toBe(413);
      expect(res.body.error).toContain('payload too large');
    });
  });

  describe('Input Validation & Constraints', () => {
    it('should reject passwords longer than 128 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'longpass@test.com',
          password: 'P'.repeat(129),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at most 128 characters');
    });

    it('should reject emails longer than 254 characters', async () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          email: longEmail,
          password: 'validPassword123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('valid email address');
    });

    it('should reject habit names longer than 100 characters', async () => {
      // Create user first
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'habitowner@test.com', password: 'password123' });
      const token = signupRes.body.token;

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'H'.repeat(101),
          description: 'Valid description',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Habit name must not exceed 100 characters');
    });

    it('should reject habit descriptions longer than 500 characters', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'habitowner2@test.com', password: 'password123' });
      const token = signupRes.body.token;

      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Read Books',
          description: 'D'.repeat(501),
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Habit description must not exceed 500 characters');
    });

    it('should reject invalid calendar dates like Feb 31 or invalid month on check-in', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'datechecker@test.com', password: 'password123' });
      const token = signupRes.body.token;

      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hydrate Daily' });
      const habitId = habitRes.body.habit.id;

      // Invalid date Feb 31
      const res = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: '2026-02-31' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid date format');

      // Invalid month 13
      const res2 = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: '2026-13-10' });

      expect(res2.status).toBe(400);
      expect(res2.body.error).toContain('Invalid date format');
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return database connected status and uptime', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
      expect(typeof res.body.uptimeSeconds).toBe('number');
    });
  });
});
