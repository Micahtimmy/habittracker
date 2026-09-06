/**
 * Formats a Date object as YYYY-MM-DD (local timezone)
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds or subtracts days from a given Date object and returns a new Date object
 * @param {Date} date
 * @param {number} days
 * @returns {Date}
 */
export function shiftDays(date, days) {
  const result = new Date(date);
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
  if (!checkinDates || checkinDates.length === 0) {
    return 0;
  }

  const dateSet = new Set(checkinDates);
  const todayStr = formatDate(referenceDate);
  const yesterdayDate = shiftDays(referenceDate, -1);
  const yesterdayStr = formatDate(yesterdayDate);

  const checkedToday = dateSet.has(todayStr);
  const checkedYesterday = dateSet.has(yesterdayStr);

  // If neither today nor yesterday is checked in, streak is broken / 0
  if (!checkedToday && !checkedYesterday) {
    return 0;
  }

  let streak = 0;
  let cursorDate = checkedToday ? referenceDate : yesterdayDate;

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
  const todayStr = formatDate(referenceDate);
  const days = [];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate 30 days from 29 days ago up to today
  for (let i = 29; i >= 0; i--) {
    const d = shiftDays(referenceDate, -i);
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
