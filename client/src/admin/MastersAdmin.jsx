import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES, WEEKDAY_LABELS, WEEKDAY_ORDER } from '../lib/categories.js';
import { TIME_OPTIONS } from '../lib/timeOptions.js';
import Button from '../components/Button.jsx';

const EMPTY = { name: '', categories: [], work_start: '09:00', work_end: '18:00', days_off: [0], pin: '', active: true };

export default function MastersAdmin() {
  const [masters, setMasters] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saveError, setSaveError] = useState('');

  async function load() {
    setMasters(await api.getAllMasters().catch(() => []));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(form) {
    const body = {
      name: form.name,
      categories: form.categories,
      work_start: form.work_start,
      work_end: form.work_end,
      days_off: form.days_off,
      pin: form.pin?.trim() || null,
      active: !!form.active,
    };
    try {
      setSaveError('');
      if (form.id) await api.updateMaster(form.id, body);
      else await api.createMaster(body);
      setEditing(null);
      await load();
    } catch (err) {
      setSaveError(err.message);
    }
  }

  async function remove(id) {
    if (!confirm('Видалити цього майстра?')) return;
    await api.deleteMaster(id);
    await load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Майстри</h2>
        <Button onClick={() => setEditing({ ...EMPTY })}>+ Додати майстра</Button>
      </div>

      <div className="space-y-2">
        {masters.map((m) => (
          <div
            key={m.id}
            className={`flex items-center justify-between rounded-xl border border-black/10 bg-surface px-4 py-3 ${
              !m.active ? 'opacity-40' : ''
            }`}
          >
            <div>
              <p className="font-medium">{m.name}</p>
              <p className="text-sm text-black/40">
                {m.categories.map((c) => CATEGORIES.find((x) => x.code === c)?.label).join(', ')} ·{' '}
                {m.work_start}–{m.work_end} · вихідні:{' '}
                {WEEKDAY_ORDER.filter((d) => m.days_off.includes(d))
                  .map((d) => WEEKDAY_LABELS[d])
                  .join(', ')}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditing(m)} className="text-sm text-black/50 hover:text-ink">
                Редагувати
              </button>
              <button onClick={() => remove(m.id)} className="text-sm text-red-400 hover:text-red-300">
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <MasterFormModal
          initial={editing}
          error={saveError}
          onClose={() => {
            setEditing(null);
            setSaveError('');
          }}
          onSave={save}
        />
      )}
    </div>
  );
}

function MasterFormModal({ initial, error, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });

  function toggleCategory(code) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(code)
        ? f.categories.filter((c) => c !== code)
        : [...f.categories, code],
    }));
  }

  function toggleDayOff(day) {
    setForm((f) => ({
      ...f,
      days_off: f.days_off.includes(day) ? f.days_off.filter((d) => d !== day) : [...f.days_off, day],
    }));
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="w-full max-w-md space-y-3 rounded-t-2xl border border-black/10 bg-surface p-5 sm:rounded-2xl"
      >
        <h3 className="text-lg font-semibold">{form.id ? 'Редагувати майстра' : 'Новий майстер'}</h3>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ім'я"
          className="input"
        />

        <div>
          <p className="mb-1.5 text-sm text-black/50">Категорії послуг</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                type="button"
                key={c.code}
                onClick={() => toggleCategory(c.code)}
                className={`rounded-lg border px-3 py-1.5 text-sm duration-150 ${
                  form.categories.includes(c.code)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-black/10 text-black/50'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm text-black/50">
            Початок роботи
            <select
              value={form.work_start}
              onChange={(e) => setForm({ ...form, work_start: e.target.value })}
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
              value={form.work_end}
              onChange={(e) => setForm({ ...form, work_end: e.target.value })}
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
                type="button"
                key={day}
                onClick={() => toggleDayOff(day)}
                className={`h-9 w-9 rounded-lg border text-sm duration-150 ${
                  form.days_off.includes(day)
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-black/10 text-black/50'
                }`}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm text-black/50">
            PIN для власного кабінету майстра (необов'язково)
          </span>
          <input
            value={form.pin}
            onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            placeholder="напр. 4821"
            inputMode="numeric"
            className="input"
          />
          <span className="mt-1 block text-xs text-black/30">
            Майстер заходить на /master і вводить цей PIN, щоб самостійно міняти графік роботи.
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm text-black/60">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Активний (показувати клієнтам)
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="text-sm text-black/40 hover:text-ink">
            Скасувати
          </button>
          <Button type="submit">Зберегти</Button>
        </div>
      </form>
    </div>
  );
}
