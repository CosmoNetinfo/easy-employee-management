'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, code }),
            });

            if (res.ok) {
                // Auto login
                const user = await res.json();
                localStorage.setItem('user', JSON.stringify(user));
                router.push('/dashboard');
            } else {
                const data = await res.json();
                setError(data.error || 'Registrazione fallita');
            }
        } catch (err) {
            setError('Errore di connessione');
        }
    };

    return (
        <main className="container">
            <div className="glass card animate-fade-in">
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Registrazione</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Crea il tuo profilo operaio</p>

                <form onSubmit={handleRegister}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Nome Completo</label>
                        <input
                            type="text"
                            placeholder="Mario Rossi"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="label">Codice Personale (Password)</label>
                        <input
                            type="text"
                            placeholder="Scegli un codice segreto..."
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                        />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Usa questo codice per fare il login.
                        </p>
                    </div>

                    {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{error}</p>}

                    <button type="submit" className="btn btn-success" style={{ marginBottom: '1rem' }}>
                        Crea Account
                    </button>
                </form>

                <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }}>
                    ← Torna al Login
                </Link>
            </div>
        </main>
    );
}
