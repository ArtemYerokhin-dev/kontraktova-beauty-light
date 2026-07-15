import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import mastersRoutes from './routes/masters.js';
import bookingsRoutes from './routes/bookings.js';
import notificationTargetsRoutes from './routes/notificationTargets.js';
import masterAuthRoutes from './routes/masterAuth.js';

const app = new Hono();

app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  return corsMiddleware(c, next);
});

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRoutes);
app.route('/api/services', servicesRoutes);
app.route('/api/masters', mastersRoutes);
app.route('/api/bookings', bookingsRoutes);
app.route('/api/admin/notification-targets', notificationTargetsRoutes);
app.route('/api/master-auth', masterAuthRoutes);

app.notFound((c) => c.json({ error: 'Не знайдено' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Внутрішня помилка сервера' }, 500);
});

export default app;
