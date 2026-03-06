'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { saveOfflineEntry, getAllOfflineEntries, deleteOfflineEntry } from '@/utils/offlineStore';

interface User {
    id: number;
    name: string;
    role: string;
    profileImage?: string;
}

interface Entry {
    id: number;
    timestamp: string;
    type: string;
}

export default function Dashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState('LOADING'); // IN, OUT, LOADING
    const [lastEntry, setLastEntry] = useState<Entry | null>(null);
    const [loading, setLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const router = useRouter();

    const fetchStatus = async (userId: number) => {
        if (!navigator.onLine) return;
        try {
            const res = await fetch(`/api/status?userId=${userId}`);
            if (!res.ok) throw new Error(`Status API error: ${res.status}`);
            const data = await res.json();
            setStatus(data.status); 
            setLastEntry(data.lastEntry);
        } catch (e) {
            console.error('Fetch status error:', e);
        }
    };

    const syncOfflineEntries = useCallback(async () => {
        if (!navigator.onLine || !user || isSyncing) return;

        const entries = await getAllOfflineEntries();
        if (entries.length === 0) return;

        setIsSyncing(true);
        console.log(`Syncing ${entries.length} offline entries...`);

        for (const entry of entries) {
            try {
                const formData = new FormData();
                formData.append('userId', String(entry.userId));
                formData.append('type', entry.type);
                formData.append('timestamp', entry.timestamp);
                formData.append('image', entry.imageBlob, `offline_${entry.timestamp}.jpg`);

                const res = await fetch('/api/clock', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    await deleteOfflineEntry(entry.id!);
                }
            } catch (err) {
                console.error('Sync failed for entry:', entry, err);
                break; // Stop syncing if something goes wrong
            }
        }

        setIsSyncing(false);
        fetchStatus(user.id);
    }, [user, isSyncing]);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        if (!user) setUser(parsedUser);

        // Fetch status once on mount
        if (!lastEntry) fetchStatus(parsedUser.id);

        // Network status listeners
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineEntries();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOnline(navigator.onLine);

        // Initial sync attempt - only if online and we haven't synced yet
        if (navigator.onLine && !isSyncing) {
            syncOfflineEntries();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []); // Run once on mount

    const handleNativeClock = async (type: 'IN' | 'OUT', file: File) => {
        if (!user) return;
        setLoading(true);

        try {
            // Compress Image Logic (Keep existing logic)
            const compressedFile = await new Promise<File>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 300;
                    const scaleSize = MAX_WIDTH / img.width;
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
                        if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        else resolve(file);
                    }, 'image/jpeg', 0.5);
                };
                img.onerror = () => resolve(file);
            });

            if (!navigator.onLine) {
                // Offline Logic
                await saveOfflineEntry({
                    userId: user.id,
                    type,
                    timestamp: new Date().toISOString(),
                    imageBlob: compressedFile,
                    imageType: 'image/jpeg'
                });
                
                alert('🔴 Offline: Timbratura salvata localmente. Verrà sincronizzata appena torni online.');
                // Optimistic UI update
                setStatus(type === 'IN' ? 'IN' : 'OUT');
                setLastEntry({ 
                    id: Date.now(), 
                    timestamp: new Date().toISOString(),
                    type: type
                });
                return;
            }

            const formData = new FormData();
            formData.append('userId', String(user.id));
            formData.append('type', type);
            formData.append('image', compressedFile);

            try {
                const res = await fetch('/api/clock', {
                    method: 'POST',
                    body: formData,
                });

                if (res.ok) {
                    await fetchStatus(user.id);
                } else {
                    const errorText = await res.text();
                    console.error('Server returned error:', errorText);
                    throw new Error('Server error');
                }
            } catch (err) {
                console.warn('Network or server error, saving offline...', err);
                await saveOfflineEntry({
                    userId: user.id,
                    type,
                    timestamp: new Date().toISOString(),
                    imageBlob: compressedFile,
                    imageType: 'image/jpeg'
                });
                alert('🔴 Salvataggio Locale: Errore di connessione o del server. La timbratura è stata salvata sul telefono.');
                setStatus(type === 'IN' ? 'IN' : 'OUT');
                setLastEntry({ 
                    id: Date.now(), 
                    timestamp: new Date().toISOString(),
                    type: type
                });
            }
        } catch (e) {
            console.error('General clock error:', e);
            alert('Errore di connessione o processamento immagine');
        } finally {
            setLoading(false);
            const input = document.getElementById('cameraInput') as HTMLInputElement;
            if (input) input.value = '';
        }
    };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        const file = e.target.files[0];

        try {
            // 1. Compress/Resize Image
            const base64Image = await new Promise<string>((resolve) => {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_SIZE = 150; // Thumbnail size
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Auto base64
                };
            });

            // 2. Upload to API
            const res = await fetch('/api/user/upload-profile-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, image: base64Image }),
            });

            if (res.ok) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const data = await res.json();
                // 3. Update Local State
                const updatedUser = { ...user, profileImage: base64Image };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist
            } else {
                alert('Errore caricamento foto');
            }
        } catch (e) {
            console.error(e);
            alert('Errore durante il caricamento');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <main className="mobile-container">
            <div className="animate-slide-up" style={{ padding: '2rem 1.5rem', flex: 1, paddingBottom: '100px' }}>

                {/* 1. Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', margin: 0, lineHeight: 1.2 }}>Ciao, <br />
                            <span style={{ color: 'var(--accent-dark)' }}>{user.name.split(' ')[0]}</span></h2>
                        {/* Status Indicators */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            {!isOnline && (
                                <span style={{ 
                                    background: 'var(--danger)', 
                                    color: 'white', 
                                    fontSize: '0.7rem', 
                                    padding: '2px 8px', 
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    ● Offline
                                </span>
                            )}
                            {isSyncing && (
                                <span style={{ 
                                    background: 'var(--primary)', 
                                    color: 'white', 
                                    fontSize: '0.7rem', 
                                    padding: '2px 8px', 
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    animation: 'pulse 1.5s infinite'
                                }}>
                                    Sincronizzazione...
                                </span>
                            )}
                        </div>
                    </div>
                    {/* User Profile Pic - Clickable */}
                    <div style={{ position: 'relative' }}>
                        <input
                            type="file"
                            accept="image/*"
                            id="profileInput"
                            style={{ display: 'none' }}
                            onChange={handleProfileUpload}
                        />
                        <div
                            onClick={() => document.getElementById('profileInput')?.click()}
                            style={{
                                width: '60px',
                                height: '60px',
                                background: user.profileImage ? `url(${user.profileImage}) no-repeat center/cover` : 'var(--surface)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                color: 'var(--text-secondary)',
                                fontSize: '1.2rem',
                                border: '2px solid var(--accent)',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-lg)'
                            }}
                        >
                            {!user.profileImage && user.name.charAt(0)}
                            {/* Edit Icon Overlay */}
                            <div style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -2,
                                background: 'var(--accent)',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                color: 'white',
                                border: '2px solid rgba(0,0,0,0.2)'
                            }}>
                                ✎
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Status Sphere */}
                <div style={{ margin: '2rem 0', display: 'flex', justifyContent: 'center' }}>
                    {status === 'LOADING' ? (
                        <div className="status-sphere" style={{ background: 'rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'var(--text-muted)' }}>{isSyncing ? 'Sincronizzazione...' : 'Caricamento...'}</span>
                        </div>
                    ) : status === 'IN' ? (
                        <div className="status-sphere sphere-in">
                            <div className="sphere-glass-overlay" />
                            <div className="status-text-label">STATO ATTUALE:</div>
                            <div className="status-text-main">AL LAVORO</div>
                            {lastEntry && (
                                <div style={{ marginTop: '10px', color: 'white', opacity: 0.9, fontSize: '0.9rem', fontWeight: 500 }}>
                                    Dalle ore {new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '30px', right: '40px', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '50%' }}>
                                🕒
                            </div>
                        </div>
                    ) : (
                        <div className="status-sphere sphere-out">
                            <div className="sphere-glass-overlay" />
                            <div className="status-text-label">STATO ATTUALE:</div>
                            <div className="status-text-main" style={{ fontSize: '1.8rem' }}>NON AL LAVORO</div>
                            <div style={{ marginTop: '10px', color: 'white', opacity: 0.9, fontSize: '0.9rem', fontWeight: 500 }}>
                                Riposo...
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. Action Grid */}
                {status !== 'LOADING' && (
                    <div className="action-grid">
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

                        {/* Button 1: Clock Action */}
                        {status === 'OUT' ? (
                            <button
                                className="btn-square-lg btn-green"
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                disabled={loading}
                            >
                                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</span>
                                {loading ? 'Attendere...' : 'Timbra Entrata'}
                            </button>
                        ) : (
                            <button
                                className="btn-square-lg btn-red"
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                disabled={loading}
                            >
                                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</span>
                                {loading ? 'Attendere...' : 'Timbra Uscita'}
                            </button>
                        )}

                        {/* Button 2: View History */}
                        <Link href="/dashboard/history" className="btn-square-lg btn-glass" style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</span>
                            Vedi Storico
                        </Link>

                        {/* Button 3: View Payments */}
                        <Link href="/dashboard/payments" className="btn-square-lg btn-glass" style={{ textDecoration: 'none', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))' }}>
                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</span>
                            Pagamenti
                        </Link>
                    </div>
                )}
            </div>

            {/* 4. Bottom Navigation */}
            <div className="bottom-nav animate-slide-up">
                <div onClick={() => { if (user) { setStatus('LOADING'); fetchStatus(user.id); } }} className="nav-item active" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>🏠</span>
                    Home
                </div>
                <Link href="/dashboard/chat" className="nav-item">
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    Chat
                </Link>
                <Link href="/dashboard/payments" className="nav-item">
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    Pagamenti
                </Link>
                <div onClick={handleLogout} className="nav-item" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                    Esci
                </div>
            </div>

        </main>
    );
}
