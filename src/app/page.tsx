'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
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
        router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard');
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

  const handleCameraClockIn = () => {
    // Placeholder for "Scatta foto per timbrare" action
    console.log('Camera clock-in requested');
    alert('Funzionalità fotocamera in arrivo...');
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
        Login
      </h1>
      <p className="login-subtitle animate-fade-in" style={{ animationDelay: '0.2s' }}>
        Pocula d'entervi timbro cartelino
      </p>

      {/* 3. Form */}
      <form onSubmit={handleLogin} style={{ width: '100%' }} className="animate-fade-in">

        <div className="input-group">
          <input
            type="text"
            placeholder="Codice accesso:"
            className="custom-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoCapitalize="none"
          />
        </div>

        {/* Password field removed as requested */}

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
          {loading ? 'Attendi...' : 'Entra'}
        </button>

      </form>

      {/* 4. Footer */}
      <Link href="/help" className="helper-text animate-fade-in" style={{ animationDelay: '0.4s' }}>
        Hai bisogno di aiuto?
      </Link>

    </main>
  );
}
