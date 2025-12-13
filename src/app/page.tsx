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
      <div className="glass card animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '2rem' }}>
          <img src="/logo-easy.png" alt="EasyEvent Logo" style={{ maxWidth: '200px', height: 'auto', display: 'inline-block', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Timbra Cartellino</h1>
        </div>

        <form onSubmit={handleLogin} style={{ marginBottom: '2rem' }}>
          <div style={{ textAlign: 'left', marginBottom: '1rem' }}>
            <label className="label">Codice Personale</label>
            <input
              type="text"
              placeholder="Inserisci il tuo codice..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

          <button type="submit" className="btn btn-primary">
            Accedi
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Non hai un account?</p>
          <Link href="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Registrati come Nuovo Operaio
          </Link>
        </div>
        <div style={{ marginTop: '3rem', fontSize: '0.8rem', opacity: 0.5 }}>
          Creata da Daniele Spalletti per <a href="https://easyevent.it/" target="_blank" style={{ color: 'inherit', textDecoration: 'underline' }}>EasyEvent.it</a>
        </div>
      </div>
    </main>
  );
}
