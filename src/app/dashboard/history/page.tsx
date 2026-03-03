
'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HistoryPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [hourlyWage, setHourlyWage] = useState<number>(7.0);
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
                // Support both old (array) and new ({ entries, hourlyWage }) response shapes
                if (Array.isArray(data)) {
                    setEntries(data);
                } else {
                    setEntries(data.entries ?? []);
                    setHourlyWage(data.hourlyWage ?? 7.0);
                }
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

        const shifts: { dateObj: Date; date: string; start: string; end: string; hours: number; euros: number }[] = [];
        let totalHoursAllTime = 0;
        let totalEurosAllTime = 0;

        for (let i = 0; i < sorted.length; i++) {
            if (sorted[i].type === 'IN') {
                if (i + 1 < sorted.length && sorted[i + 1].type === 'OUT') {
                    const start = new Date(sorted[i].timestamp);
                    const end = new Date(sorted[i + 1].timestamp);
                    const diff = end.getTime() - start.getTime();
                    const hours = diff / (1000 * 60 * 60);
                    const euros = hours * hourlyWage;

                    shifts.push({
                        dateObj: start,
                        date: start.toLocaleDateString('it-IT'),
                        start: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        end: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        hours,
                        euros,
                    });

                    totalHoursAllTime += hours;
                    totalEurosAllTime += euros;
                    i++; // Skip the OUT
                }
            }
        }

        // Group by Week
        const weeksMap = new Map<string, { label: string; totalHours: number; totalEuros: number; shifts: typeof shifts }>();

        shifts.forEach(shift => {
            const d = new Date(shift.dateObj);
            const day = d.getDay();
            const diffDays = d.getDate() - day + (day === 0 ? -6 : 1);

            const monday = new Date(d);
            monday.setDate(diffDays);
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const key = monday.toISOString().split('T')[0];
            const label = `${monday.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - ${sunday.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`;

            if (!weeksMap.has(key)) {
                weeksMap.set(key, { label, totalHours: 0, totalEuros: 0, shifts: [] });
            }

            const week = weeksMap.get(key)!;
            week.shifts.push(shift);
            week.totalHours += shift.hours;
            week.totalEuros += shift.euros;
        });

        // Convert to array and sort by date descending (newest week first)
        const weeks = Array.from(weeksMap.entries())
            .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
            .map(([_, val]) => {
                val.shifts.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
                return val;
            });

        return { weeks, totalHoursAllTime, totalEurosAllTime };
    }, [entries, hourlyWage]);

    const fmtEur = (val: number) =>
        val.toLocaleString('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 });

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

                {/* ── Totale Generale ── */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Totale Generale</p>
                    <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0, marginBottom: '0.4rem' }}>
                        {historyData.totalHoursAllTime.toFixed(2)} <span style={{ fontSize: '1.5rem' }}>h</span>
                    </h1>
                    <div style={{ fontSize: '1.4rem', color: 'var(--success)', fontWeight: 700 }}>
                        {fmtEur(historyData.totalEurosAllTime)}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                        tariffa {fmtEur(hourlyWage)}/h
                    </div>
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
                                    background: 'rgba(255,255,255,0.02)',
                                }}>
                                    {/* Week header */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '1rem',
                                        borderBottom: '1px solid var(--border)',
                                        paddingBottom: '0.75rem',
                                    }}>
                                        <h3 style={{ fontSize: '1rem', margin: 0 }}>
                                            📅 {week.label}
                                        </h3>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 'bold', color: 'var(--success)', fontSize: '1.1rem' }}>
                                                {week.totalHours.toFixed(2)} h
                                            </div>
                                            <div style={{ fontWeight: 700, color: '#f0c040', fontSize: '1rem' }}>
                                                {fmtEur(week.totalEuros)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shifts */}
                                    <div style={{ display: 'grid', gap: '0.5rem' }}>
                                        {week.shifts.map((shift, sIdx) => (
                                            <div key={sIdx} style={{
                                                background: 'rgba(0,0,0,0.2)',
                                                padding: '0.8rem 1rem',
                                                borderRadius: '10px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{shift.date}</div>
                                                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                                        {shift.start} → {shift.end}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ opacity: 0.85, fontSize: '0.95rem' }}>
                                                        {shift.hours.toFixed(2)} h
                                                    </div>
                                                    <div style={{ color: '#f0c040', fontWeight: 600, fontSize: '0.9rem' }}>
                                                        {fmtEur(shift.euros)}
                                                    </div>
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
