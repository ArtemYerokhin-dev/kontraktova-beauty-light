import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES } from '../lib/categories.js';
import Button from '../components/Button.jsx';

const EMPTY = { name: '', category: CATEGORIES[0].code, duration_min: 60, price: 0, master_id: '', active: true };

export default function ServicesAdmin() {
  const [services, setServices] = useState([]);
  const [masters, setMasters] = useState([]);
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit

  async function load() {
    setServices(await api.getAllServices().catch(() => []));
  }

  useEffect(() => {
    load();
    api.getAllMasters().then(setMasters).catch(() => setMasters([]));
  }, []);

  async function save(form) {
    const body = {
      name: form.name,
      category: form.category,
      duration_min: Number(form.duration_min),
      price: Number(form.price),
      master_id: form.master_id ? Number(form.master_id) : null,
      active: !!form.active,
    };
    if (form.id) await api.updateService(form.id, body);
    else await api.createService(body);
    setEditing(null);
    await load();
  }

  async function remove(id) {
    if (!confirm('Видалити цю послугу?')) return;
    await api.deleteService(id);
    await load();
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Послуги</h2>
        <Button onClick={() => setEditing({ ...EMPTY })}>+ Додати послугу</Button>
      </div>

      <div className="space-y-2">
        {services.map((s) => (
          <div
            key={s.id}
            className={`flex flex-col gap-2 rounded-xl border border-black/10 bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
              !s.active ? 'opacity-40' : ''
            }`}
          >
            <div>
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-black/40">
                {s.duration_min} хв · {s.price} ₴
                {s.master_id ? ` · ${masters.find((m) => m.id === s.master_id)?.name || ''}` : ''}
              </p>
            </div>
            <div className="flex shrink-0 gap-5 sm:gap-3">
              <button onClick={() => setEditing(s)} className="-my-1.5 py-1.5 text-sm text-black/50 hover:text-ink">
                Редагувати
              </button>
              <button onClick={() => remove(s.id)} className="-my-1.5 py-1.5 text-sm text-red-600 hover:text-red-700">
                Видалити
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ServiceFormModal
          initial={editing}
          masters={masters}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function ServiceFormModal({ initial, masters, onClose, onSave }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial, master_id: initial.master_id || '' });

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onSave(form);
        }}
        className="w-full max-w-md space-y-3 rounded-t-2xl border border-black/10 bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-2xl sm:pb-5"
      >
        <h3 className="text-lg font-semibold">{form.id ? 'Редагувати послугу' : 'Нова послуга'}</h3>
        <input
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Назва"
          className="input"
        />
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="input"
        >
          {CATEGORIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            type="number"
            min="15"
            step="15"
            value={form.duration_min}
            onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
            placeholder="Тривалість, хв"
            className="input"
          />
          <input
            required
            type="number"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="Ціна, ₴"
            className="input"
          />
        </div>
        <select
          value={form.master_id}
          onChange={(e) => setForm({ ...form, master_id: e.target.value })}
          className="input"
        >
          <option value="">Будь-який майстер категорії</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-black/60">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          Активна (показувати клієнтам)
        </label>
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
