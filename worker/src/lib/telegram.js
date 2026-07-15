import { CATEGORY_LABELS } from './categories.js';

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
}

export function buildBookingMessage(booking) {
  const lines = [
    '🔔 Новий запис',
    '',
    `Послуга: ${escapeHtml(booking.serviceName)}`,
    `Майстер: ${escapeHtml(booking.masterName)}`,
    `Дата: ${booking.date}, ${booking.startTime}`,
    `Клієнт: ${escapeHtml(booking.clientName)}, ${escapeHtml(booking.clientPhone)}`,
  ];
  if (booking.comment) lines.push(`Коментар: ${escapeHtml(booking.comment)}`);
  return lines.join('\n');
}

// Looks up the chat id for the booking's service category, falling back to the
// 'fallback' target row if the category has none configured. Never throws —
// failures are logged and swallowed so booking creation is never blocked.
export async function notifyNewBooking(env, db, booking) {
  try {
    const specific = await db
      .prepare('SELECT telegram_chat_id FROM notification_targets WHERE category = ?')
      .bind(booking.category)
      .first();
    const fallback = specific
      ? null
      : await db
          .prepare("SELECT telegram_chat_id FROM notification_targets WHERE category = 'fallback'")
          .first();

    const chatId = specific?.telegram_chat_id || fallback?.telegram_chat_id;
    if (!chatId) {
      console.warn('No Telegram target configured for category', booking.category, 'and no fallback set');
      return { ok: false, reason: 'no_target' };
    }

    const token = env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN not configured');
      return { ok: false, reason: 'no_token' };
    }

    const text = buildBookingMessage(booking);
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('Telegram sendMessage failed', res.status, body);
      return { ok: false, reason: 'telegram_error', status: res.status };
    }
    return { ok: true };
  } catch (err) {
    console.error('notifyNewBooking threw', err);
    return { ok: false, reason: 'exception' };
  }
}

export { CATEGORY_LABELS };
