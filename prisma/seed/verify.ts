import { PrismaClient } from "@prisma/client";

export async function verifySeed(prisma: PrismaClient) {
    console.log("\nVerifying seed...\n");

    const [
        users,
        posts,
        follows,
        maxFollowers,
        maxPosts,
    ] = await Promise.all([
        prisma.user.count(),
        prisma.post.count(),
        prisma.follow.count(),

        prisma.user.findFirst({
            orderBy: {
                followerCount: "desc",
            },
            select: {
                username: true,
                followerCount: true,
            },
        }),

        prisma.user.findFirst({
            orderBy: {
                posts: {
                    _count: "desc",
                },
            },
            select: {
                username: true,
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        }),
    ]);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Users       : ${users}`);
    console.log(`Posts       : ${posts}`);
    console.log(`Follows     : ${follows}`);

    console.log(
        `Avg Posts   : ${(posts / users).toFixed(2)}`,
    );

    console.log(
        `Avg Follows : ${(follows / users).toFixed(2)}`,
    );

    console.log("");

    console.log(
        `Top User By Followers : ${maxFollowers?.username} (${maxFollowers?.followerCount})`,
    );

    console.log(
        `Top User By Posts     : ${maxPosts?.username} (${maxPosts?._count.posts})`,
    );

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}