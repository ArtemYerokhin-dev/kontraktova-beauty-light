import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { CATEGORIES, CATEGORY_LABELS } from '../lib/categories.js';
import { nextTwoWeeks, formatDateUa } from '../lib/dates.js';
import { isValidUaPhone, formatUaPhoneInput } from '../lib/phone.js';
import { downloadIcs } from '../lib/ics.js';
import { downloadTicketPng } from '../lib/ticket.js';
import Button from '../components/Button.jsx';
import StepProgress from '../components/StepProgress.jsx';

const WEEKDAY_SHORT = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function BookingPage() {
  const [step, setStep] = useState(1);
  const [allServices, setAllServices] = useState([]);
  const [category, setCategory] = useState(null);
  const [service, setService] = useState(null);
  const [masters, setMasters] = useState([]);
  const [master, setMaster] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [time, setTime] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+380');
  const [comment, setComment] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — left empty by real users
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  useEffect(() => {
    api.getServices().then(setAllServices).catch(() => setAllServices([]));
  }, []);

  const servicesForCategory = useMemo(
    () => allServices.filter((s) => s.category === category),
    [allServices, category]
  );

  const days = useMemo(() => nextTwoWeeks(), []);

  function goTo(n) {
    setError('');
    setStep(n);
  }

  function pickCategory(code) {
    setCategory(code);
    setService(null);
    goTo(2);
  }

  async function pickService(svc) {
    setService(svc);
    setMaster(null);
    setDate(null);
    setTime(null);
    try {
      const list = await api.getMasters(svc.category);
      const filtered = svc.master_id ? list.filter((m) => m.id === svc.master_id) : list;
      setMasters(filtered);
    } catch {
      setMasters([]);
    }
    goTo(3);
  }

  function pickMaster(m) {
    setMaster(m);
    goTo(4);
  }

  async function pickDate(dateStr) {
    setDate(dateStr);
    setTime(null);
    setSlotsLoading(true);
    try {
      const { slots } = await api.getSlots(service.id, master.id, dateStr);
      setSlots(slots);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  }

  function pickTime(t) {
    setTime(t);
    goTo(5);
  }

  function submitContact(e) {
    e.preventDefault();
    if (!clientName.trim()) return setError("Вкажіть ім'я");
    if (!isValidUaPhone(clientPhone)) return setError('Телефон має бути у форматі +380XXXXXXXXX');
    goTo(6);
  }

  async function confirmBooking() {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createBooking({
        service_id: service.id,
        master_id: master.id,
        date,
        start_time: time,
        client_name: clientName.trim(),
        client_phone: clientPhone,
        comment: comment.trim() || undefined,
        website,
      });
      setCreated(result);
      goTo(7);
    } catch (err) {
      setError(err.message);
      if (err.status === 409) {
        // slot got taken — refresh availability and bounce back to time picker
        pickDate(date);
        goTo(4);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function startOver() {
    setStep(1);
    setCategory(null);
    setService(null);
    setMaster(null);
    setDate(null);
    setTime(null);
    setClientName('');
    setClientPhone('+380');
    setComment('');
    setWebsite('');
    setCreated(null);
    setError('');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-lg px-5 py-10 sm:py-16">
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-accent">Kontraktova Beauty</p>
          <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">Онлайн-запис</h1>
        </header>

        {step <= 6 && <StepProgress step={step} />}

        {step === 1 && (
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.code}
                onClick={() => pickCategory(cat.code)}
                className="flex w-full items-center gap-4 rounded-2xl border border-black/10 bg-surface p-3 text-left duration-150 hover:border-accent/60 hover:bg-black/[0.04]"
              >
                <img
                  src={cat.image}
                  alt=""
                  loading="lazy"
                  className="h-16 w-16 flex-shrink-0 rounded-xl object-cover"
                />
                <span className="flex-1 text-base font-medium">{cat.label}</span>
                <span className="pr-2 text-black/30">→</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <BackLink onClick={() => goTo(1)} />
            <div className="space-y-3">
              {servicesForCategory.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => pickService(svc)}
                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-black/10 bg-surface px-5 py-4 text-left duration-150 hover:border-accent/60 hover:bg-black/[0.04]"
                >
                  <span>
                    <span className="block font-medium">{svc.name}</span>
                    <span className="mt-1 block text-sm text-black/40">{svc.duration_min} хв</span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap font-semibold text-accent">~{svc.price} ₴</span>
                </button>
              ))}
              {servicesForCategory.length === 0 && (
                <p className="text-sm text-black/40">Наразі немає доступних послуг у цій категорії.</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <BackLink onClick={() => goTo(2)} />
            <div className="space-y-3">
              {masters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickMaster(m)}
                  className="flex w-full items-center justify-between rounded-2xl border border-black/10 bg-surface px-5 py-4 text-left duration-150 hover:border-accent/60 hover:bg-black/[0.04]"
                >
                  <span className="font-medium">{m.name}</span>
                  <span className="text-sm text-black/40">
                    {m.work_start}–{m.work_end}
                  </span>
                </button>
              ))}
              {masters.length === 0 && (
                <p className="text-sm text-black/40">Немає доступних майстрів для цієї послуги.</p>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <BackLink onClick={() => goTo(3)} />
            <p className="mb-3 text-sm text-black/50">Оберіть дату</p>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => (
                <button
                  key={d.dateStr}
                  onClick={() => pickDate(d.dateStr)}
                  className={`flex min-w-[56px] flex-col items-center rounded-xl border px-3 py-2.5 duration-150 ${
                    date === d.dateStr
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-black/10 bg-surface hover:border-black/25'
                  }`}
                >
                  <span className="text-[11px] uppercase text-black/40">{WEEKDAY_SHORT[d.weekday]}</span>
                  <span className="mt-0.5 text-lg font-semibold">{d.day}</span>
                </button>
              ))}
            </div>

            {date && (
              <>
                <p className="mb-3 text-sm text-black/50">Оберіть час</p>
                {slotsLoading && <p className="text-sm text-black/40">Завантаження…</p>}
                {!slotsLoading && slots.length === 0 && (
                  <p className="text-sm text-black/40">На цю дату немає вільних слотів.</p>
                )}
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                  {slots.map((t) => (
                    <button
                      key={t}
                      onClick={() => pickTime(t)}
                      className="rounded-lg border border-black/10 bg-surface py-3 text-sm duration-150 hover:border-accent/60 hover:text-accent"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {step === 5 && (
          <form onSubmit={submitContact}>
            <BackLink onClick={() => goTo(4)} />
            <div className="space-y-4">
              {/* Honeypot: hidden from real users, bots that fill every field trip it */}
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="absolute left-[-9999px] h-0 w-0 opacity-0"
                aria-hidden="true"
              />
              <Field label="Ім'я">
                <input
                  autoFocus
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input"
                  placeholder="Ваше ім'я"
                />
              </Field>
              <Field label="Телефон">
                <input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatUaPhoneInput(e.target.value))}
                  className="input"
                  placeholder="+380XXXXXXXXX"
                  inputMode="tel"
                />
              </Field>
              <Field label="Коментар (необов'язково)">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Побажання чи запитання"
                />
              </Field>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                Далі
              </Button>
            </div>
          </form>
        )}

        {step === 6 && (
          <div>
            <BackLink onClick={() => goTo(5)} />
            <div className="rounded-2xl border border-black/10 bg-surface p-5">
              <SummaryRow label="Послуга" value={service?.name} />
              <SummaryRow label="Майстер" value={master?.name} />
              <SummaryRow label="Дата" value={date && formatDateUa(date)} />
              <SummaryRow label="Час" value={time} />
              <SummaryRow label="Тривалість" value={`${service?.duration_min} хв`} />
              <SummaryRow label="Ім'я" value={clientName} />
              <SummaryRow label="Телефон" value={clientPhone} />
              {comment && <SummaryRow label="Коментар" value={comment} />}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-4">
                <span className="text-black/50">Орієнтовна вартість</span>
                <span className="shrink-0 whitespace-nowrap text-lg font-semibold text-accent">~{service?.price} ₴</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-black/30">
              Точну суму майстер підтвердить на місці — вона може відрізнятись залежно від довжини, форми тощо.
            </p>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <Button onClick={confirmBooking} disabled={submitting} className="mt-5 w-full">
              {submitting ? 'Записуємо…' : 'Підтвердити запис'}
            </Button>
          </div>
        )}

        {step === 7 && created && (
          <div className="text-center">
            <div className="mb-5 text-5xl">✓</div>
            <h2 className="text-xl font-semibold">Вас записано!</h2>
            <p className="mt-2 text-black/50">Чекаємо на вас у салоні</p>

            <div className="mt-6 rounded-2xl border border-black/10 bg-surface p-5 text-left">
              <SummaryRow label="Послуга" value={service?.name} />
              <SummaryRow label="Майстер" value={master?.name} />
              <SummaryRow label="Дата" value={date && formatDateUa(date)} />
              <SummaryRow label="Час" value={time} />
            </div>

            <div className="mt-5 space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  downloadTicketPng({
                    serviceName: service.name,
                    masterName: master.name,
                    dateLabel: date && formatDateUa(date),
                    startTime: time,
                    endTime: created.end_time,
                    clientName,
                    clientPhone,
                  })
                }
              >
                Зберегти квиток (зображення)
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  downloadIcs({
                    serviceName: service.name,
                    masterName: master.name,
                    date,
                    startTime: time,
                    endTime: created.end_time,
                  })
                }
              >
                Додати в календар
              </Button>
              <Button variant="ghost" className="w-full" onClick={startOver}>
                Новий запис
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BackLink({ onClick }) {
  return (
    <button onClick={onClick} className="mb-4 text-sm text-black/40 duration-150 hover:text-ink">
      ← Назад
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-black/50">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-black/50">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
