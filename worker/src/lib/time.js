export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes) {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Step between candidate slot start times, in minutes
export const SLOT_STEP_MIN = 60;

// dateStr: YYYY-MM-DD -> 0=Sunday..6=Saturday
export function dateToWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

const KYIV_TZ = 'Europe/Kyiv';

// en-CA formats as YYYY-MM-DD directly. The Workers runtime ships full ICU,
// so Intl handles Europe/Kyiv's DST transitions correctly — no fixed-offset
// approximation needed.
const kyivDateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: KYIV_TZ });
const kyivTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: KYIV_TZ,
  hourCycle: 'h23',
  hour: '2-digit',
  minute: '2-digit',
});

export function todayStr() {
  return kyivDateFormatter.format(new Date());
}

export function nowMinutesKyiv() {
  const parts = kyivTimeFormatter.formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour').value);
  const m = Number(parts.find((p) => p.type === 'minute').value);
  return h * 60 + m;
}

export function isValidDateStr(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

// Two weeks ahead (inclusive of today). Calendar-day arithmetic is done on
// the Y/M/D numbers via Date.UTC, which is DST-agnostic — only the "what is
// today in Kyiv" lookup above needs the real timezone.
export function isWithinBookingWindow(dateStr) {
  const today = todayStr();
  const [y, m, d] = today.split('-').map(Number);
  const max = new Date(Date.UTC(y, m - 1, d));
  max.setUTCDate(max.getUTCDate() + 14);
  const maxStr = `${max.getUTCFullYear()}-${(max.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}-${max.getUTCDate().toString().padStart(2, '0')}`;
  return dateStr >= today && dateStr <= maxStr;
}
