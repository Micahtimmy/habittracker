import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authRouter } from './routes/auth.js';
import { habitsRouter } from './routes/habits.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { getDb } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Trust first proxy (Fly.io reverse proxy) for accurate IP resolution
  app.set('trust proxy', 1);

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  app.use(cors({ origin: allowedOrigin }));

  // JSON Body Parser with strict 10kb limit to mitigate payload-based DoS
  app.use(express.json({ limit: '10kb' }));

  // Apply general API rate limiting
  app.use('/api', apiLimiter);

  // Health check endpoint with live database probe
  app.get('/api/health', (req, res) => {
    try {
      const db = getDb();
      db.prepare('SELECT 1').get();
      res.status(200).json({
        status: 'ok',
        name: 'StreakKeeper API',
        database: 'connected',
        uptimeSeconds: Math.floor(process.uptime()),
        time: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.error('Healthcheck DB error:', dbErr);
      res.status(503).json({
        status: 'degraded',
        error: 'Database connection failed',
        time: new Date().toISOString(),
      });
    }
  });

  // Mount API routes
  app.use('/api/auth', authRouter);
  app.use('/api/habits', habitsRouter);

  // Serve Frontend Static Assets in Production
  const clientDistPath = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) {
        return next();
      }
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }

  // 404 Handler for API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  // Fallback 404
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request payload too large. Maximum size is 10KB.' });
    }
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  });

  return app;
}
