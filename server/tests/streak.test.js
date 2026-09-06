import { describe, it, expect } from 'vitest';
import { calculateStreak, get30DayHeatmap, formatDate, shiftDays } from '../src/utils/streak.js';

describe('Streak Calculation Logic', () => {
  const today = new Date(2026, 8, 5); // 2026-09-05
  const todayStr = '2026-09-05';
  const yesterdayStr = '2026-09-04';
  const day2AgoStr = '2026-09-03';
  const day3AgoStr = '2026-09-02';
  const day4AgoStr = '2026-09-01';

  it('should return 0 when check-in list is empty', () => {
    expect(calculateStreak([], today)).toBe(0);
    expect(calculateStreak(null, today)).toBe(0);
  });

  it('should return 1 when only today is checked in', () => {
    expect(calculateStreak([todayStr], today)).toBe(1);
  });

  it('should return 1 when only yesterday is checked in (active streak awaiting today)', () => {
    expect(calculateStreak([yesterdayStr], today)).toBe(1);
  });

  it('should calculate consecutive streak ending today', () => {
    const dates = [day2AgoStr, yesterdayStr, todayStr];
    expect(calculateStreak(dates, today)).toBe(3);
  });

  it('should calculate consecutive streak ending yesterday (not yet checked in today)', () => {
    const dates = [day3AgoStr, day2AgoStr, yesterdayStr];
    expect(calculateStreak(dates, today)).toBe(3);
  });

  it('should calculate 5 consecutive days ending today', () => {
    const dates = [day4AgoStr, day3AgoStr, day2AgoStr, yesterdayStr, todayStr];
    expect(calculateStreak(dates, today)).toBe(5);
  });

  it('should reset streak to 0 if last check-in was 2 days ago or older', () => {
    const dates = [day4AgoStr, day3AgoStr, day2AgoStr]; // missed yesterday and today
    expect(calculateStreak(dates, today)).toBe(0);
  });

  it('should stop counting streak at the first gap', () => {
    // Gap on day2AgoStr
    const dates = [day4AgoStr, day3AgoStr, yesterdayStr, todayStr];
    // Yesterday + today = 2
    expect(calculateStreak(dates, today)).toBe(2);
  });

  it('should correctly reduce streak count when un-checking today', () => {
    const withToday = [day2AgoStr, yesterdayStr, todayStr];
    expect(calculateStreak(withToday, today)).toBe(3);

    const afterUncheckingToday = [day2AgoStr, yesterdayStr];
    expect(calculateStreak(afterUncheckingToday, today)).toBe(2);
  });
});

describe('30-Day Heatmap Generation', () => {
  const today = new Date(2026, 8, 5); // 2026-09-05
  const todayStr = '2026-09-05';
  const yesterdayStr = '2026-09-04';

  it('should generate exactly 30 days ending on reference date', () => {
    const heatmap = get30DayHeatmap([todayStr, yesterdayStr], today);
    expect(heatmap).toHaveLength(30);
    expect(heatmap[29].date).toBe(todayStr);
    expect(heatmap[29].isToday).toBe(true);
    expect(heatmap[29].checked).toBe(true);
    expect(heatmap[28].date).toBe(yesterdayStr);
    expect(heatmap[28].checked).toBe(true);
    expect(heatmap[0].checked).toBe(false);
  });
});
