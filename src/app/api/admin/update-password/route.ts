import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, newCode } = await request.json();

        if (!userId || !newCode) {
            return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
        }

        // Verifica che l'utente che sta facendo la richiesta sia davvero un ADMIN
        const requester = await prisma.user.findUnique({
            where: { id: Number(userId) },
        });

        if (!requester || requester.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
        }

        // Aggiorna il codice
        await prisma.user.update({
            where: { id: Number(userId) },
            data: { code: newCode },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update password error:', error);
        return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
    }
}
