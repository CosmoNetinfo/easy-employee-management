import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching for admin data

export async function GET() {
    try {
        const entries = await prisma.entry.findMany({
            include: {
                user: true,
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: 100, // Limit to last 100 for now
        });

        return NextResponse.json(entries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
