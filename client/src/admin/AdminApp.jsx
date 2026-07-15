import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import Login from './Login.jsx';
import Shell from './Shell.jsx';
import BookingsList from './BookingsList.jsx';
import CalendarView from './CalendarView.jsx';
import ServicesAdmin from './ServicesAdmin.jsx';
import MastersAdmin from './MastersAdmin.jsx';
import NotificationsAdmin from './NotificationsAdmin.jsx';

export default function AdminApp() {
  const [authed, setAuthed] = useState(null); // null = checking

  useEffect(() => {
    api
      .me()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-black/40">Завантаження…</div>;
  }

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <Shell onLogout={() => setAuthed(false)}>
      <Routes>
        <Route index element={<Navigate to="bookings" replace />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="services" element={<ServicesAdmin />} />
        <Route path="masters" element={<MastersAdmin />} />
        <Route path="notifications" element={<NotificationsAdmin />} />
      </Routes>
    </Shell>
  );
}
