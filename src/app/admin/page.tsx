'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const user = JSON.parse(stored);
        // Simple client-side check. In real app, middleware/server check needed.
        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/admin/entries');
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <main className="container" style={{ maxWidth: '800px' }}>
            <div className="glass card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2>Pannello di Controllo</h2>
                    <button onClick={handleLogout} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--surface)' }}>
                        Esci
                    </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Data/Ora</th>
                                <th style={{ padding: '1rem' }}>Operaio</th>
                                <th style={{ padding: '1rem' }}>Codice</th>
                                <th style={{ padding: '1rem' }}>Azione</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{entry.user.name}</td>
                                    <td style={{ padding: '1rem', opacity: 0.7 }}>{entry.user.code}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: entry.type === 'IN' ? 'var(--success)' : 'var(--danger)',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '99px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold'
                                        }}>
                                            {entry.type === 'IN' ? 'ENTRATA' : 'USCITA'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                        Nessuna attività registrata.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    {loading && <p style={{ textAlign: 'center', padding: '2rem' }}>Caricamento...</p>}
                </div>
            </div>
        </main>
    );
}
