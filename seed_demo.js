import { initDatabase, getDb, closeDb } from './server/src/db.js';
import bcrypt from 'bcryptjs';
import { formatDate, shiftDays } from './server/src/utils/streak.js';

const db = initDatabase();

const demoEmail = 'demo@streakkeeper.com';
const demoPassword = 'Password123!';
const passwordHash = bcrypt.hashSync(demoPassword, 10);

// Insert or update demo user
db.prepare('DELETE FROM users WHERE email = ?').run(demoEmail);
const userRes = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)').run(demoEmail, passwordHash);
const userId = userRes.lastInsertRowid;

console.log('Created demo user with ID:', userId);

// Create Habit 1: "Daily 5km Run" (5-day streak ending today)
const habit1 = db.prepare('INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)').run(
  userId,
  '🏃‍♂️ Daily 5km Run',
  'Morning cardio to boost metabolism and energy.'
);
const h1Id = habit1.lastInsertRowid;

const today = new Date();
for (let i = 0; i < 5; i++) {
  const d = shiftDays(today, -i);
  db.prepare('INSERT INTO checkins (habit_id, checkin_date) VALUES (?, ?)').run(h1Id, formatDate(d));
}

// Create Habit 2: "💧 Drink 2L Water" (12-day streak ending today)
const habit2 = db.prepare('INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)').run(
  userId,
  '💧 Drink 2L Water',
  'Stay hydrated throughout the day with clean water.'
);
const h2Id = habit2.lastInsertRowid;

for (let i = 0; i < 12; i++) {
  const d = shiftDays(today, -i);
  db.prepare('INSERT INTO checkins (habit_id, checkin_date) VALUES (?, ?)').run(h2Id, formatDate(d));
}

// Create Habit 3: "📚 Read 30 Mins" (3-day streak ending yesterday, not yet checked today)
const habit3 = db.prepare('INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)').run(
  userId,
  '📚 Read 30 Mins',
  'Continuous learning from non-fiction books.'
);
const h3Id = habit3.lastInsertRowid;

for (let i = 1; i <= 3; i++) {
  const d = shiftDays(today, -i);
  db.prepare('INSERT INTO checkins (habit_id, checkin_date) VALUES (?, ?)').run(h3Id, formatDate(d));
}

console.log('Demo habits and streaks seeded successfully!');
closeDb();
