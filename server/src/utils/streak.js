/**
 * Validates whether a string is a real, valid Gregorian date in YYYY-MM-DD format
 * between years 2000 and 2100.
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  if (y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }

  // Verify calendar rollover (e.g., Feb 31 or April 31)
  const testDate = new Date(y, m - 1, d, 12, 0, 0);
  return (
    testDate.getFullYear() === y &&
    testDate.getMonth() === m - 1 &&
    testDate.getDate() === d
  );
}

/**
 * Parses a YYYY-MM-DD string into a Date object anchored at 12:00:00 (noon)
 * to prevent daylight saving time shift issues.
 * @param {string} dateStr
 * @returns {Date}
 */
export function parseLocalDate(dateStr) {
  if (isValidDateString(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
}

/**
 * Formats a Date object as YYYY-MM-DD (local timezone)
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const d = date instanceof Date && !isNaN(date) ? date : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts days from a given Date object and returns a new Date object (DST safe at noon)
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function shiftDays(date, days) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Calculates current streak (consecutive days checked in ending today or yesterday)
 * @param {string[]} checkinDates - Array of 'YYYY-MM-DD' strings
 * @param {Date} [referenceDate=new Date()] - Reference date (defaults to today)
 * @returns {number} Current streak count
 */
export function calculateStreak(checkinDates, referenceDate = new Date()) {
  if (!Array.isArray(checkinDates) || checkinDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(checkinDates);
  const safeRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 12, 0, 0);
  const todayStr = formatDate(safeRef);
  const yesterdayDate = shiftDays(safeRef, -1);
  const yesterdayStr = formatDate(yesterdayDate);

  const checkedToday = dateSet.has(todayStr);
  const checkedYesterday = dateSet.has(yesterdayStr);

  // If neither today nor yesterday is checked in, streak is broken / 0
  if (!checkedToday && !checkedYesterday) {
    return 0;
  }

  let streak = 0;
  let cursorDate = checkedToday ? safeRef : yesterdayDate;

  while (true) {
    const cursorStr = formatDate(cursorDate);
    if (dateSet.has(cursorStr)) {
      streak += 1;
      cursorDate = shiftDays(cursorDate, -1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Generates the last 30 days status array up to referenceDate (inclusive)
 * @param {string[]} checkinDates - Array of 'YYYY-MM-DD' strings
 * @param {Date} [referenceDate=new Date()] - Reference date (defaults to today)
 * @returns {Array<{ date: string, checked: boolean, isToday: boolean, dayName: string }>}
 */
export function get30DayHeatmap(checkinDates, referenceDate = new Date()) {
  const dateSet = new Set(checkinDates || []);
  const safeRef = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate(), 12, 0, 0);
  const todayStr = formatDate(safeRef);
  const days = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate 30 days from 29 days ago up to today
  for (let i = 29; i >= 0; i--) {
    const d = shiftDays(safeRef, -i);
    const dateStr = formatDate(d);
    days.push({
      date: dateStr,
      checked: dateSet.has(dateStr),
      isToday: dateStr === todayStr,
      dayName: dayNames[d.getDay()],
    });
  }

  return days;
}
