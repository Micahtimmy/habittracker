import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { initDatabase, clearDatabase, closeDb, getDb } from '../src/db.js';
import { formatDate, shiftDays } from '../src/utils/streak.js';

describe('Habits & Checkins API Endpoints', () => {
  let app;
  let user1Token;
  let user2Token;
  let user1Id;
  let user2Id;

  beforeAll(() => {
    initDatabase(':memory:');
    app = createApp();
  });

  beforeEach(async () => {
    clearDatabase();

    // Create User 1
    const u1 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user1@example.com', password: 'password123' });
    user1Token = u1.body.token;
    user1Id = u1.body.user.id;

    // Create User 2
    const u2 = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'user2@example.com', password: 'password123' });
    user2Token = u2.body.token;
    user2Id = u2.body.user.id;
  });

  afterAll(() => {
    closeDb();
  });

  describe('Habit Creation and Listing', () => {
    it('should create a habit for the logged-in user', async () => {
      const res = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Drink 2L Water', description: 'Hydration goal' });

      expect(res.status).toBe(201);
      expect(res.body.habit.name).toBe('Drink 2L Water');
      expect(res.body.habit.description).toBe('Hydration goal');
      expect(res.body.habit.currentStreak).toBe(0);
      expect(res.body.habit.checkedToday).toBe(false);
    });

    it('should list only the user’s own habits', async () => {
      // User 1 creates habit
      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'User 1 Habit' });

      // User 2 creates habit
      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ name: 'User 2 Habit' });

      // User 1 fetches habits
      const u1List = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(u1List.status).toBe(200);
      expect(u1List.body.habits).toHaveLength(1);
      expect(u1List.body.habits[0].name).toBe('User 1 Habit');

      // User 2 fetches habits
      const u2List = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user2Token}`);

      expect(u2List.status).toBe(200);
      expect(u2List.body.habits).toHaveLength(1);
      expect(u2List.body.habits[0].name).toBe('User 2 Habit');
    });
  });

  describe('Check-in and Streak Updates', () => {
    it('should check in for today, increment streak, and un-check to decrement', async () => {
      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Read Book' });

      const habitId = habitRes.body.habit.id;

      // Check in for today
      const checkinRes = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(checkinRes.status).toBe(200);
      expect(checkinRes.body.habit.checkedToday).toBe(true);
      expect(checkinRes.body.habit.currentStreak).toBe(1);

      // Un-check for today
      const uncheckRes = await request(app)
        .delete(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(uncheckRes.status).toBe(200);
      expect(uncheckRes.body.habit.checkedToday).toBe(false);
      expect(uncheckRes.body.habit.currentStreak).toBe(0);
    });

    it('should correctly calculate multi-day streak with backdated check-ins', async () => {
      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Exercise Daily' });

      const habitId = habitRes.body.habit.id;
      const today = new Date();
      const yesterday = shiftDays(today, -1);
      const day2Ago = shiftDays(today, -2);

      // Directly insert backdated check-ins into DB
      const db = getDb();
      db.prepare('INSERT INTO checkins (habit_id, checkin_date) VALUES (?, ?)').run(habitId, formatDate(day2Ago));
      db.prepare('INSERT INTO checkins (habit_id, checkin_date) VALUES (?, ?)').run(habitId, formatDate(yesterday));

      // Fetch habits and check streak (ends yesterday: streak should be 2)
      let listRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(listRes.body.habits[0].currentStreak).toBe(2);
      expect(listRes.body.habits[0].checkedToday).toBe(false);

      // Check in today via API
      const todayRes = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(todayRes.body.habit.currentStreak).toBe(3);
      expect(todayRes.body.habit.checkedToday).toBe(true);
    });
  });

  describe('Authorization and Security Boundary Enforcement', () => {
    it('should NOT allow User 2 to check in to User 1’s habit', async () => {
      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'User 1 Private Habit' });

      const habitId = habitRes.body.habit.id;

      // User 2 tries to check in to User 1's habit
      const checkinRes = await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(checkinRes.status).toBe(404);
    });

    it('should NOT allow User 2 to delete User 1’s habit', async () => {
      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'User 1 Protected Habit' });

      const habitId = habitRes.body.habit.id;

      // User 2 attempts deletion
      const deleteRes = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${user2Token}`);

      expect(deleteRes.status).toBe(404);

      // Confirm habit still exists for User 1
      const listRes = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(listRes.body.habits).toHaveLength(1);
    });

    it('should delete habit and cascade delete check-ins when owner deletes', async () => {
      const habitRes = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'To Be Deleted' });

      const habitId = habitRes.body.habit.id;

      // Add a checkin
      await request(app)
        .post(`/api/habits/${habitId}/checkin`)
        .set('Authorization', `Bearer ${user1Token}`);

      // Owner deletes habit
      const deleteRes = await request(app)
        .delete(`/api/habits/${habitId}`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(deleteRes.status).toBe(200);

      // Verify DB table has 0 checkins for this habit
      const db = getDb();
      const checkins = db.prepare('SELECT * FROM checkins WHERE habit_id = ?').all(habitId);
      expect(checkins).toHaveLength(0);
    });
  });
});
