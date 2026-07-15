import { Hono } from 'hono';
import { signMasterToken, setMasterCookie, clearMasterCookie, requireMaster } from '../lib/auth.js';

const masterAuth = new Hono();

function parseMaster(row) {
  if (!row) return row;
  const { pin, ...rest } = row;
  return {
    ...rest,
    categories: JSON.parse(row.categories || '[]'),
    days_off: JSON.parse(row.days_off || '[]'),
  };
}

masterAuth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const pin = (body.pin || '').trim();
  if (!pin) return c.json({ error: 'Введіть PIN-код' }, 400);

  const master = await c.env.DB.prepare('SELECT * FROM masters WHERE pin = ? AND active = 1').bind(pin).first();
  if (!master) return c.json({ error: 'Невірний PIN-код' }, 401);

  const token = await signMasterToken(c.env.JWT_SECRET, master.id);
  setMasterCookie(c, token);
  return c.json({ ok: true, master: parseMaster(master) });
});

masterAuth.post('/logout', (c) => {
  clearMasterCookie(c);
  return c.json({ ok: true });
});

masterAuth.get('/me', requireMaster, async (c) => {
  const master = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ?').bind(c.get('masterId')).first();
  if (!master) return c.json({ error: 'Майстра не знайдено' }, 404);
  return c.json(parseMaster(master));
});

// Self-service: a master may only edit their own work_start / work_end /
// days_off — nothing else (name, categories, pin, active stay admin-only).
masterAuth.patch('/me/schedule', requireMaster, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { work_start, work_end, days_off } = body;
  if (!work_start || !work_end || !Array.isArray(days_off)) {
    return c.json({ error: 'Некоректні дані графіка' }, 400);
  }

  await c.env.DB.prepare('UPDATE masters SET work_start = ?, work_end = ?, days_off = ? WHERE id = ?')
    .bind(work_start, work_end, JSON.stringify(days_off), c.get('masterId'))
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ?').bind(c.get('masterId')).first();
  return c.json(parseMaster(updated));
});

export default masterAuth;
