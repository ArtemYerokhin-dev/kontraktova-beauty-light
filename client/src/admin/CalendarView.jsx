import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { toDateStr, formatDateDots } from '../lib/dates.js';
import { WEEKDAY_LABELS } from '../lib/categories.js';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function CalendarView() {
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [masters, setMasters] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    api.getAllMasters().then(setMasters).catch(() => setMasters([]));
  }, []);

  const days = useMemo(() => {
    if (mode === 'day') return [new Date(anchor)];
    const start = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [mode, anchor]);

  useEffect(() => {
    const from = toDateStr(days[0]);
    const to = toDateStr(days[days.length - 1]);
    api.getBookings({ from, to }).then(setBookings).catch(() => setBookings([]));
  }, [days]);

  function shift(delta) {
    const d = new Date(anchor);
    d.setDate(d.getDate() + delta * (mode === 'day' ? 1 : 7));
    setAnchor(d);
  }

  function bookingsFor(masterId, dateStr) {
    return bookings
      .filter((b) => b.master_id === masterId && b.date === dateStr && b.status !== 'скасована')
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-black/10 p-1">
          {['week', 'day'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm duration-150 ${
                mode === m ? 'bg-accent text-white' : 'text-black/50 hover:text-ink'
              }`}
            >
              {m === 'week' ? 'Тиждень' : 'День'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => shift(-1)} className="text-black/40 hover:text-ink">
            ←
          </button>
          <span className="text-sm text-black/60">
            {formatDateDots(toDateStr(days[0]))}
            {days.length > 1 ? ` — ${formatDateDots(toDateStr(days[days.length - 1]))}` : ''}
          </span>
          <button onClick={() => shift(1)} className="text-black/40 hover:text-ink">
            →
          </button>
        </div>
      </div>

      <div className="kb-scroll overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="sticky left-0 bg-bg p-2 text-left text-xs text-black/40">Майстер</th>
              {days.map((d) => (
                <th key={d.toISOString()} className="min-w-[140px] p-2 text-left text-xs text-black/40">
                  {WEEKDAY_LABELS[d.getDay()]} {d.getDate()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {masters.map((m) => (
              <tr key={m.id}>
                <td className="sticky left-0 bg-bg py-2 pr-3 text-sm font-medium">{m.name}</td>
                {days.map((d) => {
                  const dateStr = toDateStr(d);
                  const dayBookings = bookingsFor(m.id, dateStr);
                  return (
                    <td key={dateStr} className="border-t border-black/5 p-2 align-top">
                      <div className="space-y-1">
                        {dayBookings.map((b) => (
                          <div
                            key={b.id}
                            className="rounded-md bg-accent/10 px-2 py-1 text-xs text-accent"
                            title={`${b.client_name} · ${b.service_name}`}
                          >
                            {b.start_time} {b.client_name}
                          </div>
                        ))}
                        {dayBookings.length === 0 && <span className="text-xs text-black/15">—</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
