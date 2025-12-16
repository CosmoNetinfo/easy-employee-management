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
        <main className="container" style={{ maxWidth: '1200px' }}>
            <div className="animate-slide-up">

                {/* Header Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Pannello di Controllo</h2>
                        <p className="text-muted" style={{ fontSize: '0.9rem' }}>Gestione completa dipendenti</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={() => setShowUsers(!showUsers)} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
                            {showUsers ? 'Chiudi Dipendenti' : 'Gestione Dipendenti'}
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem' }}>
                            {showSettings ? 'Settings' : 'Impostazioni'}
                        </button>
                        <button onClick={handleLogout} className="btn btn-danger" style={{ width: 'auto', padding: '10px 20px', fontSize: '0.9rem', boxShadow: 'none' }}>
                            Esci
                        </button>
                    </div>
                </div>

                {/* Settings Section */}
                {showSettings && (
                    <div className="card-ghost mb-6">
                        <h3 className="mb-4">Impostazioni Admin</h3>
                        <div className="card" style={{ padding: '1.5rem', marginBottom: 0 }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Cambia Password Admin</h4>
                            <form onSubmit={handleUpdatePassword} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    placeholder="Nuovo Codice Admin"
                                    value={newAdminCode}
                                    onChange={(e) => setNewAdminCode(e.target.value)}
                                    style={{ maxWidth: '300px', marginBottom: 0 }}
                                />
                                <button type="submit" className="btn btn-success" style={{ width: 'auto', padding: '10px 24px', boxShadow: 'none' }}>
                                    Salva Password
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Users Wage Section */}
                {showUsers && (
                    <div className="card-ghost mb-6">
                        <h3 className="mb-4">Gestione Paga Oraria</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                            {users.map(u => (
                                <div key={u.id} className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>{u.code}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>€/h</label>
                                        <input
                                            type="number"
                                            defaultValue={u.hourlyWage || 7}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (parseFloat(val) !== u.hourlyWage) {
                                                    handleUpdateWage(u.id, val);
                                                }
                                            }}
                                            style={{ width: '80px', padding: '8px', marginBottom: 0, textAlign: 'right' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
                        <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                            ⏱️
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.2rem' }}>Ore Totali (Periodo)</h3>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>{summary.totalHours.toFixed(2)} h</p>
                        </div>
                    </div>
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 0 }}>
                        <div style={{ background: 'var(--success)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                            💰
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.2rem' }}>Stipendio Stimato</h3>
                            <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--success)', margin: 0 }}>€ {summary.totalSalary.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Table Section */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>

                    {/* Filters Toolbar */}
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface-alt)' }}>
                        <form onSubmit={handleFilter} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ minWidth: '140px' }}>
                                    <label className="label">Dal</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        style={{ padding: '10px', marginBottom: 0 }}
                                    />
                                </div>
                                <div style={{ minWidth: '140px' }}>
                                    <label className="label">Al</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        style={{ padding: '10px', marginBottom: 0 }}
                                    />
                                </div>
                                <div style={{ minWidth: '180px' }}>
                                    <label className="label">Dipendente</label>
                                    <select
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: 'var(--radius)',
                                            border: '2px solid transparent',
                                            background: 'white',
                                            fontSize: '1rem',
                                            outline: 'none',
                                            fontWeight: 500
                                        }}
                                    >
                                        <option value="">Tutti i dipendenti</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: 'auto', padding: '10px 24px', marginBottom: 0, boxShadow: 'none' }}>
                                    Filtra
                                </button>
                                <button type="button" onClick={handleReset} className="btn btn-ghost" style={{ width: 'auto', padding: '10px 24px', marginBottom: 0 }}>
                                    Reset
                                </button>
                                <button type="button" onClick={handleExport} className="btn btn-success" disabled={entries.length === 0} style={{ width: 'auto', padding: '10px 24px', marginBottom: 0, marginLeft: '1rem', boxShadow: 'none' }}>
                                    📥 CSV
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Data/Ora</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dipendente</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Codice</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stato</th>
                                    <th style={{ padding: '1.2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry) => (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1.2rem' }}>
                                            <div style={{ fontWeight: 500 }}>{new Date(entry.timestamp).toLocaleDateString()}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(entry.timestamp).toLocaleTimeString()}</div>
                                        </td>
                                        <td style={{ padding: '1.2rem', fontWeight: 'bold' }}>{entry.user.name}</td>
                                        <td style={{ padding: '1.2rem' }}>
                                            <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                                                {entry.user.code}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1.2rem' }}>
                                            {entry.type === 'IN' ? (
                                                <span className="status-badge status-in" style={{ fontSize: '0.75rem' }}>ENTRATA</span>
                                            ) : (
                                                <span className="status-badge status-out" style={{ fontSize: '0.75rem' }}>USCITA</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {entry.hasPhoto ? (
                                                <button
                                                    onClick={() => handleOpenPhoto(entry.id)}
                                                    className="btn btn-secondary"
                                                    disabled={loadingPhoto}
                                                    style={{ width: 'auto', padding: '8px 16px', fontSize: '0.85rem', marginBottom: 0 }}
                                                >
                                                    {loadingPhoto ? '...' : '📸 Foto'}
                                                </button>
                                            ) : (
                                                <span style={{ padding: '8px 16px', fontSize: '0.85rem', opacity: 0.3 }}>No Foto</span>
                                            )}
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                className="btn btn-ghost"
                                                style={{ width: 'auto', padding: '8px', color: 'var(--danger)', marginBottom: 0 }}
                                                title="Elimina"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {entries.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                            Nessuna attività trovata per il periodo selezionato.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        {loading && <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--primary)' }}>Caricamento dati in corso...</div>}
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
                            background: 'rgba(0,0,0,0.85)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '1rem',
                            backdropFilter: 'blur(8px)'
                        }}
                        onClick={() => setSelectedPhoto(null)}
                    >
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                            <img
                                src={selectedPhoto}
                                alt="Prova lavoro"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '90vh',
                                    borderRadius: '12px',
                                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                    border: '4px solid white'
                                }}
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-50px',
                                    right: '-10px',
                                    background: 'white',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}


                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6, color: 'var(--text-muted)' }}>
                    Easy Employee Management - Admin Panel
                </div>
            </div>
        </main>
    );
}
