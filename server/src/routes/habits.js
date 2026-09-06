import express from 'express';
import { getDb } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateStreak, get30DayHeatmap, formatDate } from '../utils/streak.js';

export const habitsRouter = express.Router();

// Apply auth middleware to all habit routes
habitsRouter.use(authenticateToken);

// Helper to format habit with streak and history
function formatHabitRecord(db, habit, refDate = new Date()) {
  const checkinRows = db
    .prepare('SELECT checkin_date FROM checkins WHERE habit_id = ? ORDER BY checkin_date ASC')
    .all(habit.id);

  const checkinDates = checkinRows.map((row) => row.checkin_date);
  const currentStreak = calculateStreak(checkinDates, refDate);
  const history30Days = get30DayHeatmap(checkinDates, refDate);
  const todayStr = formatDate(refDate);
  const checkedToday = checkinDates.includes(todayStr);

  return {
    id: habit.id,
    user_id: habit.user_id,
    name: habit.name,
    description: habit.description || '',
    created_at: habit.created_at,
    currentStreak,
    checkedToday,
    totalCheckins: checkinDates.length,
    history30Days,
    checkinDates,
  };
}

// GET /api/habits - Fetch all habits for the logged-in user
habitsRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const habits = db
      .prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);

    // Allow client to pass its local date query param ?date=YYYY-MM-DD for accurate timezone streak
    let refDate = new Date();
    if (req.query.date && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)) {
      const [y, m, d] = req.query.date.split('-').map(Number);
      refDate = new Date(y, m - 1, d);
    }

    const formattedHabits = habits.map((h) => formatHabitRecord(db, h, refDate));
    return res.status(200).json({ habits: formattedHabits });
  } catch (err) {
    console.error('Error fetching habits:', err);
    return res.status(500).json({ error: 'Failed to retrieve habits.' });
  }
});

// POST /api/habits - Create a new habit
habitsRouter.post('/', (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Habit name is required.' });
    }

    const trimmedName = name.trim();
    const trimmedDesc = (description || '').trim();
    const db = getDb();

    const insertStmt = db.prepare(
      'INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)'
    );
    const result = insertStmt.run(req.user.id, trimmedName, trimmedDesc);
    const newHabitId = result.lastInsertRowid;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(newHabitId);
    const formatted = formatHabitRecord(db, habit);

    return res.status(201).json({
      message: 'Habit created successfully.',
      habit: formatted,
    });
  } catch (err) {
    console.error('Error creating habit:', err);
    return res.status(500).json({ error: 'Failed to create habit.' });
  }
});

// DELETE /api/habits/:id - Delete a habit (and its checkin history via cascade)
habitsRouter.delete('/:id', (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID.' });
    }

    const db = getDb();
    // Enforce ownership: habit must belong to req.user.id
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or you do not have permission to delete it.' });
    }

    db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?').run(habitId, req.user.id);

    return res.status(200).json({ message: 'Habit deleted successfully.' });
  } catch (err) {
    console.error('Error deleting habit:', err);
    return res.status(500).json({ error: 'Failed to delete habit.' });
  }
});

// POST /api/habits/:id/checkin - Mark habit as checked-in for a date
habitsRouter.post('/:id/checkin', (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID.' });
    }

    const db = getDb();
    // Enforce ownership
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or you do not have permission to modify it.' });
    }

    const targetDate = req.body.date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)
      ? req.body.date
      : formatDate(new Date());

    // Insert or ignore if already checked in
    db.prepare(`
      INSERT INTO checkins (habit_id, checkin_date)
      VALUES (?, ?)
      ON CONFLICT(habit_id, checkin_date) DO NOTHING
    `).run(habitId, targetDate);

    let refDate = new Date();
    if (req.body.date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) {
      const [y, m, d] = req.body.date.split('-').map(Number);
      refDate = new Date(y, m - 1, d);
    }

    const formatted = formatHabitRecord(db, habit, refDate);
    return res.status(200).json({
      message: 'Check-in recorded successfully.',
      habit: formatted,
    });
  } catch (err) {
    console.error('Error recording check-in:', err);
    return res.status(500).json({ error: 'Failed to record check-in.' });
  }
});

// DELETE /api/habits/:id/checkin - Un-check / remove check-in for a date
habitsRouter.delete('/:id/checkin', (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID.' });
    }

    const db = getDb();
    // Enforce ownership
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or you do not have permission to modify it.' });
    }

    const targetDate = (req.body.date || req.query.date) && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date || req.query.date)
      ? (req.body.date || req.query.date)
      : formatDate(new Date());

    db.prepare('DELETE FROM checkins WHERE habit_id = ? AND checkin_date = ?').run(habitId, targetDate);

    let refDate = new Date();
    if (targetDate) {
      const [y, m, d] = targetDate.split('-').map(Number);
      refDate = new Date(y, m - 1, d);
    }

    const formatted = formatHabitRecord(db, habit, refDate);
    return res.status(200).json({
      message: 'Check-in removed successfully.',
      habit: formatted,
    });
  } catch (err) {
    console.error('Error removing check-in:', err);
    return res.status(500).json({ error: 'Failed to remove check-in.' });
  }
});
