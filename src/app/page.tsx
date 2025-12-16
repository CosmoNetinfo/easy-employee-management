'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user && user.role) {
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('user', JSON.stringify(user));
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        const data = await res.json();
        setError(data.error || 'Login fallito');
        setLoading(false);
      }
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  return (
    <main className="mobile-container">
      {/* 1. Blue Wave Background Header */}
      <div className="blue-wave-header" />

      {/* 2. Login Content Layer */}
      <div className="login-content animate-slide-up">

        {/* Logo Section */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="logo-circle">
            {/* Simple Logo Placeholder - blue letters */}
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent-dark)' }}>Es</span>
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>Dipendente facile</h1>
          <p style={{ opacity: 0.8, color: 'var(--text-secondary)' }}>Gestione Presenze Semplice</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              placeholder="Codice Personale"
              className="pill-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
            />
          </div>

          {error && (
            <div style={{
              color: 'var(--danger)',
              marginBottom: '1rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '10px',
              borderRadius: '12px'
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-pill-primary" disabled={loading}>
            {loading ? 'Verifica...' : 'Accedi'}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ marginTop: '2rem' }}>
          <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>
            Codice Dimenticato? / Registrati
          </Link>
        </div>

      </div>
    </main>
  );
}
