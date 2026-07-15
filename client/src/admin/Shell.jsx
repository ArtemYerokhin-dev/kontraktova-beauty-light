import { NavLink } from 'react-router-dom';
import { api } from '../lib/api.js';

const TABS = [
  { to: 'bookings', label: 'Записи' },
  { to: 'calendar', label: 'Календар' },
  { to: 'services', label: 'Послуги' },
  { to: 'masters', label: 'Майстри' },
  { to: 'notifications', label: 'Сповіщення' },
];

export default function Shell({ children, onLogout }) {
  async function logout() {
    await api.logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-black/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Kontraktova Beauty</p>
            <h1 className="text-lg font-semibold">Адмін-панель</h1>
          </div>
          <button onClick={logout} className="text-sm text-black/40 duration-150 hover:text-ink">
            Вийти
          </button>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              className={({ isActive }) =>
                `whitespace-nowrap border-b-2 px-3 py-3 text-sm duration-150 ${
                  isActive ? 'border-accent text-ink' : 'border-transparent text-black/40 hover:text-ink'
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">{children}</main>
    </div>
  );
}
