import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { chunk, randomDate, randomInt } from './utils';
import { SeedConfig } from './config';


const prisma = new PrismaClient();

export async function seedPosts() {
    console.log("Creating posts...");

    const users = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    const posts: {
        authorId: string;
        content: string;
        createdAt: Date;
    }[] = [];

    for (const user of users) {
        // const totalPosts = randomInt(50, 150);
        const totalPosts = randomInt(
            SeedConfig.POSTS.MIN_PER_USER,
            SeedConfig.POSTS.MAX_PER_USER,
        );

        for (let i = 0; i < totalPosts; i++) {
            posts.push({
                authorId: user.id,
                content: faker.lorem.sentence(),
                createdAt: randomDate(
                    SeedConfig.RANDOM.POST_HISTORY_DAYS,
                ),
            });
        }
    }

    console.log(`Generated ${posts.length} posts`);

    for (const batch of chunk(posts, SeedConfig.BATCH.SIZE)) {
        await prisma.post.createMany({
            data: batch,
        });
    }

    console.log("Posts created.");
}