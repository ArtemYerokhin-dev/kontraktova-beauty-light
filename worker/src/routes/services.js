import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { isValidCategory } from '../lib/categories.js';

const services = new Hono();

services.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services WHERE active = 1 ORDER BY category, name'
  ).all();
  return c.json(results);
});

// --- Admin-only below ---

services.get('/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM services ORDER BY category, name').all();
  return c.json(results);
});

services.post('/', requireAdmin, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { name, category, duration_min, price, master_id } = body;
  if (!name || !isValidCategory(category) || !Number.isFinite(duration_min) || !Number.isFinite(price)) {
    return c.json({ error: 'Некоректні дані послуги' }, 400);
  }
  const result = await c.env.DB.prepare(
    'INSERT INTO services (name, category, duration_min, price, master_id, active) VALUES (?, ?, ?, ?, ?, 1)'
  )
    .bind(name, category, duration_min, price, master_id ?? null)
    .run();
  const created = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();
  return c.json(created, 201);
});

services.put('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Послугу не знайдено' }, 404);

  const name = body.name ?? existing.name;
  const category = body.category ?? existing.category;
  const duration_min = body.duration_min ?? existing.duration_min;
  const price = body.price ?? existing.price;
  const master_id = body.master_id !== undefined ? body.master_id : existing.master_id;
  const active = body.active !== undefined ? (body.active ? 1 : 0) : existing.active;

  if (!isValidCategory(category)) return c.json({ error: 'Некоректна категорія' }, 400);

  await c.env.DB.prepare(
    'UPDATE services SET name = ?, category = ?, duration_min = ?, price = ?, master_id = ?, active = ? WHERE id = ?'
  )
    .bind(name, category, duration_min, price, master_id, active, id)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?').bind(id).first();
  return c.json(updated);
});

services.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

export default services;
