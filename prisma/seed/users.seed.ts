import { PrismaClient } from "@prisma/client";
import { SeedUser, UserRole } from "./types";
import { ActiveProfile } from "./config";

export async function seedUsers(
  prisma: PrismaClient,
): Promise<SeedUser[]> {
  console.log("\nSeeding Users...");

  const celebrityUsers = Array.from(
    { length: ActiveProfile.CELEBRITIES },
    (_, i) => ({
      username: `celeb_${i + 1}`,
      role: UserRole.CELEBRITY,
    }),
  );

  const powerUsers = Array.from(
    { length: ActiveProfile.POWER },
    (_, i) => ({
      username: `power_${i + 1}`,
      role: UserRole.POWER,
    }),
  );

  const normalUsers = Array.from(
    {
      length:
        ActiveProfile.USERS -
        ActiveProfile.CELEBRITIES -
        ActiveProfile.POWER,
    },
    (_, i) => ({
      username: `user_${i + 1}`,
      role: UserRole.NORMAL,
    }),
  );

  const usersToCreate = [
    ...celebrityUsers,
    ...powerUsers,
    ...normalUsers,
  ];

  const insertedUsers = await prisma.user.createManyAndReturn({
    data: usersToCreate.map((user) => ({
      username: user.username,
    })),
    skipDuplicates: true,
  });

  console.log(
    `✓ Created ${insertedUsers.length} users ` +
    `(${celebrityUsers.length} celebrities, ` +
    `${powerUsers.length} power users, ` +
    `${normalUsers.length} normal users)`,
  );

  return insertedUsers.map((user, index) => ({
    id: user.id,
    username: user.username,
    role: usersToCreate[index].role,
  }));
}