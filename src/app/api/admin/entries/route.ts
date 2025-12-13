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
            take: (startDate || userId) ? undefined : 100,
        });

        // Strip heavy Base64 data from list response
        const safeEntries = entries.map(e => ({
            ...e,
            hasPhoto: !!e.photoUrl && e.photoUrl.length > 0,
            photoUrl: null // Don't send the heavy string
        }));

        return NextResponse.json(safeEntries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
