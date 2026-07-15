import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { isValidUaPhone, normalizeUaPhone } from '../lib/phone.js';
import { notifyNewBooking } from '../lib/telegram.js';
import {
  toMinutes,
  toHHMM,
  rangesOverlap,
  SLOT_STEP_MIN,
  dateToWeekday,
  isValidDateStr,
  isWithinBookingWindow,
  nowMinutesKyiv,
  todayStr,
} from '../lib/time.js';

const bookings = new Hono();

const ACTIVE_STATUSES = ['нова', 'підтверджена'];
const ALL_STATUSES = ['нова', 'підтверджена', 'скасована', 'виконана'];

async function getAvailableSlots(db, { service, master, date }) {
  if (JSON.parse(master.days_off || '[]').includes(dateToWeekday(date))) return [];

  const workStart = toMinutes(master.work_start);
  const workEnd = toMinutes(master.work_end);
  const duration = service.duration_min;

  const { results: existing } = await db
    .prepare(
      `SELECT start_time, end_time FROM bookings
       WHERE master_id = ? AND date = ? AND status IN ('нова', 'підтверджена')`
    )
    .bind(master.id, date)
    .all();
  const busy = existing.map((b) => [toMinutes(b.start_time), toMinutes(b.end_time)]);

  const isToday = date === todayStr();
  const nowMin = isToday ? nowMinutesKyiv() : 0;

  const slots = [];
  for (let start = workStart; start + duration <= workEnd; start += SLOT_STEP_MIN) {
    if (isToday && start <= nowMin) continue;
    const end = start + duration;
    const clashes = busy.some(([bs, be]) => rangesOverlap(start, end, bs, be));
    if (!clashes) slots.push(toHHMM(start));
  }
  return slots;
}

bookings.get('/slots', async (c) => {
  const serviceId = c.req.query('service_id');
  const masterId = c.req.query('master_id');
  const date = c.req.query('date');

  if (!serviceId || !masterId || !isValidDateStr(date)) {
    return c.json({ error: "Потрібні параметри service_id, master_id, date" }, 400);
  }
  if (!isWithinBookingWindow(date)) {
    return c.json({ error: 'Дата поза межами доступного періоду (2 тижні)' }, 400);
  }

  const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ? AND active = 1')
    .bind(serviceId)
    .first();
  const master = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ? AND active = 1')
    .bind(masterId)
    .first();
  if (!service || !master) return c.json({ error: 'Послугу або майстра не знайдено' }, 404);

  const slots = await getAvailableSlots(c.env.DB, { service, master, date });
  return c.json({ slots });
});

// Honeypot field name the frontend leaves empty and hides from real users
// with CSS; bots that auto-fill every field trip it. Kept vague on purpose.
const HONEYPOT_FIELD = 'website';
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX_BOOKINGS = 3;

bookings.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { service_id, master_id, date, start_time, client_name, client_phone, comment } = body;

  if (body[HONEYPOT_FIELD]) {
    // Pretend to succeed so the bot doesn't learn it was caught, but never
    // touch the database or Telegram.
    return c.json({ id: 0, status: 'нова', date, start_time }, 201);
  }

  if (!service_id || !master_id || !isValidDateStr(date) || !start_time) {
    return c.json({ error: "Заповніть усі обов'язкові поля запису" }, 400);
  }
  if (!client_name || typeof client_name !== 'string' || !client_name.trim()) {
    return c.json({ error: "Вкажіть ім'я" }, 400);
  }
  if (!isValidUaPhone(client_phone)) {
    return c.json({ error: 'Телефон має бути у форматі +380XXXXXXXXX' }, 400);
  }
  if (!isWithinBookingWindow(date)) {
    return c.json({ error: 'Дата поза межами доступного періоду (2 тижні)' }, 400);
  }

  const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ? AND active = 1')
    .bind(service_id)
    .first();
  const master = await c.env.DB.prepare('SELECT * FROM masters WHERE id = ? AND active = 1')
    .bind(master_id)
    .first();
  if (!service || !master) return c.json({ error: 'Послугу або майстра не знайдено' }, 404);
  if (service.master_id && service.master_id !== master.id) {
    return c.json({ error: 'Цю послугу виконує інший майстер' }, 400);
  }

  const availableSlots = await getAvailableSlots(c.env.DB, { service, master, date });
  if (!availableSlots.includes(start_time)) {
    return c.json({ error: 'Цей час вже зайнято або недоступний, оберіть інший' }, 409);
  }

  const startMin = toMinutes(start_time);
  const endTime = toHHMM(startMin + service.duration_min);
  const phone = normalizeUaPhone(client_phone);

  const recentCount = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM bookings
     WHERE client_phone = ? AND created_at >= datetime('now', ?)`
  )
    .bind(phone, `-${RATE_LIMIT_WINDOW_MIN} minutes`)
    .first();
  if (recentCount.n >= RATE_LIMIT_MAX_BOOKINGS) {
    return c.json({ error: 'Забагато спроб запису поспіль. Спробуйте, будь ласка, за кілька хвилин.' }, 429);
  }

  // Re-check for a clash at insert time (best-effort race guard; D1 has no
  // cross-request transactions from a Worker, so we minimize the window
  // between the slots check above and this insert).
  const clash = await c.env.DB.prepare(
    `SELECT id FROM bookings
     WHERE master_id = ? AND date = ? AND status IN ('нова', 'підтверджена')
       AND NOT (end_time <= ? OR start_time >= ?)`
  )
    .bind(master_id, date, start_time, endTime)
    .first();
  if (clash) {
    return c.json({ error: 'Цей час щойно зайняли, оберіть інший' }, 409);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO bookings (service_id, master_id, date, start_time, end_time, client_name, client_phone, comment, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'нова')`
  )
    .bind(service_id, master_id, date, start_time, endTime, client_name.trim(), phone, comment || null)
    .run();

  const created = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  const notifyResult = await notifyNewBooking(c.env, c.env.DB, {
    category: service.category,
    serviceName: service.name,
    masterName: master.name,
    date,
    startTime: start_time,
    clientName: created.client_name,
    clientPhone: created.client_phone,
    comment: created.comment,
  });
  if (notifyResult.ok) {
    await c.env.DB.prepare('UPDATE bookings SET telegram_notified = 1 WHERE id = ?').bind(created.id).run();
  }

  return c.json({ ...created, service, master }, 201);
});

// --- Admin-only below ---

bookings.get('/', requireAdmin, async (c) => {
  const status = c.req.query('status');
  const masterId = c.req.query('master_id');
  const from = c.req.query('from');
  const to = c.req.query('to');

  const clauses = [];
  const binds = [];
  if (status && ALL_STATUSES.includes(status)) {
    clauses.push('b.status = ?');
    binds.push(status);
  }
  if (masterId) {
    clauses.push('b.master_id = ?');
    binds.push(masterId);
  }
  if (from) {
    clauses.push('b.date >= ?');
    binds.push(from);
  }
  if (to) {
    clauses.push('b.date <= ?');
    binds.push(to);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const query = `
    SELECT b.*, s.name as service_name, s.category as service_category, s.price as service_price,
           m.name as master_name
    FROM bookings b
    JOIN services s ON s.id = b.service_id
    JOIN masters m ON m.id = b.master_id
    ${where}
    ORDER BY b.date DESC, b.start_time DESC
  `;
  const stmt = c.env.DB.prepare(query);
  const { results } = await (binds.length ? stmt.bind(...binds) : stmt).all();
  return c.json(results);
});

bookings.patch('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const existing = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
  if (!existing) return c.json({ error: 'Запис не знайдено' }, 404);

  const status = body.status !== undefined ? body.status : existing.status;
  if (!ALL_STATUSES.includes(status)) return c.json({ error: 'Некоректний статус' }, 400);

  const final_price =
    body.final_price !== undefined ? (body.final_price === null ? null : Number(body.final_price)) : existing.final_price;

  let date = body.date ?? existing.date;
  let start_time = body.start_time ?? existing.start_time;
  let end_time = existing.end_time;

  if (body.start_time || body.date) {
    const service = await c.env.DB.prepare('SELECT * FROM services WHERE id = ?')
      .bind(existing.service_id)
      .first();
    end_time = toHHMM(toMinutes(start_time) + service.duration_min);

    const clash = await c.env.DB.prepare(
      `SELECT id FROM bookings
       WHERE master_id = ? AND date = ? AND status IN ('нова', 'підтверджена') AND id != ?
         AND NOT (end_time <= ? OR start_time >= ?)`
    )
      .bind(existing.master_id, date, id, start_time, end_time)
      .first();
    if (clash) return c.json({ error: 'Цей час вже зайнято іншим записом' }, 409);
  }

  await c.env.DB.prepare(
    'UPDATE bookings SET status = ?, date = ?, start_time = ?, end_time = ?, final_price = ? WHERE id = ?'
  )
    .bind(status, date, start_time, end_time, final_price, id)
    .run();

  const updated = await c.env.DB.prepare('SELECT * FROM bookings WHERE id = ?').bind(id).first();
  return c.json(updated);
});

bookings.delete('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare('DELETE FROM bookings WHERE id = ?').bind(id).run();
  return c.json({ ok: true });
});

export default bookings;
