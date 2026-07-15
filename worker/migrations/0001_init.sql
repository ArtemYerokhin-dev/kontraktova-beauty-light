-- Kontraktova Beauty: initial D1 schema

CREATE TABLE IF NOT EXISTS masters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  categories TEXT NOT NULL DEFAULT '[]',      -- JSON array of category codes
  work_start TEXT NOT NULL DEFAULT '09:00',   -- HH:MM
  work_end TEXT NOT NULL DEFAULT '18:00',     -- HH:MM
  days_off TEXT NOT NULL DEFAULT '[0]',       -- JSON array, 0=Sunday..6=Saturday
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,                     -- manicure_pedicure | brows_permanent | lash_lamination
  duration_min INTEGER NOT NULL,
  price INTEGER NOT NULL,                     -- UAH
  master_id INTEGER,                          -- optional: if set, only this master performs it
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  master_id INTEGER NOT NULL,
  date TEXT NOT NULL,                         -- YYYY-MM-DD
  start_time TEXT NOT NULL,                   -- HH:MM
  end_time TEXT NOT NULL,                     -- HH:MM
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'нова',        -- нова | підтверджена | скасована | виконана
  reminder_sent INTEGER NOT NULL DEFAULT 0,   -- reserved for future SMS/email reminders
  telegram_notified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  FOREIGN KEY (master_id) REFERENCES masters(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_bookings_master_date ON bookings(master_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);

-- category = 'fallback' row is the catch-all chat used when a category has no target
CREATE TABLE IF NOT EXISTS notification_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL UNIQUE,              -- manicure_pedicure | brows_permanent | lash_lamination | fallback
  telegram_chat_id TEXT NOT NULL,
  label TEXT,                                 -- human-readable name, e.g. master's name
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
