import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const periodStart = searchParams.get('periodStart');
        const periodEnd = searchParams.get('periodEnd');

        if (!userId || !periodStart || !periodEnd) {
            return NextResponse.json({ error: 'Mancano parametri' }, { status: 400 });
        }

        const start = new Date(periodStart);
        const end = new Date(periodEnd);
        end.setHours(23, 59, 59, 999);

        // Fetch user for hourly wage
        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            select: { hourlyWage: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
        }

        // Fetch entries for the user in the period
        const entries = await prisma.entry.findMany({
            where: {
                userId: parseInt(userId),
                timestamp: {
                    gte: start,
                    lte: end,
                },
            },
            orderBy: {
                timestamp: 'asc',
            },
        });

        let totalMillis = 0;
        let lastInLocal: Date | null = null;

        for (const entry of entries) {
            if (entry.type === 'IN') {
                lastInLocal = entry.timestamp;
            } else if (entry.type === 'OUT' && lastInLocal) {
                // Calculate difference
                const diff = entry.timestamp.getTime() - lastInLocal.getTime();
                if (diff > 0) {
                    totalMillis += diff;
                }
                lastInLocal = null; // Reset
            }
        }

        const totalHours = totalMillis / (1000 * 60 * 60);
        const amount = totalHours * (user.hourlyWage || 0);

        return NextResponse.json({
            totalHours: Number(totalHours.toFixed(2)),
            hourlyWage: user.hourlyWage,
            amount: Number(amount.toFixed(2))
        });
    } catch (error) {
        console.error('Error calculating payment:', error);
        return NextResponse.json({ error: 'Errore nel calcolo del pagamento' }, { status: 500 });
    }
}
