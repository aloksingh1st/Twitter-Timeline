// test/helpers/cleanup.ts

import { PrismaService } from '../../src/prisma/prisma.service';

export async function cleanupDatabase(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Follow",
      "Post",
      "User"
    RESTART IDENTITY CASCADE;
  `);
}