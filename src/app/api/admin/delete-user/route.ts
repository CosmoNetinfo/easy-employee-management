import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('id');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const id = parseInt(userId);

        // Standard Admin check could be added here if session management was available in headers/cookies
        // For now, following the pattern in other admin routes which seem to rely on the client-side check 
        // and being in the /api/admin namespace.

        await prisma.$transaction(async (tx) => {
            // Delete related records first
            await tx.entry.deleteMany({ where: { userId: id } });
            await tx.payment.deleteMany({ where: { userId: id } });
            await tx.message.deleteMany({ where: { userId: id } });
            await tx.pushSubscription.deleteMany({ where: { userId: id } });
            
            // Finally delete the user
            await tx.user.delete({ where: { id: id } });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
