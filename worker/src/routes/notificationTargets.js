import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { CATEGORIES } from '../lib/categories.js';

const notificationTargets = new Hono();
notificationTargets.use('*', requireAdmin);

const VALID_CATEGORIES = [...CATEGORIES, 'fallback'];

notificationTargets.get('/', async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM notification_targets ORDER BY category').all();
  return c.json(results);
});

notificationTargets.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { category, telegram_chat_id, label } = body;
  if (!VALID_CATEGORIES.includes(category) || !telegram_chat_id) {
    return c.json({ error: 'Некоректна категорія або chat_id' }, 400);
  }
  await c.env.DB.prepare(
    `INSERT INTO notification_targets (category, telegram_chat_id, label) VALUES (?, ?, ?)
     ON CONFLICT(category) DO UPDATE SET telegram_chat_id = excluded.telegram_chat_id, label = excluded.label`
  )
    .bind(category, String(telegram_chat_id), label || null)
    .run();

  const saved = await c.env.DB.prepare('SELECT * FROM notification_targets WHERE category = ?')
    .bind(category)
    .first();
  return c.json(saved, 201);
});

notificationTargets.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM notification_targets WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

export default notificationTargets;
