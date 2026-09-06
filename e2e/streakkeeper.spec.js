import { test, expect } from '@playwright/test';

test.describe('StreakKeeper End-to-End User Flow', () => {
  const testEmail = `user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const habitName = 'Morning Meditation';
  const habitDesc = '10 minutes of daily mindfulness';

  test('Signup -> Login -> Create Habit -> Check-in -> Uncheck -> Logout -> Login Persistence', async ({ page }) => {
    // 1. Visit root page (should display Login form for unauthenticated user)
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('#login-email')).toBeVisible();

    // 2. Navigate to Signup
    await page.click('#link-to-signup');
    await expect(page.locator('h1')).toContainText('Start Your Streak');

    // 3. Test validation: Short password
    await page.fill('#signup-email', testEmail);
    await page.fill('#signup-password', 'short');
    await page.click('#btn-signup-submit');
    await expect(page.locator('#auth-error-alert')).toBeVisible();
    await expect(page.locator('#auth-error-alert')).toContainText('at least 8 characters');

    // 4. Fill valid signup info and submit
    await page.fill('#signup-password', testPassword);
    await page.click('#btn-signup-submit');

    // 5. Verify landing on Dashboard
    await expect(page.locator('h1')).toContainText('Habit Dashboard');
    await expect(page.locator('#stat-total-habits')).toHaveText('0');
    await expect(page.locator('#empty-habits-state')).toBeVisible();

    // 6. Create a new habit
    await page.click('#btn-add-habit-main');
    await expect(page.locator('#habit-name')).toBeVisible();
    await page.fill('#habit-name', habitName);
    await page.fill('#habit-desc', habitDesc);
    await page.click('#btn-submit-habit');

    // 7. Verify habit card is rendered
    await expect(page.getByRole('heading', { name: habitName })).toBeVisible();
    await expect(page.locator('#stat-total-habits')).toHaveText('1');
    await expect(page.locator('#stat-today-done')).toHaveText('0');

    // Habit initial streak is 0 days
    const streakLocator = page.locator('[id^="habit-streak-"]').first();
    await expect(streakLocator).toContainText('0 days');

    // 8. Daily check-in
    const checkinBtn = page.locator('[id^="btn-checkin-"]').first();
    await expect(checkinBtn).toContainText('Check In');
    await checkinBtn.click();

    // 9. Verify streak increases to 1 day and button shows "Done Today!"
    await expect(checkinBtn).toContainText('Done Today!');
    await expect(streakLocator).toContainText('1 day');
    await expect(page.locator('#stat-today-done')).toHaveText('1');
    await expect(page.locator('#stat-active-streaks')).toHaveText('1');

    // 10. Un-check today's entry
    await checkinBtn.click();
    await expect(checkinBtn).toContainText('Check In');
    await expect(streakLocator).toContainText('0 days');
    await expect(page.locator('#stat-today-done')).toHaveText('0');

    // 11. Re-check for today
    await checkinBtn.click();
    await expect(checkinBtn).toContainText('Done Today!');
    await expect(streakLocator).toContainText('1 day');

    // 12. Logout
    await page.click('#btn-logout');
    await expect(page.locator('h1')).toContainText('Welcome back');

    // 13. Log back in to verify session and persistent data
    await page.fill('#login-email', testEmail);
    await page.fill('#login-password', testPassword);
    await page.click('#btn-login-submit');

    // 14. Verify persisted habit on Dashboard
    await expect(page.locator('h1')).toContainText('Habit Dashboard');
    await expect(page.getByRole('heading', { name: habitName })).toBeVisible();
    await expect(page.locator('[id^="btn-checkin-"]').first()).toContainText('Done Today!');
    await expect(page.locator('[id^="habit-streak-"]').first()).toContainText('1 day');
  });
});
