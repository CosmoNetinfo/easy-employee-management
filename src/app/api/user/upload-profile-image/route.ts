import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { userId, image } = await request.json();

        if (!userId || !image) {
            return NextResponse.json({ error: 'Missing userId or image' }, { status: 400 });
        }

        // Update user profile image
        const updatedUser = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { profileImage: image },
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
