import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../db.js';
import { authenticateToken, generateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

export const authRouter = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// POST /api/auth/signup
authRouter.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address (max 254 characters).' });
    }

    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters (and at most ${MAX_PASSWORD_LENGTH} characters) long.` });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into SQLite
    const insertStmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = insertStmt.run(normalizedEmail, passwordHash);
    const userId = result.lastInsertRowid;

    const user = { id: userId, email: normalizedEmail };
    const token = generateToken(user);

    return res.status(201).json({
      message: 'Account created successfully.',
      user,
      token,
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during signup.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || email.trim().length > MAX_EMAIL_LENGTH || !password || typeof password !== 'string' || password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const db = getDb();

    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const authUser = { id: user.id, email: user.email };
    const token = generateToken(authUser);

    return res.status(200).json({
      message: 'Login successful.',
      user: authUser,
      token,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
});

// GET /api/auth/me
authRouter.get('/me', authenticateToken, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  return res.status(200).json({ user });
});
