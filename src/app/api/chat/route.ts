import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import webpush from 'web-push';

// Configure Web Push (Move keys to env vars in production!)
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BFRLzduIRujxUzlmOK-LxhUxJiUQW7pjRYVdP7FiwpuXc7jtKKqXiDTVyJ20bffkFzZB12Y72SMSYo69ijYZiiQ';
// Wait, I generated keys in Step 218 but didn't capture them well in the output log as I can't see the full output.
// I will assume the user needs to provide them or use a generated set.
// Actually, I can use the set generated: 
// Public: B... (partially visible)
// Private: ...
// To be safe and since I cannot see the output of step 218 fully, I will instruct the user to set ENV vars or I will generate a new set via node script and console.log them to capture.
// BUT, for now, I will use ENV variables in the code so the user can set them in Vercel.
// Environment Variables: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || ''
);

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

        return NextResponse.json(message);
    } catch (error) {
        console.error(error); // Log error
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
