import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

import { SeedConfig } from "./config";
import { UserBehavior } from "./profiles";
import { SeedUser } from "./types";
import { randomDate, randomInt } from "./utils";

export async function seedPosts(
    prisma: PrismaClient,
    users: SeedUser[],
) {
    console.log("Seeding posts...");

    const posts: {
        authorId: string;
        content: string;
        createdAt: Date;
    }[] = [];

    let totalPosts = 0;

    for (const user of users) {
        const behavior = UserBehavior[user.role];

        const postCount = randomInt(
            behavior.POSTS.MIN,
            behavior.POSTS.MAX,
        );

        for (let i = 0; i < postCount; i++) {
            posts.push({
                authorId: user.id,
                content: faker.lorem.sentence(),
                createdAt: randomDate(
                    SeedConfig.RANDOM.POST_HISTORY_DAYS,
                ),
            });

            totalPosts++;

            if (posts.length >= SeedConfig.BATCH.SIZE) {
                await prisma.post.createMany({
                    data: posts,
                });

                posts.length = 0;
            }
        }
    }

    if (posts.length > 0) {
        await prisma.post.createMany({
            data: posts,
        });
    }

    console.log(`✓ Created ${totalPosts} posts`);
}