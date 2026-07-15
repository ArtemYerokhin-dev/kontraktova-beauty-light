function toIcsDateTime(dateStr, timeStr) {
  return `${dateStr.replace(/-/g, '')}T${timeStr.replace(':', '')}00`;
}

export function buildIcsContent({ serviceName, masterName, date, startTime, endTime }) {
  const dtStart = toIcsDateTime(date, startTime);
  const dtEnd = toIcsDateTime(date, endTime);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${date}-${startTime}-${Math.random().toString(36).slice(2)}@kontraktova-beauty`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kontraktova Beauty//Booking//UK',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${serviceName} — Kontraktova Beauty`,
    `DESCRIPTION:Майстер: ${masterName}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcs(booking) {
  const content = buildIcsContent(booking);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kontraktova-beauty-запис.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
