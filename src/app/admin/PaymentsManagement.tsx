'use client';
import { useState, useEffect } from 'react';

interface Payment {
    id: number;
    amount: number;
    paymentDate: string;
    periodStart: string;
    periodEnd: string;
    notes?: string;
    userId: number;
    user: {
        name: string;
        code: string;
    };
}

interface User {
    id: number;
    name: string;
    code: string;
}

interface PaymentsManagementProps {
    users: User[];
}

export default function PaymentsManagement({ users }: PaymentsManagementProps) {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [selectedUserId, setSelectedUserId] = useState('');
    const [amount, setAmount] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [notes, setNotes] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAllPayments();
    }, []);

    const fetchAllPayments = async () => {
        setLoading(true);
        try {
            // Fetch payments for all users
            const allPayments: Payment[] = [];
            for (const user of users) {
                const res = await fetch(`/api/payments?userId=${user.id}`);
                if (res.ok) {
                    const data = await res.json();
                    allPayments.push(...data.payments.map((p: Payment) => ({
                        ...p,
                        user: { name: user.name, code: user.code }
                    })));
                }
            }
            // Sort by payment date descending
            allPayments.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
            setPayments(allPayments);
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !amount || !periodStart || !periodEnd) {
            alert('Compila tutti i campi obbligatori');
            return;
        }

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: parseInt(selectedUserId),
                    amount: parseFloat(amount),
                    periodStart,
                    periodEnd,
                    paymentDate,
                    notes: notes || null
                })
            });

            if (res.ok) {
                alert('Pagamento registrato con successo!');
                setShowAddForm(false);
                // Reset form
                setSelectedUserId('');
                setAmount('');
                setPeriodStart('');
                setPeriodEnd('');
                setNotes('');
                setPaymentDate(new Date().toISOString().split('T')[0]);
                // Refresh payments
                fetchAllPayments();
            } else {
                alert('Errore durante la registrazione del pagamento');
            }
        } catch (error) {
            alert('Errore di connessione');
        }
    };

    const handleDeletePayment = async (paymentId: number) => {
        if (!confirm('Sei sicuro di voler eliminare questo pagamento?')) return;

        try {
            const res = await fetch(`/api/payments?paymentId=${paymentId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert('Pagamento eliminato');
                fetchAllPayments();
            } else {
                alert('Errore durante l\'eliminazione');
            }
        } catch (error) {
            alert('Errore di connessione');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return (
        <div className="mb-8 animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>💰 Gestione Pagamenti</h3>
                    <p className="text-muted" style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                        Totale pagato: <strong style={{ color: 'var(--success)' }}>{formatCurrency(totalPaid)}</strong>
                    </p>
                </div>
                <button 
                    onClick={() => setShowAddForm(!showAddForm)} 
                    className="btn btn-primary"
                >
                    {showAddForm ? 'Annulla' : '+ Nuovo Pagamento'}
                </button>
            </div>

            {/* Add Payment Form */}
            {showAddForm && (
                <div className="card mb-4 animate-slide-up">
                    <h4 className="mb-4">Registra Nuovo Pagamento</h4>
                    <form onSubmit={handleAddPayment}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Dipendente *</label>
                                <select 
                                    value={selectedUserId} 
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                    required
                                >
                                    <option value="">Seleziona dipendente</option>
                                    {users.filter(u => u.id !== 1).map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.code})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Importo (€) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Data Pagamento *</label>
                                <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label className="label">Periodo Dal *</label>
                                <input
                                    type="date"
                                    value={periodStart}
                                    onChange={(e) => setPeriodStart(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Periodo Al *</label>
                                <input
                                    type="date"
                                    value={periodEnd}
                                    onChange={(e) => setPeriodEnd(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label className="label">Note (opzionale)</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Aggiungi note sul pagamento..."
                                rows={3}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>
                        <button type="submit" className="btn btn-success">
                            💾 Salva Pagamento
                        </button>
                    </form>
                </div>
            )}

            {/* Payments List */}
            {loading ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <p className="text-muted">Caricamento pagamenti...</p>
                </div>
            ) : payments.length === 0 ? (
                <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <h4>Nessun pagamento registrato</h4>
                    <p className="text-muted">Clicca su "Nuovo Pagamento" per registrare il primo pagamento</p>
                </div>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Data Pagamento</th>
                                <th>Dipendente</th>
                                <th>Periodo</th>
                                <th>Importo</th>
                                <th>Note</th>
                                <th>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <div className="font-medium">{formatDate(payment.paymentDate)}</div>
                                    </td>
                                    <td>
                                        <div className="font-bold">{payment.user.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                                            {payment.user.code}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            {formatDate(payment.periodStart)}
                                            <br />
                                            <span className="text-muted">→</span> {formatDate(payment.periodEnd)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold" style={{ color: 'var(--success)', fontSize: '1.1rem' }}>
                                            {formatCurrency(payment.amount)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                                            {payment.notes || <span className="text-muted">-</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => handleDeletePayment(payment.id)}
                                            className="btn btn-ghost"
                                            style={{ color: 'var(--danger)', padding: '8px 12px' }}
                                            title="Elimina"
                                        >
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
