'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function Admin() {
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const HOURLY_RATE = 7;

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const user = JSON.parse(stored);
        if (user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
        fetchEntries();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', new Date(startDate).toISOString());
            if (endDate) {
                // Set to end of day
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                params.append('endDate', end.toISOString());
            }
            if (selectedUserId) params.append('userId', selectedUserId);

            const res = await fetch(`/api/admin/entries?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchEntries();
    };

    const handleReset = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUserId('');
        // We'll rely on the user to click filter or just reload.
        // Let's reload to be simple and robust.
        window.location.reload();
    };

    const summary = useMemo(() => {
        // Group entries by user
        const userEntries: Record<string, any[]> = {};
        entries.forEach(e => {
            if (!userEntries[e.userId]) userEntries[e.userId] = [];
            userEntries[e.userId].push(e);
        });

        let totalHours = 0;
        const userSummaries = Object.values(userEntries).map(logs => {
            // Sort ascending
            logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            let hours = 0;
            // Iterate and pair IN/OUT
            for (let i = 0; i < logs.length; i++) {
                if (logs[i].type === 'IN') {
                    // Look for next OUT
                    // We just take the Next event if it is OUT. If it is IN, then the previous IN is ignored/incomplete.
                    if (i + 1 < logs.length && logs[i + 1].type === 'OUT') {
                        const start = new Date(logs[i].timestamp).getTime();
                        const end = new Date(logs[i + 1].timestamp).getTime();
                        hours += (end - start) / (1000 * 60 * 60);
                        i++; // Skip the OUT processed
                    }
                }
            }
            totalHours += hours;
            return {
                userId: logs[0].userId,
                name: logs[0].user.name,
                hours: hours,
                salary: hours * HOURLY_RATE
            };
        });

        return {
            totalHours,
            totalSalary: totalHours * HOURLY_RATE,
            userSummaries
        };
    }, [entries]);

    const handleExport = () => {
        if (entries.length === 0) return;

        const headers = ['ID', 'Data', 'Ora', 'Dipendente', 'Codice', 'Azione', 'Foto'];
        const csvContent = [
            headers.join(','),
            ...entries.map(e => {
                const date = new Date(e.timestamp);
                const dateStr = date.toLocaleDateString();
                const timeStr = date.toLocaleTimeString();
                return [
                    e.id,
                    dateStr,
                    timeStr,
                    `"${e.user.name}"`,
                    e.user.code,
                    e.type === 'IN' ? 'ENTRATA' : 'USCITA',
                    e.photoUrl ? 'SI' : 'NO'
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report_lavori_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    return (
        <main className="container" style={{ maxWidth: '1200px' }}>
            <div className="glass card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2>Pannello di Controllo</h2>
                    <button onClick={handleLogout} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--surface)' }}>
                        Esci
                    </button>
                </div>

                {/* Summary Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Ore Totali (Periodo)</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.totalHours.toFixed(2)} h</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Stipendio Stimato (7€/h)</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>€ {summary.totalSalary.toFixed(2)}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Dal</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Al</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px' }}>
                            <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Dipendente</label>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text-main)' }}
                            >
                                <option value="">Tutti</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button type="submit" className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                Filtra
                            </button>
                            <button type="button" onClick={handleReset} className="btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'transparent', border: '1px solid var(--border)' }}>
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                    <button onClick={handleExport} className="btn" disabled={entries.length === 0} style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--success)' }}>
                        Esporta CSV
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
                                <th style={{ padding: '1rem' }}>Foto</th>
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
                                    <td style={{ padding: '1rem' }}>
                                        {entry.photoUrl ? (
                                            <a href={entry.photoUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'var(--primary)' }}>
                                                Vedi Foto
                                            </a>
                                        ) : '-'}
                                    </td>
                                </tr>
                            ))}
                            {entries.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', opacity: 0.5 }}>
                                        Nessuna attività trovata con i filtri selezionati.
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
