'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
    const [user, setUser] = useState<any>(null);
    const [status, setStatus] = useState('LOADING'); // IN, OUT, LOADING
    const [lastEntry, setLastEntry] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchStatus(parsedUser.id);
    }, []);

    const fetchStatus = async (userId: number) => {
        try {
            const res = await fetch(`/api/status?userId=${userId}`);
            const data = await res.json();
            setStatus(data.status); // IN or OUT
            setLastEntry(data.lastEntry);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNativeClock = async (type: 'IN' | 'OUT', file: File) => {
        if (!user) return;
        setLoading(true);

        try {
            // Compress Image - ULTRA FAST MODE
            const compressedFile = await new Promise<File>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300; // Ultra-fast resize (Thumbnail size ~15KB)
                    const scaleSize = MAX_WIDTH / img.width;

                    // Only resize if wider than MAX_WIDTH
                    if (scaleSize < 1) {
                        canvas.width = MAX_WIDTH;
                        canvas.height = img.height * scaleSize;
                    } else {
                        canvas.width = img.width;
                        canvas.height = img.height;
                    }

                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            resolve(file); // Fallback
                        }
                    }, 'image/jpeg', 0.4); // 40% quality - SPEED PRIORITY
                };
                img.onerror = () => resolve(file); // Fallback on error
            });

            const formData = new FormData();
            formData.append('userId', user.id);
            formData.append('type', type);
            formData.append('image', compressedFile);

            const res = await fetch('/api/clock', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                await fetchStatus(user.id);
                // alert('Timbratura registrata con successo!'); // Optional: remove alert for speed? keeping it for feedback
                alert('Fatto! Timbratura inviata.');
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
            <div className="animate-slide-up">

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <p className="text-muted" style={{ marginBottom: '0.2rem' }}>Bentornato,</p>
                        <h2 style={{ margin: 0 }}>{user.name}</h2>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost" style={{ width: 'auto', fontSize: '0.9rem' }}>
                        Esci
                    </button>
                </div>

                {/* Status Card */}
                <div className="card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p className="text-muted" style={{ marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '1px' }}>Stato Attuale</p>

                    <div style={{ marginBottom: '1.5rem' }}>
                        {status === 'LOADING' ? (
                            <span className="status-badge" style={{ background: '#e2e8f0', color: '#64748b' }}>...</span>
                        ) : status === 'IN' ? (
                            <span className="status-badge status-in" style={{ fontSize: '1.2rem', padding: '12px 32px' }}>AL LAVORO</span>
                        ) : (
                            <span className="status-badge status-out" style={{ fontSize: '1.2rem', padding: '12px 32px' }}>NON AL LAVORO</span>
                        )}
                    </div>

                    {lastEntry && (
                        <div style={{ background: 'var(--surface-alt)', padding: '12px', borderRadius: '12px', display: 'inline-block' }}>
                            <p style={{ fontSize: '0.9rem', margin: 0, color: 'var(--text-secondary)' }}>
                                Ultima {lastEntry.type === 'IN' ? 'entrata' : 'uscita'}: <strong>{new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                            </p>
                            <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0', opacity: 0.7 }}>
                                {new Date(lastEntry.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                {status !== 'LOADING' && (
                    <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
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

                        {status === 'OUT' ? (
                            <button
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                className="btn btn-success"
                                style={{
                                    padding: '24px',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.25)'
                                }}
                                disabled={loading}
                            >
                                <span style={{ marginRight: '10px', fontSize: '1.4rem' }}>📸</span>
                                {loading ? 'Caricamento...' : 'TIMBRA ENTRATA'}
                            </button>
                        ) : (
                            <button
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                className="btn btn-danger"
                                style={{
                                    padding: '24px',
                                    fontSize: '1.1rem',
                                    boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.25)'
                                }}
                                disabled={loading}
                            >
                                <span style={{ marginRight: '10px', fontSize: '1.4rem' }}>📸</span>
                                {loading ? 'Caricamento...' : 'TIMBRA USCITA'}
                            </button>
                        )}
                    </div>
                )}

                {/* Secondary Actions */}
                <div>
                    <Link href="/dashboard/history" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
                        📅 Visualizza Storico Ore
                    </Link>
                </div>

                {/* Footer */}
                <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.6 }}>
                    <p className="text-muted">Easy Employee Management</p>
                </div>
            </div>
        </main >
    );
}
