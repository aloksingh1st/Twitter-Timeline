import { PrismaClient } from '@prisma/client';
import { randomInt, chunk } from './utils';
import { SeedConfig } from "./config";

const prisma = new PrismaClient();

export async function seedFollows() {
    console.log("Creating follow graph...");

    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    const follows: {
        followerId: string;
        followeeId: string;
    }[] = [];

    for (const user of users) {
        const count = randomInt(
            SeedConfig.FOLLOWS.MIN_PER_USER,
            SeedConfig.FOLLOWS.MAX_PER_USER,
        );

        const selected = new Set<string>();

        while (selected.size < count) {
            const followee = users[randomInt(0, users.length - 1)];

            if (followee.id === user.id) continue;

            selected.add(followee.id);
        }

        for (const followeeId of selected) {
            follows.push({
                followerId: user.id,
                followeeId,
            });
        }
    }

    for (const batch of chunk(follows, SeedConfig.BATCH.SIZE)) {
        await prisma.follow.createMany({
            data: batch,
            skipDuplicates: true,
        });
    }

    console.log(`Created ${follows.length} follows`);
}