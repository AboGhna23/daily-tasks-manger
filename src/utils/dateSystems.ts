import { ARABIC_MONTHS, ARABIC_WEEKDAYS, formatDateKey } from './defaultData.ts';
import type { CalendarDayCell, DateMode, MonthView } from '../types/index.ts';

export const HIJRI_MONTHS: string[] = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
];

const HIJRI_LOCALE = 'ar-SA-u-ca-islamic-umalqura-nu-latn';

export interface HijriDate {
  day: number;
  month: number;
  year: number;
}

let hijriFormatter: Intl.DateTimeFormat | null = null;
const hijriCache = new Map<string, HijriDate>();

function atNoon(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0);
}

export function shiftDays(date: Date, days: number): Date {
  return atNoon(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function parseDateKey(dateKey: string): Date | null {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return atNoon(parts[0], parts[1] - 1, parts[2]);
}

export function getHijriDate(date: Date): HijriDate {
  const key = formatDateKey(date);
  const cached = hijriCache.get(key);
  if (cached) return cached;

  if (!hijriFormatter) {
    hijriFormatter = new Intl.DateTimeFormat(HIJRI_LOCALE, {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    });
  }
  const noon = atNoon(date.getFullYear(), date.getMonth(), date.getDate());
  const result: HijriDate = { day: 1, month: 1, year: 1445 };
  for (const part of hijriFormatter.formatToParts(noon)) {
    const value = parseInt(part.value, 10);
    if (Number.isNaN(value)) continue;
    if (part.type === 'day') result.day = value;
    else if (part.type === 'month') result.month = value;
    else if (part.type === 'year') result.year = value;
  }
  hijriCache.set(key, result);
  return result;
}

function getHijriMonthStart(anchor: Date): Date {
  return shiftDays(anchor, -(getHijriDate(anchor).day - 1));
}

function getHijriMonthLength(start: Date): number {
  const startHijri = getHijriDate(start);
  const probe = getHijriDate(shiftDays(start, 29));
  return probe.month === startHijri.month ? 30 : 29;
}

export function shiftViewMonth(anchor: Date, mode: DateMode, delta: -1 | 1): Date {
  if (mode === 'hijri') {
    const start = getHijriMonthStart(anchor);
    if (delta === 1) {
      return shiftDays(start, getHijriMonthLength(start));
    }
    return getHijriMonthStart(shiftDays(start, -1));
  }
  return atNoon(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

function formatHijriRange(first: HijriDate, last: HijriDate): string {
  if (first.year === last.year && first.month === last.month) {
    return `${HIJRI_MONTHS[first.month - 1]} ${first.year} هـ`;
  }
  if (first.year === last.year) {
    return `${HIJRI_MONTHS[first.month - 1]} – ${HIJRI_MONTHS[last.month - 1]} ${first.year} هـ`;
  }
  return `${HIJRI_MONTHS[first.month - 1]} ${first.year} – ${HIJRI_MONTHS[last.month - 1]} ${last.year} هـ`;
}

export function buildMonthView(anchor: Date, mode: DateMode, todayKey: string): MonthView {
  let start: Date;
  let length: number;

  if (mode === 'hijri') {
    start = getHijriMonthStart(anchor);
    length = getHijriMonthLength(start);
  } else {
    start = atNoon(anchor.getFullYear(), anchor.getMonth(), 1);
    length = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate();
  }

  const leading = start.getDay();
  const total = leading + length <= 35 ? 35 : 42;
  const firstCellDate = shiftDays(start, -leading);

  const cells: CalendarDayCell[] = [];
  for (let i = 0; i < total; i++) {
    const date = shiftDays(firstCellDate, i);
    const key = formatDateKey(date);
    const hijri = getHijriDate(date);
    cells.push({
      dateKey: key,
      dayNumber: date.getDate(),
      isCurrentMonth: i >= leading && i < leading + length,
      isToday: key === todayKey,
      dateObj: date,
      hijriDay: hijri.day,
      hijriMonth: hijri.month,
      hijriYear: hijri.year
    });
  }

  const firstCell = cells[leading];
  const lastCell = cells[leading + length - 1];
  const gregorianLabel = `${ARABIC_MONTHS[firstCell.dateObj.getMonth()]} ${firstCell.dateObj.getFullYear()}`;
  const hijriLabel = formatHijriRange(
    { day: firstCell.hijriDay, month: firstCell.hijriMonth, year: firstCell.hijriYear },
    { day: lastCell.hijriDay, month: lastCell.hijriMonth, year: lastCell.hijriYear }
  );

  if (mode === 'hijri') {
    return { cells, primaryLabel: hijriLabel, secondaryLabel: null };
  }
  if (mode === 'gregorian') {
    return { cells, primaryLabel: gregorianLabel, secondaryLabel: null };
  }
  return { cells, primaryLabel: gregorianLabel, secondaryLabel: hijriLabel };
}

export function formatDateLabel(dateKey: string | null, mode: DateMode): string {
  if (!dateKey) return 'غير مجدولة (في القائمة الجانبية)';
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;

  const weekday = ARABIC_WEEKDAYS[date.getDay()];
  const gregorian = `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()} م`;
  const h = getHijriDate(date);
  const hijri = `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;

  if (mode === 'hijri') return `${weekday}، ${hijri}`;
  if (mode === 'gregorian') return `${weekday}، ${gregorian}`;
  return `${weekday}، ${gregorian} — ${hijri}`;
}

export function formatArabicTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'اليوم';
  const h = getHijriDate(d);
  const monthName = ARABIC_MONTHS[d.getMonth()];
  return `${d.getDate()} ${monthName} ${d.getFullYear()} • ${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
}
