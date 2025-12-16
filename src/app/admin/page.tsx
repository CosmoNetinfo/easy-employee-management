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
    const [showUsers, setShowUsers] = useState(false);

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

    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    const handleOpenPhoto = async (id: number) => {
        setLoadingPhoto(true);
        try {
            const res = await fetch(`/api/admin/get-photo?id=${id}`);
            if (res.ok) {
                const data = await res.json();
                setSelectedPhoto(data.photoUrl);
            } else {
                alert('Impossibile caricare la foto');
            }
        } catch (e) {
            alert('Errore di connessione');
        } finally {
            setLoadingPhoto(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Sei sicuro di voler eliminare questa timbratura?')) return;

        try {
            const res = await fetch(`/api/admin/delete-entry?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                // Ricarica senza refresh
                fetchEntries();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch (e) {
            alert('Errore di connessione');
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

    const [newAdminCode, setNewAdminCode] = useState('');
    const [showSettings, setShowSettings] = useState(false);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAdminCode) return;

        try {
            // Get current admin ID from localStorage
            const stored = localStorage.getItem('user');
            if (!stored) return;
            const user = JSON.parse(stored);

            const res = await fetch('/api/admin/update-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, newCode: newAdminCode }),
            });

            if (res.ok) {
                alert('Password aggiornata con successo! Effettua nuovamente il login.');
                handleLogout();
            } else {
                alert('Errore durante l\'aggiornamento');
            }
        } catch (error) {
            alert('Errore di connessione');
        }
    };

    const handleUpdateWage = async (userId: number, wage: string) => {
        try {
            const res = await fetch('/api/admin/update-wage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, hourlyWage: wage }),
            });
            if (res.ok) {
                // Refresh data
                fetchUsers();
                fetchEntries(); // To update summaries
            } else {
                alert('Errore aggiornamento stipendio');
            }
        } catch (e) {
            alert('Errore di connessione');
        }
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
            const wage = logs[0].user.hourlyWage || 7;
            const salary = hours * wage;
            return {
                userId: logs[0].userId,
                name: logs[0].user.name,
                hours: hours,
                salary: salary,
                wage: wage
            };
        });

        const totalSalary = userSummaries.reduce((acc, curr) => acc + curr.salary, 0);

        return {
            totalHours,
            totalSalary,
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
        <main className="container">
            <div className="animate-slide-up">

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }} className="mb-8">
                    <div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Pannello di Controllo</h1>
                        <p className="text-muted">Gestione completa dipendenti e buste paga</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => setShowUsers(!showUsers)} className={`btn ${showUsers ? 'btn-primary' : 'btn-secondary'}`}>
                            {showUsers ? 'Chiudi Dipendenti' : '👥 Gestione Dipendenti'}
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className={`btn ${showSettings ? 'btn-primary' : 'btn-secondary'}`}>
                            {showSettings ? 'Chiudi Settings' : '⚙️ Impostazioni'}
                        </button>
                        <button onClick={handleLogout} className="btn btn-danger">
                            Esci
                        </button>
                    </div>
                </div>

                {/* Settings Section */}
                {showSettings && (
                    <div className="mb-8 animate-slide-up">
                        <div className="card">
                            <h3 className="mb-4">⚙️ Impostazioni Admin</h3>
                            <div style={{ maxWidth: '400px' }}>
                                <label className="label">Cambia Password Admin</label>
                                <form onSubmit={handleUpdatePassword} style={{ display: 'flex', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Nuovo Codice..."
                                        value={newAdminCode}
                                        onChange={(e) => setNewAdminCode(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-primary">
                                        Salva
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Users Wage Section */}
                {showUsers && (
                    <div className="mb-8 animate-slide-up">
                        <h3 className="mb-4">💰 Gestione Paga Oraria</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                            {users.map(u => (
                                <div key={u.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
                                    <div>
                                        <div className="font-bold" style={{ fontSize: '1.1rem' }}>{u.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>Matricola: {u.code}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label className="text-muted" style={{ fontSize: '0.9rem' }}>€/h</label>
                                        <input
                                            type="number"
                                            defaultValue={u.hourlyWage || 7}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (parseFloat(val) !== u.hourlyWage) {
                                                    handleUpdateWage(u.id, val);
                                                }
                                            }}
                                            style={{ width: '80px', textAlign: 'right', fontWeight: 'bold' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }} className="mb-8">
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--accent-light)', padding: '16px', borderRadius: '16px', fontSize: '2rem' }}>
                            ⏱️
                        </div>
                        <div>
                            <p className="text-muted font-medium mb-1">Ore Totali (Periodo)</p>
                            <h2 style={{ margin: 0, color: 'var(--accent)' }}>{summary.totalHours.toFixed(2)} h</h2>
                        </div>
                    </div>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ background: 'var(--success-bg)', padding: '16px', borderRadius: '16px', fontSize: '2rem' }}>
                            💸
                        </div>
                        <div>
                            <p className="text-muted font-medium mb-1">Stipendio Stimato</p>
                            <h2 style={{ margin: 0, color: 'var(--success)' }}>€ {summary.totalSalary.toFixed(2)}</h2>
                        </div>
                    </div>
                </div>

                {/* Filters & Table Section */}
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                    {/* Filters Header */}
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1 }}>
                                <div>
                                    <label className="label">Dal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ minWidth: '150px' }}
                                    />
                                </div>
                                <div>
                                    <label className="label">Al</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ minWidth: '150px' }}
                                    />
                                </div>
                                <div style={{ minWidth: '200px', flex: 1 }}>
                                    <label className="label">Filtra per Dipendente</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        <option value="">Tutti i dipendenti</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.8rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    Filtra Risultati
                                </button>
                                <button type="button" onClick={handleReset} className="btn btn-ghost">
                                    Reset
                                </button>
                                <button type="button" onClick={handleExport} className="btn btn-success" disabled={entries.length === 0}>
                                    📥 Export CSV
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="table-container" style={{ borderRadius: 0, boxShadow: 'none', border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Data / Ora</th>
                                    <th>Dipendente</th>
                                    <th>Matricola</th>
                                    <th>Stato</th>
                                    <th>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id}>
                                        <td>
                                            <div className="font-medium">{new Date(entry.timestamp).toLocaleDateString()}</div>
                                            <div className="text-muted" style={{ fontSize: '0.85rem' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td>
                                            <div className="font-bold">{entry.user.name}</div>
                                        </td>
                                        <td>
                                            <span style={{ background: 'var(--surface-alt)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                                {entry.user.code}
                                            </span>
                                        </td>
                                        <td>
                                            {entry.type === 'IN' ? (
                                                <span className="status-badge status-in">▶ ENTRATA</span>
                                            ) : (
                                                <span className="status-badge status-out">⏹ USCITA</span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {entry.hasPhoto ? (
                                                    <button
                                                        onClick={() => handleOpenPhoto(entry.id)}
                                                        className="btn btn-secondary"
                                                        disabled={loadingPhoto}
                                                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                                                    >
                                                        {loadingPhoto ? '...' : '📸 Foto'}
                                                    </button>
                                                ) : (
                                                    <span className="text-muted" style={{ padding: '0 10px', fontSize: '0.85rem' }}>No Foto</span>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    className="btn btn-ghost"
                                                    style={{ color: 'var(--danger)', padding: '8px 12px' }}
                                                    title="Elimina"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📭</div>
                                            <p className="text-muted">Nessuna attività trovata per i filtri selezionati.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {loading && (
                            <div style={{ padding: '4rem', textAlign: 'center' }}>
                                <div className="text-muted">Caricamento dati in corso...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photo Modal */}
                {selectedPhoto && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '2rem',
                            backdropFilter: 'blur(5px)'
                        }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <div style={{ position: 'relative', maxWidth: '1000px', width: '100%' }}>
                            <img
                                src={selectedPhoto}
                                alt="Prova lavoro"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                    border: '1px solid white'
                                }}
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: '0',
                                    background: 'transparent',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '2rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Chiudi
                            </button>
                        </div>
                    </div>
                )}


                <div className="text-center mt-10" style={{ marginTop: '4rem', opacity: 0.5, fontSize: '0.85rem' }}>
                    Easy Employee Management &copy; {new Date().getFullYear()}
                </div>
            </div>
        </main>
    );
}
