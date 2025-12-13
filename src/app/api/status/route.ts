import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const lastEntry = await prisma.entry.findFirst({
            where: { userId: Number(userId) },
            orderBy: { timestamp: 'desc' },
        });

        // If no entry, they are OUT. If last entry is IN, they are IN.
        const status = lastEntry?.type === 'IN' ? 'IN' : 'OUT';

        return NextResponse.json({ status, lastEntry });
    } catch (error) {
        return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
    }
}
