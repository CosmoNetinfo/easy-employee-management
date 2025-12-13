import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching for admin data

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate'); // ISO string
        const endDate = searchParams.get('endDate');     // ISO string

        const where: any = {};

        if (userId) {
            where.userId = parseInt(userId);
        }

        if (startDate && endDate) {
            where.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            where.timestamp = {
                gte: new Date(startDate),
            };
        }

        const entries = await prisma.entry.findMany({
            where,
            include: {
                user: true,
            },
            orderBy: {
                timestamp: 'desc',
            },
            // Remove 'take' limit or increase it when filtering is active, 
            // but for now let's keep it unbound if filtered, or capped if not? 
            // Let's unbind it if filtered, or default to 500.
            take: (startDate || userId) ? undefined : 500,
        });

        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
