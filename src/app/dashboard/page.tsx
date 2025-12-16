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
        <main className="mobile-container">
            <div className="animate-slide-up" style={{ padding: '2rem 1.5rem', flex: 1 }}>

                {/* 1. Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Hello,</h2>
                        <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-dark)', margin: 0 }}>{user.name.split(' ')[0]}</h2>
                    </div>
                    {/* User Profile Pic Placeholder */}
                    <div style={{ width: '50px', height: '50px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#64748b' }}>
                        {user.name.charAt(0)}
                    </div>
                </div>

                {/* 2. Status Sphere */}
                <div style={{ margin: '3rem 0', display: 'flex', justifyContent: 'center' }}>
                    {status === 'LOADING' ? (
                        <div className="status-sphere" style={{ background: '#f1f5f9' }}>
                            <span style={{ color: '#94a3b8' }}>Loading...</span>
                        </div>
                    ) : status === 'IN' ? (
                        <div className="status-sphere sphere-in">
                            <div className="sphere-glass-overlay" />
                            <div className="status-text-label">CURRENTLY:</div>
                            <div className="status-text-main">AT WORK</div>
                            {lastEntry && (
                                <div style={{ marginTop: '10px', color: 'white', opacity: 0.8, fontSize: '0.9rem' }}>
                                    Since {new Date(lastEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}
                            <div style={{ position: 'absolute', top: '30px', right: '40px', background: 'rgba(255,255,255,0.2)', padding: '5px', borderRadius: '50%' }}>
                                🕒
                            </div>
                        </div>
                    ) : (
                        <div className="status-sphere sphere-out">
                            <div className="sphere-glass-overlay" />
                            <div className="status-text-label">CURRENTLY:</div>
                            <div className="status-text-main">OFF DUTY</div>
                            <div style={{ marginTop: '10px', color: 'white', opacity: 0.8, fontSize: '0.9rem' }}>
                                Relaxing...
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
                                {loading ? 'Wait...' : 'Clock In'}
                            </button>
                        ) : (
                            <button
                                className="btn-square-lg btn-red"
                                onClick={() => document.getElementById('cameraInput')?.click()}
                                disabled={loading}
                            >
                                <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</span>
                                {loading ? 'Wait...' : 'Clock Out'}
                            </button>
                        )}

                        {/* Button 2: View History */}
                        <Link href="/dashboard/history" className="btn-square-lg btn-glass" style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</span>
                            View History
                        </Link>
                    </div>
                )}
            </div>

            {/* 4. Bottom Navigation */}
            <div className="bottom-nav animate-slide-up">
                <Link href="/dashboard" className="nav-item active">
                    <span style={{ fontSize: '1.2rem' }}>🏠</span>
                    Home
                </Link>
                <Link href="/dashboard/history" className="nav-item">
                    <span style={{ fontSize: '1.2rem' }}>📅</span>
                    Schedule
                </Link>
                <div onClick={handleLogout} className="nav-item" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                    Profile/Logout
                </div>
            </div>

        </main>
    );
}
