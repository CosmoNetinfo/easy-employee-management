'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [status, setStatus] = useState<'IN' | 'OUT' | 'LOADING'>('LOADING');
    const [lastEntry, setLastEntry] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const userData = JSON.parse(stored);
        setUser(userData);
        fetchStatus(userData.id);
    }, []);

    const fetchStatus = async (id: number) => {
        try {
            const res = await fetch(`/api/status?userId=${id}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data.status);
                setLastEntry(data.lastEntry);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleNativeClock = async (type: 'IN' | 'OUT', file: File) => {
        if (!user) return;
        setLoading(true);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('type', type);
        formData.append('image', file);

        try {
            const res = await fetch('/api/clock', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchStatus(user.id);
                alert('Timbratura registrata con successo!');
            } else {
                alert('Errore timbratura');
            }
        } catch (e) {
            alert('Errore di connessione');
        } finally {
            setLoading(false);
            const input = document.getElementById('cameraInput') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <main className="container">
            <div className="glass card animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0 }}>Ciao, {user.name}</h2>
                    <button onClick={handleLogout} style={{ background: 'transparent', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Esci
                    </button>
                </div>

                <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Stato Attuale</p>
                    <h1 style={{
                        color: status === 'IN' ? 'var(--success)' : 'var(--text-main)',
                        fontSize: '3rem',
                        marginBottom: '0.5rem'
                    }}>
                        {status === 'LOADING' ? '...' : (status === 'IN' ? 'AL LAVORO' : 'NON AL LAVORO')}
                    </h1>
                    {lastEntry && (
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                            Ultima {lastEntry.type === 'IN' ? 'entrata' : 'uscita'}: {new Date(lastEntry.timestamp).toLocaleString()}
                        </p>
                    )}
                </div>

                {status !== 'LOADING' && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id="cameraInput"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    handleNativeClock(status === 'OUT' ? 'IN' : 'OUT', e.target.files[0]);
                                }
                            }}
                            disabled={loading}
                        />
                        <label
                            htmlFor="cameraInput"
                            className={`btn ${status === 'OUT' ? 'btn-success' : 'btn-danger'}`}
                            style={{
                                fontSize: '1.2rem',
                                padding: '1.5rem',
                                display: 'block',
                                cursor: loading ? 'wait' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                background: status === 'OUT' ? 'var(--success)' : 'var(--danger)'
                            }}
                        >
                            {loading ? 'CARICAMENTO...' : (status === 'OUT' ? 'SCATTA FOTO ENTRATA 📸' : 'SCATTA FOTO USCITA 📸')}
                        </label>
                    </div>
                )}
            </div>
        </main>
    );
}
