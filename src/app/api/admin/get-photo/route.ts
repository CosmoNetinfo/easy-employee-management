import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        }

        const entry = await prisma.entry.findUnique({
            where: { id: Number(id) },
            select: { photoUrl: true }
        });

        if (!entry || !entry.photoUrl) {
            return NextResponse.json({ error: 'Foto non trovata' }, { status: 404 });
        }

        return NextResponse.json({ photoUrl: entry.photoUrl });
    } catch (error) {
        return NextResponse.json({ error: 'Errore server' }, { status: 500 });
    }
}
