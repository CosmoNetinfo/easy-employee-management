import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { code },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Code already exists' }, { status: 400 });
        }

        const user = await prisma.user.create({
            data: {
                name,
                code,
            },
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
