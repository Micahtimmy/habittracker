import express from 'express';
import { getDb } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateStreak, get30DayHeatmap, formatDate, isValidDateString, parseLocalDate } from '../utils/streak.js';

export const habitsRouter = express.Router();

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

// Apply auth middleware to all habit routes
habitsRouter.use(authenticateToken);

// Helper to format a single habit record with pre-fetched checkin dates
function formatHabitWithDates(habit, checkinDates = [], refDate = new Date()) {
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

// GET /api/habits - Fetch all habits for the logged-in user (Batch query optimized)
habitsRouter.get('/', (req, res) => {
  try {
    const db = getDb();
    const habits = db
      .prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC')
      .all(req.user.id);

    if (habits.length === 0) {
      return res.status(200).json({ habits: [] });
    }

    // Parse and validate optional reference date for timezone consistency
    let refDate = new Date();
    if (req.query.date) {
      if (!isValidDateString(req.query.date)) {
        return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      }
      refDate = parseLocalDate(req.query.date);
    }

    // Batch query all checkins for the user's habits to prevent N+1 queries
    const habitIds = habits.map((h) => h.id);
    const placeholders = habitIds.map(() => '?').join(',');
    const checkinRows = db
      .prepare(`SELECT habit_id, checkin_date FROM checkins WHERE habit_id IN (${placeholders}) ORDER BY checkin_date ASC`)
      .all(...habitIds);

    // Group checkin dates by habit_id
    const checkinMap = new Map();
    for (const habitId of habitIds) {
      checkinMap.set(habitId, []);
    }
    for (const row of checkinRows) {
      const dates = checkinMap.get(row.habit_id);
      if (dates) {
        dates.push(row.checkin_date);
      }
    }

    const formattedHabits = habits.map((habit) =>
      formatHabitWithDates(habit, checkinMap.get(habit.id) || [], refDate)
    );

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
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Habit name must not exceed ${MAX_NAME_LENGTH} characters.` });
    }

    const trimmedDesc = typeof description === 'string' ? description.trim() : '';
    if (trimmedDesc.length > MAX_DESCRIPTION_LENGTH) {
      return res.status(400).json({ error: `Habit description must not exceed ${MAX_DESCRIPTION_LENGTH} characters.` });
    }

    const db = getDb();
    const insertStmt = db.prepare(
      'INSERT INTO habits (user_id, name, description) VALUES (?, ?, ?)'
    );
    const result = insertStmt.run(req.user.id, trimmedName, trimmedDesc);
    const newHabitId = result.lastInsertRowid;

    const habit = db.prepare('SELECT * FROM habits WHERE id = ?').get(newHabitId);
    const formatted = formatHabitWithDates(habit, [], new Date());

    return res.status(201).json({
      message: 'Habit created successfully.',
      habit: formatted,
    });
  } catch (err) {
    console.error('Error creating habit:', err);
    return res.status(500).json({ error: 'Failed to create habit.' });
  }
});

// DELETE /api/habits/:id - Delete a habit
habitsRouter.delete('/:id', (req, res) => {
  try {
    const habitId = parseInt(req.params.id, 10);
    if (isNaN(habitId)) {
      return res.status(400).json({ error: 'Invalid habit ID.' });
    }

    const db = getDb();
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
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or you do not have permission to modify it.' });
    }

    let targetDate = formatDate(new Date());
    let refDate = new Date();

    if (req.body.date) {
      if (!isValidDateString(req.body.date)) {
        return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      }
      targetDate = req.body.date;
      refDate = parseLocalDate(req.body.date);
    }

    // Insert or ignore if already checked in
    db.prepare(`
      INSERT INTO checkins (habit_id, checkin_date)
      VALUES (?, ?)
      ON CONFLICT(habit_id, checkin_date) DO NOTHING
    `).run(habitId, targetDate);

    const checkinRows = db
      .prepare('SELECT checkin_date FROM checkins WHERE habit_id = ? ORDER BY checkin_date ASC')
      .all(habitId);
    const checkinDates = checkinRows.map((r) => r.checkin_date);

    const formatted = formatHabitWithDates(habit, checkinDates, refDate);
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
    const habit = db.prepare('SELECT * FROM habits WHERE id = ? AND user_id = ?').get(habitId, req.user.id);
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found or you do not have permission to modify it.' });
    }

    const rawDate = req.body.date || req.query.date;
    let targetDate = formatDate(new Date());
    let refDate = new Date();

    if (rawDate) {
      if (!isValidDateString(rawDate)) {
        return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD.' });
      }
      targetDate = rawDate;
      refDate = parseLocalDate(rawDate);
    }

    db.prepare('DELETE FROM checkins WHERE habit_id = ? AND checkin_date = ?').run(habitId, targetDate);

    const checkinRows = db
      .prepare('SELECT checkin_date FROM checkins WHERE habit_id = ? ORDER BY checkin_date ASC')
      .all(habitId);
    const checkinDates = checkinRows.map((r) => r.checkin_date);

    const formatted = formatHabitWithDates(habit, checkinDates, refDate);
    return res.status(200).json({
      message: 'Check-in removed successfully.',
      habit: formatted,
    });
  } catch (err) {
    console.error('Error removing check-in:', err);
    return res.status(500).json({ error: 'Failed to remove check-in.' });
  }
});
