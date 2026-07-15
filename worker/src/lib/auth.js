import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const COOKIE_NAME = 'kb_admin_token';
export const MASTER_COOKIE_NAME = 'kb_master_token';

function isHttps(c) {
  return new URL(c.req.url).protocol === 'https:';
}

function setAuthCookie(c, name, token) {
  setCookie(c, name, token, {
    httpOnly: true,
    sameSite: 'Lax',
    // Secure cookies are dropped by browsers/curl over plain http, which local
    // `wrangler dev` uses by default — only require it when actually on https
    // (always true once deployed behind Cloudflare).
    secure: isHttps(c),
    path: '/',
    maxAge: 12 * 60 * 60,
  });
}

export async function signAdminToken(secret) {
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  return sign({ role: 'admin', exp }, secret, 'HS256');
}

export function setAdminCookie(c, token) {
  setAuthCookie(c, COOKIE_NAME, token);
}

export function clearAdminCookie(c) {
  deleteCookie(c, COOKIE_NAME, { path: '/' });
}

export async function requireAdmin(c, next) {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return c.json({ error: 'Не авторизовано' }, 401);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.role !== 'admin') throw new Error('bad role');
  } catch {
    return c.json({ error: 'Сесія недійсна, увійдіть знову' }, 401);
  }
  await next();
}

export async function signMasterToken(secret, masterId) {
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60; // 12h
  return sign({ role: 'master', master_id: masterId, exp }, secret, 'HS256');
}

export function setMasterCookie(c, token) {
  setAuthCookie(c, MASTER_COOKIE_NAME, token);
}

export function clearMasterCookie(c) {
  deleteCookie(c, MASTER_COOKIE_NAME, { path: '/' });
}

// Attaches c.get('masterId') on success.
export async function requireMaster(c, next) {
  const token = getCookie(c, MASTER_COOKIE_NAME);
  if (!token) return c.json({ error: 'Не авторизовано' }, 401);
  try {
    const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
    if (payload.role !== 'master' || !payload.master_id) throw new Error('bad role');
    c.set('masterId', payload.master_id);
  } catch {
    return c.json({ error: 'Сесія недійсна, увійдіть знову' }, 401);
  }
  await next();
}
