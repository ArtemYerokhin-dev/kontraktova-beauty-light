# Kontraktova Beauty — онлайн-запис

Односторінковий флоу запису для бʼюті-салону (манікюр/педикюр, брови/перманент,
ламінування вій) + адмінка з Telegram-сповіщеннями.

## Стек

- **client/** — React + Vite + Tailwind CSS, деплой на Cloudflare Pages
- **worker/** — Hono на Cloudflare Workers, база даних Cloudflare D1
- Адмінка захищена паролем (`ADMIN_PASSWORD`), сесія — JWT у httpOnly cookie
- Сповіщення про нові записи — у Telegram, через Bot API

## Структура проєкту

```
kontraktova-beauty/
├── worker/            Cloudflare Worker (Hono + D1)
│   ├── src/
│   │   ├── index.js           точка входу, роутинг
│   │   ├── routes/            auth, services, masters, bookings, notificationTargets
│   │   └── lib/                auth (JWT), telegram, time, phone, categories
│   ├── migrations/            SQL-міграції для D1
│   └── wrangler.toml
└── client/            React SPA
    ├── src/pages/BookingPage.jsx    клієнтський флоу запису
    ├── src/admin/                   адмін-панель (/admin)
    └── src/lib/                     API-клієнт, форматування
```

---

## 1. Локальна розробка

### Backend (worker)

```bash
cd worker
npm install
cp .env.example .dev.vars   # заповніть ADMIN_PASSWORD, JWT_SECRET локально
npx wrangler d1 migrations apply kontraktova-beauty-db --local
npm run dev                 # wrangler dev на http://127.0.0.1:8787
```

### Frontend (client)

```bash
cd client
npm install
npm run dev                 # vite на http://localhost:5173, проксує /api на воркер
```

Відкрийте `http://localhost:5173` для клієнтської сторінки запису та
`http://localhost:5173/admin` для адмінки (пароль — значення `ADMIN_PASSWORD`
з `.dev.vars`).

---

## 2. Створення Telegram-бота (BotFather)

1. Відкрийте чат з [@BotFather](https://t.me/BotFather) у Telegram.
2. Надішліть `/newbot`, дайте боту імʼя та юзернейм (має закінчуватись на `bot`).
3. BotFather видасть токен виду `123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` —
   це і є `TELEGRAM_BOT_TOKEN`.
4. Додайте бота в потрібний чат/групу (або напишіть йому в особисті) — бот має
   вміти надсилати повідомлення саме туди, куди прив'язана категорія.

### Як дізнатись chat_id

**Особистий чат:** напишіть боту будь-яке повідомлення, потім відкрийте у браузері:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

У відповіді знайдіть `"chat":{"id": ...}` — це і є ваш `chat_id`.

**Груповий чат:** додайте бота в групу, напишіть у групі будь-яке повідомлення
(або команду), потім так само відкрийте `getUpdates` — id групи буде
від'ємним числом (напр. `-1001234567890`).

Отриманий `chat_id` впишіть в адмінці → розділ **«Сповіщення»** для потрібної
категорії послуг (або для «Загальний (fallback)», якщо хочете, щоб усі
непризначені категорії падали в один чат).

---

## 3. Деплой

### 3.1. Створення D1 бази

```bash
cd worker
npx wrangler d1 create kontraktova-beauty-db
```

Скопіюйте виданий `database_id` у `worker/wrangler.toml` (поле `database_id`
під `[[d1_databases]]`).

### 3.2. Міграції на прод-базу

```bash
npx wrangler d1 migrations apply kontraktova-beauty-db --remote
```

### 3.3. Secrets для Worker

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put JWT_SECRET
npx wrangler secret put TELEGRAM_BOT_TOKEN
```

Також оновіть `CLIENT_ORIGIN` у `wrangler.toml` (`[vars]`) на реальний домен
фронтенду (Cloudflare Pages), інакше запити з браузера будуть заблоковані CORS.

### 3.4. Деплой Worker

```bash
npm run deploy      # = wrangler deploy
```

Запишіть виданий URL Worker'а (напр. `https://kontraktova-beauty-api.<account>.workers.dev`).

### 3.5. Деплой фронтенду (Cloudflare Pages)

Фронтенд ходить у Worker за адресою з `VITE_API_BASE_URL` (за замовчуванням —
відносний шлях `/api`, який працює тільки локально через проксі Vite).
Перед білдом для продакшену вкажіть реальний URL Worker'а:

```bash
cd client
cp .env.production.example .env.production
# відредагуйте .env.production — впишіть URL з кроку 3.4
npm run build
npx wrangler pages deploy dist --project-name=kontraktova-beauty
```

Якщо Pages-проєкт створюється вперше, `wrangler` запропонує його створити —
погоджуйтесь. Після деплою скопіюйте виданий Pages-домен у `CLIENT_ORIGIN`
(`worker/wrangler.toml` → `[vars]`) і передеплойте Worker (`npm run deploy` в
`worker/`), інакше CORS заблокує запити з продакшн-фронтенду.

---

## 4. Що редагується через адмінку (без редеплою)

- **Послуги** — назва, категорія, тривалість, ціна, привʼязка до майстра
- **Майстри** — імʼя, категорії, робочі години, вихідні дні
- **Сповіщення** — Telegram chat_id для кожної категорії + fallback-чат
- **Записи** — статус (нова/підтверджена/скасована/виконана), час, підсумкова
  ціна (клієнту показується орієнтовна ціна з каталогу; точну суму
  вписує адміністратор після візиту)

## 5. Обмеження цього етапу

- Без онлайн-оплати
- Без SMS/email-нагадувань клієнтам (у таблиці `bookings` вже є поле
  `reminder_sent`, щоб додати це пізніше без міграції)
- Тільки українська мова інтерфейсу
