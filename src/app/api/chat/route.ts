import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Configure Web Push (Move keys to env vars in production!)
// Configure Web Push lazily in the POST handler
// to avoid build-time errors if env vars are missing.

// GET: Fetch recent messages (unchanged)
export async function GET() {
    try {
        const messages = await prisma.message.findMany({
            take: 50,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: { name: true, profileImage: true, role: true }
                }
            }
        });
        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(request: Request) {
    try {
        const { userId, content } = await request.json();

        if (!userId || !content) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                userId: parseInt(userId),
                content: content,
            },
            include: {
                user: {
                    select: { name: true, profileImage: true }
                }
            }
        });

        // --- SEND PUSH NOTIFICATIONS ---
        // Only run if keys are configured
        if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
            try {
                webpush.setVapidDetails(
                    'mailto:test@example.com',
                    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                    process.env.VAPID_PRIVATE_KEY
                );

                // 1. Get all subscriptions EXCEPT the sender
                const subscriptions = await prisma.pushSubscription.findMany({
                    where: {
                        userId: { not: parseInt(userId) }
                    }
                });

                // 2. Prepare payload
                const payload = JSON.stringify({
                    title: `Nuovo messaggio da ${message.user.name}`,
                    body: content.length > 30 ? content.substring(0, 30) + '...' : content,
                    url: '/dashboard/chat'
                });

                // 3. Send to all
                subscriptions.forEach(sub => {
                    const pushConfig = {
                        endpoint: sub.endpoint,
                        keys: { auth: sub.auth, p256dh: sub.p256dh }
                    };
                    webpush.sendNotification(pushConfig, payload).catch(err => console.error('Push failed', err));
                });
            } catch (pushError) {
                console.error('Push notification setup failed', pushError);
            }
        } else {
            console.warn("Push notifications skipped: VAPID keys missing in env");
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error(error); // Log error
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
