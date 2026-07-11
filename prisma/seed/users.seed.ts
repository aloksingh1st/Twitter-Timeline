import { PrismaClient } from "@prisma/client";
import { SeedConfig } from "./config";

const prisma = new PrismaClient();

export async function seedUsers() {
  console.log(`Creating ${SeedConfig.USERS} users...`);

  const users = Array.from({
    length: SeedConfig.USERS,
  }).map((_, i) => ({
    username: `user_${i + 1}`,
  }));

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log("Users created.");
}