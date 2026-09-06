import { createApp } from './app.js';
import { getDb, closeDb } from './db.js';

const PORT = process.env.PORT || 5000;

// Initialize database
getDb();

const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`🚀 StreakKeeper Backend API running on http://localhost:${PORT}`);
});

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    console.log('🔌 HTTP server closed.');
    try {
      closeDb();
      console.log('💾 SQLite database connection closed safely.');
    } catch (e) {
      console.error('Error closing database:', e);
    }
    process.exit(0);
  });

  // Force shutdown after 10 seconds if connections are stuck
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
