import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID mancante' }, { status: 400 });
        }

        // Prima recuperiamo l'entry per vedere se ha una foto da cancellare
        const entry = await prisma.entry.findUnique({
            where: { id: Number(id) },
        });

        if (!entry) {
            return NextResponse.json({ error: 'Entry non trovata' }, { status: 404 });
        }

        // Se c'è una foto e non è un placeholder esterno, proviamo a cancellarla
        if (entry.photoUrl && entry.photoUrl.startsWith('/uploads/')) {
            try {
                const filePath = path.join(process.cwd(), 'public', entry.photoUrl);
                await fs.unlink(filePath);
            } catch (err) {
                console.error('Errore cancellazione file immagine (potrebbe non esistere):', err);
            }
        }

        // Cancelliamo dal DB
        await prisma.entry.delete({
            where: { id: Number(id) },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 });
    }
}
