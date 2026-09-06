import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, clearDatabase, closeDb } from '../src/db.js';

describe('Auth Endpoints Integration Tests', () => {
  let app;

  beforeAll(() => {
    initDatabase(':memory:');
    app = createApp();
  });

  beforeEach(() => {
    clearDatabase();
  });

  afterAll(() => {
    closeDb();
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully register a new user and return a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/valid email/i);
    });

    it('should reject password less than 8 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'valid@example.com', password: 'short' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 8 characters/i);
    });

    it('should reject duplicate email signup with 409 Conflict', async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ email: 'duplicate@example.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'duplicate@example.com', password: 'anotherpassword123' });

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/signup')
        .send({ email: 'loginuser@example.com', password: 'securepassword123' });
    });

    it('should login with correct credentials and return JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'securepassword123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('loginuser@example.com');
    });

    it('should reject login with wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'loginuser@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });

    it('should reject login for non-existent user with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'securepassword123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info when valid JWT is supplied', async () => {
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'profile@example.com', password: 'password123' });

      const token = signupRes.body.token;

      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('profile@example.com');
    });

    it('should return 401 when token is missing', async () => {
      const meRes = await request(app).get('/api/auth/me');
      expect(meRes.status).toBe(401);
    });
  });
});
