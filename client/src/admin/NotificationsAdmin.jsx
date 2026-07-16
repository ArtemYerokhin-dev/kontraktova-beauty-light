import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES } from '../lib/categories.js';
import Button from '../components/Button.jsx';

const ROWS = [...CATEGORIES.map((c) => ({ code: c.code, label: c.label })), { code: 'fallback', label: 'Загальний (fallback)' }];

export default function NotificationsAdmin() {
  const [targets, setTargets] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(null);

  async function load() {
    const list = await api.getNotificationTargets().catch(() => []);
    setTargets(list);
    const nextDrafts = {};
    for (const row of ROWS) {
      const existing = list.find((t) => t.category === row.code);
      nextDrafts[row.code] = { telegram_chat_id: existing?.telegram_chat_id || '', label: existing?.label || '' };
    }
    setDrafts(nextDrafts);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(code) {
    setSaving(code);
    try {
      await api.saveNotificationTarget({ category: code, ...drafts[code] });
      await load();
    } finally {
      setSaving(null);
    }
  }

  async function remove(code) {
    const existing = targets.find((t) => t.category === code);
    if (!existing) return;
    if (!confirm('Прибрати чат для цієї категорії?')) return;
    await api.deleteNotificationTarget(existing.id);
    await load();
  }

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold">Сповіщення в Telegram</h2>
      <p className="mb-5 text-sm text-black/40">
        Прив'яжіть chat_id Telegram-чату до кожної категорії послуг. Коли клієнт створює новий запис, бот
        надішле повідомлення у відповідний чат. Якщо для категорії нічого не вказано — спрацює загальний
        (fallback) чат.
      </p>

      <div className="space-y-3">
        {ROWS.map((row) => {
          const isSet = targets.some((t) => t.category === row.code);
          return (
            <div key={row.code} className="rounded-xl border border-black/10 bg-surface p-4">
              <p className="mb-3 font-medium">{row.label}</p>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={drafts[row.code]?.telegram_chat_id || ''}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [row.code]: { ...d[row.code], telegram_chat_id: e.target.value } }))
                  }
                  placeholder="Telegram chat_id (напр. -1001234567890)"
                  className="input"
                />
                <input
                  value={drafts[row.code]?.label || ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [row.code]: { ...d[row.code], label: e.target.value } }))}
                  placeholder="Назва (напр. ім'я майстра)"
                  className="input"
                />
                <div className="flex gap-2">
                  <Button onClick={() => save(row.code)} disabled={saving === row.code}>
                    {saving === row.code ? '…' : 'Зберегти'}
                  </Button>
                  {isSet && (
                    <button onClick={() => remove(row.code)} className="text-sm text-red-600 hover:text-red-700">
                      Прибрати
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
