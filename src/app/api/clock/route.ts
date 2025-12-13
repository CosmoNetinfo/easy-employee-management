import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const userId = formData.get('userId');
        const type = formData.get('type') as string;
        const image = formData.get('image') as File | null;

        if (!userId || !['IN', 'OUT'].includes(type || '')) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        let photoUrl = null;

        if (image) {
            try {
                // Convert to Base64 to store directly in DB (Vercel has ephemeral file system)
                const buffer = Buffer.from(await image.arrayBuffer());
                const base64Image = buffer.toString('base64');
                photoUrl = `data:${image.type};base64,${base64Image}`;
            } catch (e) {
                console.error('Error processing image:', e);
            }
        }

        const entry = await prisma.entry.create({
            data: {
                userId: Number(userId),
                type,
                photoUrl,
            },
        });

        return NextResponse.json(entry);
    } catch (error) {
        console.error('Clock error:', error);
        return NextResponse.json({ error: 'Clock operation failed' }, { status: 500 });
    }
}
