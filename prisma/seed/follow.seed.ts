import { PrismaClient } from "@prisma/client";

import { SeedConfig } from "./config";
import { UserBehavior } from "./profiles";
import { SeedUser } from "./types";
import { chunk, randomInt } from "./utils";

export async function seedFollows(
  prisma: PrismaClient,
  users: SeedUser[],
) {
  console.log("Seeding follows...");

  const follows: {
    followerId: string;
    followeeId: string;
  }[] = [];

  const followerCounts = new Map<string, number>();

  for (const user of users) {
    const behavior = UserBehavior[user.role];

    const followCount = randomInt(
      behavior.FOLLOWS.MIN,
      behavior.FOLLOWS.MAX,
    );

    const selected = new Set<string>();

    while (
      selected.size < followCount &&
      selected.size < users.length - 1
    ) {
      const followee = users[randomInt(0, users.length - 1)];

      if (followee.id === user.id) continue;

      selected.add(followee.id);
    }

    for (const followeeId of selected) {
      follows.push({
        followerId: user.id,
        followeeId,
      });

      followerCounts.set(
        followeeId,
        (followerCounts.get(followeeId) ?? 0) + 1,
      );
    }
  }

  console.log(`Generated ${follows.length} follows`);

  for (const batch of chunk(follows, SeedConfig.BATCH.SIZE)) {
    await prisma.follow.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log("Updating follower counts...");

  const updates = Array.from(followerCounts.entries()).map(
    ([userId, count]) =>
      prisma.user.update({
        where: { id: userId },
        data: {
          followerCount: count,
        },
      }),
  );

  for (const batch of chunk(updates, 500)) {
    await prisma.$transaction(batch);
  }

  console.log("✓ Follow graph created");
}