'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Payment {
    id: number;
    amount: number;
    paymentDate: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
}

interface User {
    id: number;
    name: string;
    code: string;
    role: string;
}

export default function PaymentsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalEarned, setTotalEarned] = useState(0);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchPayments(parsedUser.id);
    }, [router]);

    const fetchPayments = async (userId: number) => {
        try {
            const res = await fetch(`/api/payments?userId=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
                const total = data.payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
                setTotalEarned(total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/');
    };

    if (!user) return null;

    return (
        <main className="mobile-container">
            <div className="animate-slide-up" style={{ padding: '2rem 1.5rem', flex: 1, paddingBottom: '100px' }}>
                
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <Link href="/dashboard" style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                    }}>
                        ← Torna alla Dashboard
                    </Link>
                    <h1 style={{ 
                        fontSize: '2rem', 
                        margin: '0 0 0.5rem 0',
                        background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        💰 I Miei Pagamenti
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Storico dei pagamenti ricevuti
                    </p>
                </div>

                {/* Total Earned Card */}
                <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '20px',
                    padding: '2rem',
                    marginBottom: '2rem',
                    boxShadow: 'var(--shadow-lg)',
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '150px',
                        height: '150px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%',
                        filter: 'blur(40px)'
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                            Totale Guadagnato
                        </div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                            {formatCurrency(totalEarned)}
                        </div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '0.5rem' }}>
                            {payments.length} {payments.length === 1 ? 'pagamento ricevuto' : 'pagamenti ricevuti'}
                        </div>
                    </div>
                </div>

                {/* Payments List */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                        Caricamento...
                    </div>
                ) : payments.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem 1rem',
                        background: 'var(--surface)',
                        borderRadius: '16px',
                        border: '2px dashed var(--border)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text)' }}>
                            Nessun pagamento ancora
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            I tuoi pagamenti appariranno qui quando verranno registrati
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {payments.map((payment, index) => (
                            <div
                                key={payment.id}
                                className="animate-fade-in"
                                style={{
                                    animationDelay: `${index * 0.1}s`,
                                    background: 'var(--surface)',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    boxShadow: 'var(--shadow-md)',
                                    border: '1px solid var(--border)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                            >
                                {/* Payment Header */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start',
                                    marginBottom: '1rem'
                                }}>
                                    <div>
                                        <div style={{ 
                                            fontSize: '1.5rem', 
                                            fontWeight: 'bold',
                                            color: 'var(--accent-dark)',
                                            marginBottom: '0.25rem'
                                        }}>
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        <div style={{ 
                                            fontSize: '0.85rem', 
                                            color: 'var(--text-secondary)' 
                                        }}>
                                            Pagato il {formatDate(payment.paymentDate)}
                                        </div>
                                    </div>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        color: 'white',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600'
                                    }}>
                                        ✓ Pagato
                                    </div>
                                </div>

                                {/* Period Info */}
                                <div style={{
                                    background: 'var(--background)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    marginBottom: payment.notes ? '1rem' : 0
                                }}>
                                    <div style={{ 
                                        fontSize: '0.8rem', 
                                        color: 'var(--text-secondary)',
                                        marginBottom: '0.5rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px'
                                    }}>
                                        Periodo di Riferimento
                                    </div>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem',
                                        color: 'var(--text)'
                                    }}>
                                        <span>📅 {formatDate(payment.periodStart)}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>→</span>
                                        <span>📅 {formatDate(payment.periodEnd)}</span>
                                    </div>
                                </div>

                                {/* Notes */}
                                {payment.notes && (
                                    <div style={{
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderLeft: '3px solid var(--accent)',
                                        borderRadius: '8px',
                                        padding: '0.75rem 1rem',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <strong style={{ color: 'var(--text)' }}>Note:</strong> {payment.notes}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Bottom Navigation */}
            <div className="bottom-nav animate-slide-up">
                <Link href="/dashboard" className="nav-item">
                    <span style={{ fontSize: '1.2rem' }}>🏠</span>
                    Home
                </Link>
                <Link href="/dashboard/chat" className="nav-item">
                    <span style={{ fontSize: '1.2rem' }}>💬</span>
                    Chat
                </Link>
                <div className="nav-item active">
                    <span style={{ fontSize: '1.2rem' }}>💰</span>
                    Pagamenti
                </div>
                <div onClick={handleLogout} className="nav-item" style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: '1.2rem' }}>👤</span>
                    Esci
                </div>
            </div>
        </main>
    );
}
