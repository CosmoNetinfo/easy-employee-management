
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

        const shifts: { dateObj: Date; date: string; start: string; end: string; hours: number }[] = [];
        let totalHoursAllTime = 0;

        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].type === 'IN') {
                if (i + 1 < sorted.length && sorted[i + 1].type === 'OUT') {
                    const start = new Date(sorted[i].timestamp);
                    const end = new Date(sorted[i + 1].timestamp);
                    const diff = end.getTime() - start.getTime();
                    const hours = diff / (1000 * 60 * 60);

                    shifts.push({
                        dateObj: start,
                        date: start.toLocaleDateString(),
                        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        hours: hours
                    });

                    totalHoursAllTime += hours;
                    i++; // Skip the OUT
                }
            }
        }

        // Group by Week
        const weeksMap = new Map<string, { label: string; totalHours: number; shifts: typeof shifts }>();

        shifts.forEach(shift => {
            const d = new Date(shift.dateObj);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday (0) -> go back to Monday

            const monday = new Date(d);
            monday.setDate(diff);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const key = monday.toISOString().split('T')[0]; // Unique key for the week YYYY-MM-DD of Monday
            const label = `${monday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;

            if (!weeksMap.has(key)) {
                weeksMap.set(key, { label, totalHours: 0, shifts: [] });
            }

            const week = weeksMap.get(key)!;
            week.shifts.push(shift);
            week.totalHours += shift.hours;
        });

        // Convert to array and sort by date descending (newest week first)
        const weeks = Array.from(weeksMap.entries())
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([_, val]) => {
                // Sort shifts within week descending
                val.shifts.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
                return val;
            });

        return {
            weeks,
            totalHoursAllTime
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
                    <h2 style={{ margin: 0, flexGrow: 1 }}>Storico Settimanale</h2>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Totale Generale</p>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}>
                        {historyData.totalHoursAllTime.toFixed(2)} <span style={{ fontSize: '1.5rem' }}>h</span>
                    </h1>
                </div>

                <div style={{ textAlign: 'left' }}>

                    {loading ? (
                        <p style={{ textAlign: 'center', opacity: 0.5 }}>Caricamento...</p>
                    ) : historyData.weeks.length === 0 ? (
                        <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Non ci sono turni registrati.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {historyData.weeks.map((week, idx) => (
                                <div key={idx} style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: '16px',
                                    padding: '1rem',
                                    background: 'rgba(255,255,255,0.02)'
                                }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                        borderBottom: '1px solid var(--border)',
                                        paddingBottom: '0.5rem'
                                    }}>
                                        <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Settimana: {week.label}</h3>
                                        <div style={{
                                            fontWeight: 'bold',
                                            color: 'var(--success)',
                                            fontSize: '1.2rem'
                                        }}>
                                            {week.totalHours.toFixed(2)} h
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {week.shifts.map((shift, sIdx) => (
                                            <div key={sIdx} style={{
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{shift.date}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                        {shift.start} - {shift.end}
                                                    </div>
                                                </div>
                                                <div style={{ opacity: 0.8 }}>
                                                    {shift.hours.toFixed(2)} h
                                                </div>
                                            </div>
                                        ))}
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
