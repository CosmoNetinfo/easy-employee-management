import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create a worker
    const worker = await prisma.user.upsert({
        where: { code: 'mario' },
        update: {},
        create: {
            name: 'Mario Rossi',
            code: 'mario',
            role: 'USER',
        },
    });

    // Create entries for today
    const today = new Date();
    const start = new Date(today);
    start.setHours(8, 0, 0, 0); // 08:00

    const end = new Date(today);
    end.setHours(15, 0, 0, 0); // 15:00 (7 hours later)

    // IN entry
    await prisma.entry.create({
        data: {
            userId: worker.id,
            type: 'IN',
            timestamp: start,
            photoUrl: 'https://via.placeholder.com/150', // Dummy photo
        },
    });

    // OUT entry
    await prisma.entry.create({
        data: {
            userId: worker.id,
            type: 'OUT',
            timestamp: end,
            photoUrl: 'https://via.placeholder.com/150',
        },
    });

    console.log(`Created worker ${worker.name} with 7 hours of work.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
