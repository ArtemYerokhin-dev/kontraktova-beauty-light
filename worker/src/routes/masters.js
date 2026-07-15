import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';

const masters = new Hono();

function parseMaster(row) {
  if (!row) return row;
  const { pin, ...rest } = row;
  return {
    ...rest,
    categories: JSON.parse(row.categories || '[]'),
    days_off: JSON.parse(row.days_off || '[]'),
  };
}

// Admin views include the PIN (owner needs to read it back to hand to the master).
function parseMasterWithPin(row) {
  if (!row) return row;
  return {
    ...row,
    categories: JSON.parse(row.categories || '[]'),
    days_off: JSON.parse(row.days_off || '[]'),
  };
}

masters.get('/', async (c) => {
  const category = c.req.query('category');
  const { results } = await c.env.DB.prepare('SELECT * FROM masters WHERE active = 1 ORDER BY name').all();
  const filtered = category
    ? results.filter((r) => JSON.parse(r.categories || '[]').includes(category))
    : results;
  return c.json(filtered.map(parseMaster));
});

// --- Admin-only below ---

masters.get('/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM masters ORDER BY name').all();
  return c.json(results.map(parseMasterWithPin));
});

masters.post('/', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, categories, work_start, work_end, days_off, pin } = body;
  if (!name) return c.json({ error: "Ім'я обов'язкове" }, 400);
  if (pin) {
    const clash = await c.env.DB.prepare('SELECT id FROM masters WHERE pin = ?').bind(pin).first();
    if (clash) return c.json({ error: 'Такий PIN вже використовується іншим майстром' }, 409);
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO masters (name, categories, work_start, work_end, days_off, pin, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
  )
    .bind(
      name,
      JSON.stringify(categories ?? []),
      work_start ?? '09:00',
      work_end ?? '18:00',
      JSON.stringify(days_off ?? [0]),
      pin || null
    )
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();
  return c.json(parseMasterWithPin(created), 201);
});

masters.put('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Майстра не знайдено' }, 404);

  const name = body.name ?? existing.name;
  const categories = body.categories !== undefined ? JSON.stringify(body.categories) : existing.categories;
  const work_start = body.work_start ?? existing.work_start;
  const work_end = body.work_end ?? existing.work_end;
  const days_off = body.days_off !== undefined ? JSON.stringify(body.days_off) : existing.days_off;
  const active = body.active !== undefined ? (body.active ? 1 : 0) : existing.active;
  const pin = body.pin !== undefined ? body.pin || null : existing.pin;

  if (pin) {
    const clash = await c.env.DB.prepare('SELECT id FROM masters WHERE pin = ? AND id != ?').bind(pin, id).first();
    if (clash) return c.json({ error: 'Такий PIN вже використовується іншим майстром' }, 409);
  }

  await c.env.DB.prepare(
    'UPDATE masters SET name = ?, categories = ?, work_start = ?, work_end = ?, days_off = ?, active = ?, pin = ? WHERE id = ?'
  )
    .bind(name, categories, work_start, work_end, days_off, active, pin, id)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ?').bind(id).first();
  return c.json(parseMasterWithPin(updated));
});

masters.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM masters WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

export default masters;
