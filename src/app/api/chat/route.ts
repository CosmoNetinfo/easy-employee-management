import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch recent messages
export async function GET() {
    try {
        const messages = await prisma.message.findMany({
            take: 50,
            orderBy: { createdAt: 'asc' },
            include: {
                user: {
                    select: { name: true, profileImage: true, role: true }
                }
            }
        });
        return NextResponse.json(messages);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}

// POST: Send a message
export async function POST(request: Request) {
    try {
        const { userId, content } = await request.json();

        if (!userId || !content) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const message = await prisma.message.create({
            data: {
                userId: parseInt(userId),
                content: content,
            },
            include: {
                user: {
                    select: { name: true, profileImage: true }
                }
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }
}
