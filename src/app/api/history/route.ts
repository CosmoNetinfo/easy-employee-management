
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

        const [entries, user] = await Promise.all([
            prisma.entry.findMany({
                where: { userId: parseInt(userId) },
                select: {
                    id: true,
                    type: true,
                    timestamp: true,
                },
                orderBy: { timestamp: 'desc' },
                take: 100,
            }),
            prisma.user.findUnique({
                where: { id: parseInt(userId) },
                select: { hourlyWage: true },
            }),
        ]);

        return NextResponse.json({
            entries,
            hourlyWage: user?.hourlyWage ?? 7.0,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
}
