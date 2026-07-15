import { useState } from 'react';
import { api } from '../lib/api.js';
import Button from '../components/Button.jsx';

export default function Login({ onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(password);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5">
      <form onSubmit={submit} className="w-full max-w-sm">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Kontraktova Beauty</p>
        <h1 className="mt-1 mb-6 text-2xl font-semibold">Вхід в адмінку</h1>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Пароль"
          className="input"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="mt-4 w-full">
          {loading ? 'Вхід…' : 'Увійти'}
        </Button>
      </form>
    </div>
  );
}
