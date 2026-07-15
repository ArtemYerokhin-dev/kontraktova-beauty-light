import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES, WEEKDAY_LABELS, WEEKDAY_ORDER } from '../lib/categories.js';
import { TIME_OPTIONS } from '../lib/timeOptions.js';
import Button from '../components/Button.jsx';

export default function MasterPage() {
  const [master, setMaster] = useState(null); // null = checking, false = not logged in
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    api
      .masterMe()
      .then(setMaster)
      .catch(() => setMaster(false));
  }, []);

  async function login(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const { master } = await api.masterLogin(pin);
      setMaster(master);
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    await api.masterLogout();
    setMaster(false);
    setPin('');
  }

  if (master === null) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-black/40">Завантаження…</div>;
  }

  if (!master) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-5">
        <form onSubmit={login} className="w-full max-w-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Kontraktova Beauty</p>
          <h1 className="mt-1 mb-6 text-2xl font-semibold">Кабінет майстра</h1>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="PIN-код"
            inputMode="numeric"
            autoFocus
            className="input"
          />
          {loginError && <p className="mt-2 text-sm text-red-400">{loginError}</p>}
          <Button type="submit" disabled={loggingIn} className="mt-4 w-full">
            {loggingIn ? 'Вхід…' : 'Увійти'}
          </Button>
        </form>
      </div>
    );
  }

  return <ScheduleEditor master={master} onLogout={logout} />;
}

function ScheduleEditor({ master, onLogout }) {
  const [workStart, setWorkStart] = useState(master.work_start);
  const [workEnd, setWorkEnd] = useState(master.work_end);
  const [daysOff, setDaysOff] = useState(master.days_off);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function toggleDayOff(day) {
    setSaved(false);
    setDaysOff((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));
  }

  async function save() {
    setSaving(true);
    setError('');
    try {
      await api.updateMySchedule({ work_start: workStart, work_end: workEnd, days_off: daysOff });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Kontraktova Beauty</p>
            <h1 className="mt-1 text-2xl font-semibold">Привіт, {master.name}!</h1>
            <p className="mt-1 text-sm text-black/40">
              {master.categories.map((c) => CATEGORIES.find((x) => x.code === c)?.label).join(', ')}
            </p>
          </div>
          <button onClick={onLogout} className="text-sm text-black/40 duration-150 hover:text-ink">
            Вийти
          </button>
        </div>

        <div className="space-y-5 rounded-2xl border border-black/10 bg-surface p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm text-black/50">
              Початок роботи
              <select
                value={workStart}
                onChange={(e) => {
                  setWorkStart(e.target.value);
                  setSaved(false);
                }}
                className="input mt-1"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-black/50">
              Кінець роботи
              <select
                value={workEnd}
                onChange={(e) => {
                  setWorkEnd(e.target.value);
                  setSaved(false);
                }}
                className="input mt-1"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <p className="mb-1.5 text-sm text-black/50">Вихідні дні</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDayOff(day)}
                  className={`h-10 w-10 rounded-lg border text-sm duration-150 ${
                    daysOff.includes(day)
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-black/10 text-black/50'
                  }`}
                >
                  {WEEKDAY_LABELS[day]}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {saved && !error && <p className="text-sm text-emerald-400">Збережено</p>}

          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Зберігаємо…' : 'Зберегти графік'}
          </Button>
        </div>

        <p className="mt-4 text-xs text-black/30">
          Тут можна змінити лише робочі години та вихідні дні. Категорії послуг, ім'я та PIN редагує
          адміністратор.
        </p>
      </div>
    </div>
  );
}
