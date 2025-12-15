
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistoryPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchHistory(parsedUser.id);
    }, []);

    const fetchHistory = async (userId: number) => {
        try {
            const res = await fetch(`/api/history?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const historyData = useMemo(() => {
        // Sort Ascending for calculation
        const sorted = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const shifts: { date: string; start: string; end: string; hours: number }[] = [];
        let totalHours = 0;

        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].type === 'IN') {
                if (i + 1 < sorted.length && sorted[i + 1].type === 'OUT') {
                    const start = new Date(sorted[i].timestamp);
                    const end = new Date(sorted[i + 1].timestamp);
                    const diff = end.getTime() - start.getTime();
                    const hours = diff / (1000 * 60 * 60);

                    shifts.push({
                        date: start.toLocaleDateString(),
                        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        hours: hours
                    });

                    totalHours += hours;
                    i++; // Skip the OUT
                }
            }
        }

        // Reverse to show newest first
        return {
            shifts: shifts.reverse(),
            totalHours
        };
    }, [entries]);

    if (!user) return null;

    return (
        <main className="container">
            <div className="glass card animate-fade-in" style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
                    <Link href="/dashboard" className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', marginRight: '1rem', background: 'var(--surface)' }}>
                        ← Indietro
                    </Link>
                    <h2 style={{ margin: 0, flexGrow: 1 }}>Le Mie Ore</h2>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ore Totali Registrate</p>
                    <h1 style={{ fontSize: '3rem', color: 'var(--primary)', margin: 0 }}>
                        {historyData.totalHours.toFixed(2)} <span style={{ fontSize: '1.5rem' }}>h</span>
                    </h1>
                </div>

                <div style={{ textAlign: 'left' }}>
                    <h3 style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>Ultime Attività</h3>

                    {loading ? (
                        <p style={{ textAlign: 'center', opacity: 0.5 }}>Caricamento...</p>
                    ) : historyData.shifts.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Non ci sono turni completati recenti.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {historyData.shifts.map((shift, idx) => (
                                <div key={idx} style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{shift.date}</div>
                                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                                            {shift.start} - {shift.end}
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: 'var(--success)',
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px'
                                    }}>
                                        {shift.hours.toFixed(2)} h
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
