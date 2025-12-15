
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const entries = await prisma.entry.findMany({
            where: {
                userId: parseInt(userId)
            },
            select: {
                id: true,
                type: true,
                timestamp: true,
                // We don't need user details here as we know who we are
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: 100, // Limit to last 100 entries for performance
        });

        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
