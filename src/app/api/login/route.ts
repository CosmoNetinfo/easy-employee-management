import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { code },
        });

        if (!user) {
            return NextResponse.json({ error: 'Invalid code' }, { status: 401 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
