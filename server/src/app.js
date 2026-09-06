import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { habitsRouter } from './routes/habits.js';

dotenv.config();

export function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', name: 'StreakKeeper API', time: new Date().toISOString() });
  });

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/habits', habitsRouter);

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
