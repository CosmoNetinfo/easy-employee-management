import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, subscription } = await request.json();

        if (!userId || !subscription) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        // Save subscription, update if exists based on endpoint
        const savedSub = await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId: parseInt(userId),
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            create: {
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                userId: parseInt(userId)
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Subscription failed' }, { status: 500 });
    }
}
