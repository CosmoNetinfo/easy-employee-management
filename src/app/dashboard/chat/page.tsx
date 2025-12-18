'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BOv-BgSln0t15CXDT4_4yb0BYvapbSD850T_u4_3j30WC_e0UrltCi9sBkBVu0lIJPdjuS6RwM75OdXStzmK7Qc';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [user, setUser] = useState<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (!stored) {
            router.push('/');
            return;
        }
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        fetchMessages();

        // --- PUSH NOTIFICATION REGISTRATION ---
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(async (registration) => {
                try {
                    const subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                    });

                    // Send subscription to server
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ userId: parsedUser.id, subscription }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                } catch (e) {
                    console.error('Push subscription failed:', e);
                }
            });
        }

        const interval = setInterval(fetchMessages, 3000); // Poll every 3s
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await fetch('/api/chat');
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => {
                    // Only update if length changed to avoid jitter, though simple replacement is fine for MVP
                    if (prev.length !== data.length) {
                        setTimeout(scrollToBottom, 100);
                        return data;
                    }
                    return data;
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            const content = newMessage;
            setNewMessage(''); // optimistic clear

            await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, content }),
            });
            fetchMessages(); // Immediate refresh
        } catch (e) {
            console.error('Send failed');
        }
    };

    if (!user) return null;

    return (
        <main className="mobile-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0b141a' }}> {/* WhatsApp Dark BG */}

            {/* Header */}
            <div style={{
                padding: '1rem',
                background: '#202c33',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                color: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                zIndex: 10
            }}>
                <Link href="/dashboard" style={{ textDecoration: 'none', color: '#aebac1', fontSize: '1.5rem' }}>
                    ←
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px', height: '40px',
                        borderRadius: '50%', background: '#00a884',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 'bold'
                    }}>
                        🏢
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>Chat Aziendale</div>
                        <div style={{ fontSize: '0.8rem', color: '#aebac1' }}>Tutti i dipendenti</div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', // Subtle Pattern
                backgroundBlendMode: 'overlay',
                backgroundColor: '#0b141a'
            }}>
                {messages.map((msg) => {
                    const isMe = msg.userId === user.id;
                    return (
                        <div key={msg.id} style={{
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '80%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {!isMe && (
                                <span style={{ fontSize: '0.75rem', color: '#aebac1', marginLeft: '10px', marginBottom: '2px' }}>
                                    {msg.user.name.split(' ')[0]}
                                    {msg.user.role === 'ADMIN' && <span style={{ color: '#00a884', marginLeft: '4px' }}>★</span>}
                                </span>
                            )}
                            <div style={{
                                background: isMe ? '#005c4b' : '#202c33',
                                color: '#e9edef',
                                padding: '8px 12px',
                                borderRadius: '10px',
                                borderTopLeftRadius: !isMe ? '0' : '10px',
                                borderTopRightRadius: isMe ? '0' : '10px',
                                boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                                fontSize: '0.95rem',
                                wordWrap: 'break-word'
                            }}>
                                {msg.content}
                                <div style={{
                                    fontSize: '0.65rem',
                                    color: 'rgba(255,255,255,0.6)',
                                    textAlign: 'right',
                                    marginTop: '4px',
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    alignItems: 'flex-end',
                                    gap: '4px'
                                }}>
                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMe && <span style={{ color: '#53bdeb' }}>✓✓</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} style={{
                padding: '10px',
                background: '#202c33',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Scrivi un messaggio..."
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '24px',
                        border: 'none',
                        background: '#2a3942',
                        color: 'white',
                        fontSize: '1rem',
                        outline: 'none'
                    }}
                />
                <button type="submit" style={{
                    background: '#00a884',
                    border: 'none',
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '1.2rem'
                }}>
                    ➤
                </button>
            </form>

        </main>
    );
}
