import { PrismaClient } from '@prisma/client';
import { seedUsers } from './seed/users.seed';
import { seedFollows } from './seed/follow.seed';
import { seedPosts } from './seed/posts.seed';

const prisma = new PrismaClient();

async function main() {
    console.time('Seed');

    await prisma.follow.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    await seedUsers();
    await seedFollows();
    await seedPosts();

    console.timeEnd('Seed');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });