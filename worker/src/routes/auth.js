import { Hono } from 'hono';
import { signAdminToken, setAdminCookie, clearAdminCookie, requireAdmin } from '../lib/auth.js';

const auth = new Hono();

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { password } = body;
  const adminPassword = c.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return c.json({ error: 'ADMIN_PASSWORD не налаштовано (wrangler secret put ADMIN_PASSWORD)' }, 500);
  }
  if (password !== adminPassword) {
    return c.json({ error: 'Невірний пароль' }, 401);
  }
  const token = await signAdminToken(c.env.JWT_SECRET);
  setAdminCookie(c, token);
  return c.json({ ok: true });
});

auth.post('/logout', (c) => {
  clearAdminCookie(c);
  return c.json({ ok: true });
});

auth.get('/me', requireAdmin, (c) => c.json({ ok: true }));

export default auth;
