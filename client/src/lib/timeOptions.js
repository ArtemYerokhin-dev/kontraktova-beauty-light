// Half-hour options from 06:00 to 23:30 — a plain <select> is far more
// reliable to click through than the native browser time-segment widget.
export const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30;
  const h = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const m = (totalMin % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
});
