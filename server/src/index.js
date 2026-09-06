import { createApp } from './app.js';
import { getDb } from './db.js';

const PORT = process.env.PORT || 5000;

// Initialize database
getDb();

const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 StreakKeeper Backend API running on http://localhost:${PORT}`);
});
