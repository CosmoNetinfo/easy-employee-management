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
            <div className="glass card animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <h2>Pannello di Controllo</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setShowUsers(!showUsers)} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--primary)', opacity: showUsers ? 0.8 : 1 }}>
                            {showUsers ? 'Chiudi Dipendenti' : 'Gestione Dipendenti'}
                        </button>
                        <button onClick={() => setShowSettings(!showSettings)} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--surface)' }}>
                            {showSettings ? 'Settings' : 'Impostazioni'}
                        </button>
                        <button onClick={handleLogout} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.9rem', background: 'var(--danger)' }}>
                            Esci
                        </button>
                    </div>
                </div>

                {showSettings && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Cambia Password Admin</h3>
                        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Nuovo Codice Admin"
                                value={newAdminCode}
                                onChange={(e) => setNewAdminCode(e.target.value)}
                                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)' }}
                            />
                            <button type="submit" className="btn" style={{ width: 'auto', background: 'var(--success)' }}>
                                Salva
                            </button>
                        </form>
                    </div>
                )}

                {showUsers && (
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Gestione Paga Oraria</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {users.map(u => (
                                <div key={u.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                        <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{u.code}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <label style={{ fontSize: '0.8rem' }}>€/h</label>
                                        <input
                                            type="number"
                                            defaultValue={u.hourlyWage || 7}
                                            onBlur={(e) => {
                                                const val = e.target.value;
                                                if (parseFloat(val) !== u.hourlyWage) {
                                                    handleUpdateWage(u.id, val);
                                                }
                                            }}
                                            style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', background: 'var(--background)', color: 'white', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Section */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Ore Totali (Periodo)</h3>
                        <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{summary.totalHours.toFixed(2)} h</p>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                            <h3 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>Stipendio Stimato Totale</h3>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>€ {summary.totalSalary.toFixed(2)}</p>
                        </div>
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
                                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {entry.hasPhoto ? (
                                            <button
                                                onClick={() => handleOpenPhoto(entry.id)}
                                                className="btn"
                                                disabled={loadingPhoto}
                                                style={{
                                                    textDecoration: 'none',
                                                    background: 'var(--primary)',
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.9rem',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'white',
                                                    opacity: loadingPhoto ? 0.7 : 1
                                                }}
                                            >
                                                <span>📸</span> {loadingPhoto ? '...' : 'Apri'}
                                            </button>
                                        ) : (
                                            <span style={{ opacity: 0.3, padding: '0.5rem' }}>-</span>
                                        )}
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            style={{
                                                background: 'var(--danger)',
                                                border: 'none',
                                                padding: '0.5rem 0.8rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                color: 'white',
                                                fontSize: '1rem'
                                            }}
                                            title="Elimina per sempre"
                                        >
                                            🗑️
                                        </button>
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
                            padding: '1rem',
                            backdropFilter: 'blur(5px)'
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
                                    borderRadius: '8px',
                                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                    border: '2px solid rgba(255,255,255,0.1)'
                                }}
                            />
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: 0,
                                    background: 'white',
                                    color: 'black',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                X
                            </button>
                        </div>
                    </div>
                )}


                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, color: 'var(--text-muted)' }}>
                    Creata da Daniele Spalletti per <a href="https://easyevent.it/" target="_blank" style={{ color: 'inherit', textDecoration: 'underline' }}>EasyEvent.it</a>
                </div>
            </div>
        </main>
    );
}
