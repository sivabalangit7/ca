export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDisplayDate(dateKey: string): string {
  const today = getTodayKey();
  const yesterday = getOffsetDateKey(-1);

  if (dateKey === today) return 'Today';
  if (dateKey === yesterday) return 'Yesterday';

  const date = parseDateKey(dateKey);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function getOffsetDateKey(dayOffset: number, baseKey: string = getTodayKey()): string {
  const base = parseDateKey(baseKey);
  base.setDate(base.getDate() + dayOffset);
  return formatDateKey(base);
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    dates.push(getOffsetDateKey(-i));
  }
  return dates;
}

export function getDayOfWeekName(dateKey: string): 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday' {
  const date = parseDateKey(dateKey);
  const days: ('Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday')[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ];
  const dayName = days[date.getDay()];
  return dayName as any;
}
