'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      // Verify minimal data integrity
      if (user && user.role) {
        if (user.role === 'ADMIN') {
          router.replace('/admin');
        } else {
          router.replace('/dashboard');
        }
      }
    }
  }, []); // Only run once on mount

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  return (
    <main className="container">
      <div className="animate-slide-up" style={{ textAlign: 'center', marginTop: '2rem' }}>

        <div style={{ marginBottom: '2.5rem' }}>
          <img
            src="/logo-easy.png"
            alt="EasyEvent Logo"
            className="logo"
          />
          <h1 className="mb-2">Timbra Cartellino</h1>
          <p className="text-muted">Inserisci il tuo codice personale per accedere</p>
        </div>

        <div className="card">
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label className="label">Codice Personale</label>
              <input
                type="text"
                placeholder="Es. 123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4" style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}>
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Accedi al Portale
            </button>
          </form>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <p className="mb-2" style={{ fontSize: '0.95rem' }}>Non hai ancora un codice?</p>
          <Link href="/register" className="btn btn-ghost" style={{ textDecoration: 'none', fontWeight: 600 }}>
            Registrati come Nuovo Operaio
          </Link>
        </div>

        <div style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: 0.6 }}>
          Creata da Daniele Spalletti per <a href="https://easyevent.it/" target="_blank" style={{ color: 'inherit', textDecoration: 'underline' }}>EasyEvent.it</a>
        </div>
      </div>
    </main>
  );
}
