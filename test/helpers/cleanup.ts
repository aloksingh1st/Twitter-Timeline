import { PrismaService } from '../../src/prisma/prisma.service';

export async function cleanupDatabase(prisma: PrismaService) {
    await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      follows,
      posts,
      users
    RESTART IDENTITY CASCADE;
  `);
}