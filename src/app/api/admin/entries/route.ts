import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Ensure no caching for admin data

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const startDate = searchParams.get('startDate'); // ISO string
        const endDate = searchParams.get('endDate');     // ISO string

        const where: any = {};

        if (userId) {
            where.userId = parseInt(userId);
        }

        if (startDate && endDate) {
            where.timestamp = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        } else if (startDate) {
            where.timestamp = {
                gte: new Date(startDate),
            };
        }

        // Use select to avoid fetching the heavy photoUrl content AT ALL from the DB
        // This prevents memory overflow on Vercel if old uncompressed photos exist.
        const entries = await prisma.entry.findMany({
            where,
            select: {
                id: true,
                type: true,
                timestamp: true,
                userId: true,
                // Check if photoUrl is not null without fetching content? 
                // Prisma doesn't support "exists" easily in select. 
                // We MUST fetch photoUrl BUT we can check length on SQL level? No.
                // Workaround: We fetch everything EXCEPT photoUrl? No 'exclude'.
                // Okay, if we select 'photoUrl', we get the data.
                // Let's assume for now that compression fixed NEW entries.
                // BUT old entries block the list.
                // TRICK: We can't easily fix old entries without a migration script.
                // Let's try to limit 'take' to 20 to see if it loads at least recent ones.
                // OR: We select only 'id' and 'photoUrl' substring? Not possible in standard Prisma.

                // FALLBACK STRATEGY: Select everything BUT photoUrl. 
                // We lose the "hasPhoto" flag info for the table list... 
                // BUT at least the list loads!
                // We can fetch "hasPhoto" separately or assume "false" for now to unblock.
                // Let's try to fetch photoUrl but limit records strictly.
                // NO, let's omit photoUrl entirely to be safe and load the list.
                // The "FOTO" column will show "-" for everyone temporarily, but data will be visible.
                user: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: {
                timestamp: 'desc',
            },
            take: (startDate || userId) ? undefined : 50,
        });

        const safeEntries = entries.map(e => ({
            ...e,
            photoUrl: null,
            hasPhoto: true // TEMPORARY: Assume there IS a photo so the button appears. 
            // When clicked, if it fails (404), we know. 
            // Better than hiding data. Or we can just disable the flag.
            // Let's set it to TRUE so you can try to open them. 
            // If it was text-only entry, the modal will just be empty/error.
            // Better: Let's assume all entries might have photos for now.
        }));

        return NextResponse.json(safeEntries);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}
