'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check for existing session
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.role) {
          router.replace(user.role === 'ADMIN' ? '/admin' : '/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegister ? '/api/register' : '/api/login';
    const body = isRegister ? { name, code } : { code };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const user = await res.json();
        // If registered, auto-login
        localStorage.setItem('user', JSON.stringify(user));
        router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || 'Operazione fallita');
        setLoading(false);
      }
    } catch (err) {
      setError('Errore di connessione');
      setLoading(false);
    }
  };

  return (
    <main className="purple-login-container">

      {/* 1. Icon Header */}
      <div className="icon-box animate-fade-in">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>

      {/* 2. Text Content */}
      <h1 className="login-title animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {isRegister ? 'Registrati' : 'Login'}
      </h1>
      <p className="login-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
        {isRegister ? 'Crea il tuo account dipendente' : 'Pocula d\'entervi timbro cartelino'}
      </p>

      {/* 3. Form */}
      <form onSubmit={handleSubmit} style={{ width: '100%' }} className="animate-fade-in">

        {isRegister && (
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Nome e Cognome:"
              className="custom-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={isRegister}
            />
          </div>
        )}

        <div className="input-group">
          <input
            type="text"
            placeholder={isRegister ? "Scegli il tuo codice segreto:" : "Codice accesso:"}
            className="custom-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoCapitalize="none"
          />
        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* Main Submit Button */}
        <button
          type="submit"
          className="btn-glass-primary"
          disabled={loading}
        >
          {loading ? 'Attendi...' : (isRegister ? 'Conferma Registrazione' : 'Entra')}
        </button>

      </form>

      {/* 4. Footer & Toggle */}
      <div className="helper-text animate-fade-in" style={{ animationDelay: '0.4s', marginTop: '1.5rem', cursor: 'pointer' }} onClick={() => { setIsRegister(!isRegister); setError(''); }}>
        {isRegister ? 'Hai già un account? Accedi' : 'Non hai un codice? Registrati'}
      </div>

      {!isRegister && (
        <Link href="/help" className="helper-text animate-fade-in" style={{ animationDelay: '0.5s', marginTop: '0.5rem', display: 'block', fontSize: '0.8rem', opacity: 0.7 }}>
          Hai bisogno di aiuto?
        </Link>
      )}

    </main>
  );
}
