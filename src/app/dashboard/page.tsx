'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

                        {status === 'OUT' ? (
                            <button
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                className="btn btn-primary"
                                style={{
                                    padding: '1.5rem',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'var(--success)'
                                }}
                                disabled={loading}
                            >
                                <span style={{ fontSize: '1.5rem' }}>📸</span>
                                {loading ? 'Invio in corso...' : 'SCATTA FOTO ENTRATA'}
                            </button>
                        ) : (
                            <button
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                className="btn"
                                style={{
                                    padding: '1.5rem',
                                    fontSize: '1.2rem',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    background: 'var(--danger)'
                                }}
                                disabled={loading}
                            >
                                <span style={{ fontSize: '1.5rem' }}>📸</span>
                                {loading ? 'Invio in corso...' : 'SCATTA FOTO USCITA'}
                            </button>
                        )}
                    </div>
                )}
            </div>
            {/* Footer */}
            <div style={{ marginTop: '3rem', textAlign: 'center', fontSize: '0.8rem', opacity: 0.5, color: 'var(--text-muted)' }}>
                Creata da Daniele Spalletti per <a href="https://easyevent.it/" target="_blank" style={{ color: 'inherit', textDecoration: 'underline' }}>EasyEvent.it</a>
            </div>
        </main>
    );
}
