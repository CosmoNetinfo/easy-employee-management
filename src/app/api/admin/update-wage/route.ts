import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, hourlyWage } = await request.json();

        if (!userId || hourlyWage === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const wage = parseFloat(hourlyWage);
        if (isNaN(wage)) {
            return NextResponse.json({ error: 'Invalid wage' }, { status: 400 });
        }

        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { hourlyWage: wage },
        });

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error('Error updating wage:', error);
        return NextResponse.json({ error: 'Failed to update wage' }, { status: 500 });
    }
}
