import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { ALL_STATUSES, STATUS_LABELS, CATEGORY_LABELS } from '../lib/categories.js';

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [masters, setMasters] = useState([]);
  const [status, setStatus] = useState('');
  const [masterId, setMasterId] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (masterId) params.master_id = masterId;
    const list = await api.getBookings(params).catch(() => []);
    setBookings(list);
    setLoading(false);
  }

  useEffect(() => {
    api.getAllMasters().then(setMasters).catch(() => setMasters([]));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, masterId]);

  async function setBookingStatus(b, newStatus) {
    await api.updateBooking(b.id, { status: newStatus });
    await load();
    setSelected(null);
  }

  async function setFinalPrice(b, price) {
    await api.updateBooking(b.id, { final_price: price });
    await load();
  }

  async function removeBooking(b) {
    if (!confirm('Видалити цей запис?')) return;
    await api.deleteBooking(b.id);
    await load();
    setSelected(null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="input w-auto">
          <option value="">Усі статуси</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select value={masterId} onChange={(e) => setMasterId(e.target.value)} className="input w-auto">
          <option value="">Усі майстри</option>
          {masters.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-black/40">Завантаження…</p>}
      {!loading && bookings.length === 0 && <p className="text-black/40">Записів немає.</p>}

      <div className="space-y-2">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b)}
            className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-surface px-4 py-3 text-left duration-150 hover:border-accent/50"
          >
            <div>
              <p className="font-medium">
                {b.date} · {b.start_time}–{b.end_time}
              </p>
              <p className="text-sm text-black/40">
                {b.service_name} · {b.master_name} · {b.client_name} · {b.client_phone} ·{' '}
                {b.final_price != null ? `${b.final_price} ₴` : `~${b.service_price} ₴`}
              </p>
            </div>
            <StatusBadge status={b.status} />
          </button>
        ))}
      </div>

      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelected(null)}
          onStatus={(s) => setBookingStatus(selected, s)}
          onPrice={(p) => setFinalPrice(selected, p)}
          onDelete={() => removeBooking(selected)}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const colors = {
    нова: 'bg-accent/15 text-accent',
    підтверджена: 'bg-emerald-500/15 text-emerald-400',
    скасована: 'bg-black/10 text-black/40',
    виконана: 'bg-sky-500/15 text-sky-400',
  };
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${colors[status] || ''}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function BookingDetailModal({ booking, onClose, onStatus, onPrice, onDelete }) {
  const [price, setPrice] = useState(booking.final_price ?? booking.service_price);
  const [savingPrice, setSavingPrice] = useState(false);

  async function savePrice() {
    setSavingPrice(true);
    try {
      await onPrice(Number(price));
    } finally {
      setSavingPrice(false);
    }
  }

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl border border-black/10 bg-surface p-5 sm:rounded-2xl"
      >
        <h3 className="text-lg font-semibold">Запис #{booking.id}</h3>
        <div className="mt-3 space-y-1.5 text-sm">
          <Row label="Послуга" value={`${booking.service_name} (${CATEGORY_LABELS[booking.service_category]})`} />
          <Row label="Майстер" value={booking.master_name} />
          <Row label="Дата" value={`${booking.date}, ${booking.start_time}–${booking.end_time}`} />
          <Row label="Клієнт" value={`${booking.client_name}, ${booking.client_phone}`} />
          {booking.comment && <Row label="Коментар" value={booking.comment} />}
        </div>

        <div className="mt-3">
          <p className="mb-1.5 text-sm text-black/50">
            Підсумкова вартість {booking.final_price == null && <span className="text-black/30">(орієнтовно ~{booking.service_price} ₴)</span>}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input"
            />
            <button
              onClick={savePrice}
              disabled={savingPrice}
              className="whitespace-nowrap rounded-xl border border-black/10 px-4 text-sm duration-150 hover:border-accent/60 disabled:opacity-40"
            >
              {savingPrice ? '…' : 'Зберегти'}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => onStatus(s)}
              disabled={s === booking.status}
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs duration-150 hover:border-accent/60 disabled:opacity-30"
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-between">
          <button onClick={onDelete} className="text-sm text-red-400 duration-150 hover:text-red-300">
            Видалити запис
          </button>
          <button onClick={onClose} className="text-sm text-black/40 duration-150 hover:text-ink">
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black/40">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
