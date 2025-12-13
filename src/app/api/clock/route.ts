import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, type } = await request.json();

        if (!userId || !['IN', 'OUT'].includes(type)) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const entry = await prisma.entry.create({
            data: {
                userId: Number(userId),
                type,
            },
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Clock operation failed' }, { status: 500 });
    }
}
