import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Fetch payments for a user
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId richiesto' }, { status: 400 });
        }

        const payments = await prisma.payment.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { paymentDate: 'desc' }
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Errore nel recupero dei pagamenti' }, { status: 500 });
    }
}

// POST: Create a new payment (Admin only)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, amount, periodStart, periodEnd, notes, paymentDate } = body;

        if (!userId || !amount || !periodStart || !periodEnd) {
            return NextResponse.json({ 
                error: 'userId, amount, periodStart e periodEnd sono richiesti' 
            }, { status: 400 });
        }

        const payment = await prisma.payment.create({
            data: {
                userId: parseInt(userId),
                amount: parseFloat(amount),
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                notes: notes || null
            }
        });

        return NextResponse.json({ payment }, { status: 201 });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json({ error: 'Errore nella creazione del pagamento' }, { status: 500 });
    }
}

// DELETE: Remove a payment (Admin only)
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const paymentId = searchParams.get('paymentId');

        if (!paymentId) {
            return NextResponse.json({ error: 'paymentId richiesto' }, { status: 400 });
        }

        await prisma.payment.delete({
            where: { id: parseInt(paymentId) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment:', error);
        return NextResponse.json({ error: 'Errore nella cancellazione del pagamento' }, { status: 500 });
    }
}
