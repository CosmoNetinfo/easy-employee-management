
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { id, timestamp } = await request.json();

        if (!id || !timestamp) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const updatedEntry = await prisma.entry.update({
            where: { id: Number(id) },
            data: {
                timestamp: new Date(timestamp),
            },
        });

        return NextResponse.json(updatedEntry);
    } catch (error) {
        console.error('Error updating entry:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
