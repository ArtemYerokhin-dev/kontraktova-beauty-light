export function toDateStr(date) {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Next 14 days (including today) as { dateStr, weekday, day, month }
export function nextTwoWeeks() {
  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: toDateStr(d),
      weekday: d.getDay(),
      day: d.getDate(),
      month: d.getMonth(),
    });
  }
  return days;
}

const MONTHS_UA = [
  'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
  'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
];

export function formatDateUa(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS_UA[m - 1]} ${y}`;
}

// "2026-07-13" -> "13.07.2026"
export function formatDateDots(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${d}.${m}.${y}`;
}
