import { PrismaClient } from "@prisma/client";

import { seedUsers } from "./seed/users.seed";
import { seedFollows } from "./seed/follow.seed";
import { seedPosts } from "./seed/posts.seed";
import { verifySeed } from "./seed/verify";

const prisma = new PrismaClient();

async function main() {
    console.time("Seed");

    console.log("Cleaning database...");

    await prisma.follow.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    const users = await seedUsers(prisma);

    await seedFollows(prisma, users);

    await seedPosts(prisma, users);

    await verifySeed(prisma);

    console.timeEnd("Seed");
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });