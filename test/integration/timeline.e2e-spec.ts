import { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../helpers/app";
import { cleanupDatabase } from "../helpers/cleanup";

describe("TimelineController (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const context = await createTestApp();

        app = context.app;
        prisma = context.prisma;
    });

    beforeEach(async () => {
        await cleanupDatabase(prisma);
    });

    afterAll(async () => {
        await app.close();
    });

    describe("GET /timeline/:userId", () => {

        it('should return an empty timeline for a user following nobody', async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${user.id}`)
                .expect(200);

            // Service returns { posts, nextCursor }
            expect(response.body.posts).toEqual([]);
            expect(response.body.nextCursor).toBeNull();
        });

        it('should return posts from followed users only', async () => {
            const user1 = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const user2 = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            const user3 = await prisma.user.create({
                data: {
                    username: "charlie",
                },
            });

            // alice follows bob only
            await prisma.follow.create({
                data: {
                    followerId: user1.id,
                    followeeId: user2.id,
                },
            });

            const post1 = await prisma.post.create({
                data: {
                    content: "Hello from Bob!",
                    authorId: user2.id,
                },
            });

            const post2 = await prisma.post.create({
                data: {
                    content: "Hello from Charlie!",
                    authorId: user3.id,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${user1.id}`)
                .expect(200);

            expect(response.body.posts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: post1.id,
                        content: "Hello from Bob!",
                        authorId: user2.id,
                    }),
                ])
            );

            expect(response.body.posts).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: post2.id,
                        content: "Hello from Charlie!",
                        authorId: user3.id,
                    }),
                ])
            );
        });

        it('should not return posts from unfollowed users', async () => {
            const user1 = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const user2 = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            const post = await prisma.post.create({
                data: {
                    content: "Hello from Bob!",
                    authorId: user2.id,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${user1.id}`)
                .expect(200);

            // alice does not follow bob, so bob's posts should not appear
            expect(response.body.posts).not.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: post.id,
                        content: "Hello from Bob!",
                        authorId: user2.id,
                    }),
                ])
            );
        });

        it('should order by createdAt DESC', async () => {
            const alice = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const bob = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            // alice must follow bob to see bob's posts in her timeline
            await prisma.follow.create({
                data: {
                    followerId: alice.id,
                    followeeId: bob.id,
                },
            });

            const post1 = await prisma.post.create({
                data: {
                    content: "First post",
                    authorId: bob.id,
                },
            });

            const post2 = await prisma.post.create({
                data: {
                    content: "Second post",
                    authorId: bob.id,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${alice.id}`)
                .expect(200);

            expect(response.body.posts).toEqual([
                expect.objectContaining({
                    id: post2.id,
                    content: "Second post",
                    authorId: bob.id,
                }),
                expect.objectContaining({
                    id: post1.id,
                    content: "First post",
                    authorId: bob.id,
                }),
            ]);
        });

        it('should break ties using id DESC', async () => {
            const alice = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const bob = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            // alice must follow bob to see bob's posts in her timeline
            await prisma.follow.create({
                data: {
                    followerId: alice.id,
                    followeeId: bob.id,
                },
            });

            const post1 = await prisma.post.create({
                data: {
                    content: "First post",
                    authorId: bob.id,
                    createdAt: new Date("2024-01-01T00:00:00Z"),
                },
            });

            const post2 = await prisma.post.create({
                data: {
                    content: "Second post",
                    authorId: bob.id,
                    createdAt: new Date("2024-01-01T00:00:00Z"),
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${alice.id}`)
                .expect(200);

            expect(response.body.posts).toEqual([
                expect.objectContaining({
                    id: post2.id,
                    content: "Second post",
                    authorId: bob.id,
                }),
                expect.objectContaining({
                    id: post1.id,
                    content: "First post",
                    authorId: bob.id,
                }),
            ]);
        });

        it('should respect limit', async () => {
            const alice = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const bob = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            await prisma.follow.create({
                data: {
                    followerId: alice.id,
                    followeeId: bob.id,
                },
            });

            for (let i = 0; i < 5; i++) {
                await prisma.post.create({
                    data: {
                        content: `Post ${i + 1}`,
                        authorId: bob.id,
                    },
                });
            }

            const response = await request(app.getHttpServer())
                .get(`/timeline/${alice.id}?limit=3`)
                .expect(200);

            expect(response.body.posts).toHaveLength(3);
        });

        it('should return the next page using cursor pagination', async () => {
            const alice = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const bob = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            await prisma.follow.create({
                data: {
                    followerId: alice.id,
                    followeeId: bob.id,
                },
            });

            const posts: any = [];
            for (let i = 0; i < 5; i++) {
                const post = await prisma.post.create({
                    data: {
                        content: `Post ${i + 1}`,
                        authorId: bob.id,
                    },
                });
                posts.push(post);
            }

            const firstPageResponse = await request(app.getHttpServer())
                .get(`/timeline/${alice.id}?limit=2`)
                .expect(200);

            expect(firstPageResponse.body.posts).toHaveLength(2);
            expect(firstPageResponse.body.nextCursor).not.toBeNull();

            // Use the nextCursor from the API response to fetch the second page
            const { cursorId, cursorCreatedAt } = firstPageResponse.body.nextCursor;

            const secondPageResponse = await request(app.getHttpServer())
                .get(
                    `/timeline/${alice.id}?limit=2&cursorId=${cursorId}&cursorCreatedAt=${encodeURIComponent(cursorCreatedAt)}`,
                )
                .expect(200);

            expect(secondPageResponse.body.posts).toHaveLength(2);

            // Ensure second page posts are different from first page posts
            const firstPageIds = firstPageResponse.body.posts.map((p: any) => p.id);
            const secondPageIds = secondPageResponse.body.posts.map((p: any) => p.id);
            expect(secondPageIds.some((id: string) => firstPageIds.includes(id))).toBe(false);
        });

        it('should not duplicate posts across pages', async () => {
            const alice = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const bob = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            await prisma.follow.create({
                data: {
                    followerId: alice.id,
                    followeeId: bob.id,
                },
            });

            for (let i = 0; i < 5; i++) {
                await prisma.post.create({
                    data: {
                        content: `Post ${i + 1}`,
                        authorId: bob.id,
                    },
                });
            }

            const firstPageResponse = await request(app.getHttpServer())
                .get(`/timeline/${alice.id}?limit=3`)
                .expect(200);

            expect(firstPageResponse.body.posts).toHaveLength(3);
            expect(firstPageResponse.body.nextCursor).not.toBeNull();

            const { cursorId, cursorCreatedAt } = firstPageResponse.body.nextCursor;

            const secondPageResponse = await request(app.getHttpServer())
                .get(
                    `/timeline/${alice.id}?limit=3&cursorId=${cursorId}&cursorCreatedAt=${encodeURIComponent(cursorCreatedAt)}`,
                )
                .expect(200);

            expect(secondPageResponse.body.posts).toHaveLength(2);

            // No post ID should appear on both pages
            const firstPageIds = firstPageResponse.body.posts.map((p: any) => p.id);
            const secondPageIds = secondPageResponse.body.posts.map((p: any) => p.id);
            const duplicates = firstPageIds.filter((id: string) => secondPageIds.includes(id));
            expect(duplicates).toHaveLength(0);
        });

        it('should return 404 when the user does not exist', async () => {
            const response = await request(app.getHttpServer())
                .get(`/timeline/nonexistent-user-id`)
                .expect(404);

            expect(response.body.message).toBe('User not found');
        });

        it("should return the timeline for a user", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const user2 = await prisma.user.create({
                data: {
                    username: "bob",
                },
            });

            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followeeId: user2.id,
                },
            });

            const post1 = await prisma.post.create({
                data: {
                    content: "Hello, world!",
                    authorId: user2.id,
                },
            });

            const post2 = await prisma.post.create({
                data: {
                    content: "Another post",
                    authorId: user2.id,
                },
            });

            const response = await request(app.getHttpServer())
                .get(`/timeline/${user.id}`)
                .expect(200);

            expect(response.body.posts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        id: post1.id,
                        content: "Hello, world!",
                        authorId: user2.id,  // posts are authored by user2 (bob)
                    }),
                    expect.objectContaining({
                        id: post2.id,
                        content: "Another post",
                        authorId: user2.id,  // posts are authored by user2 (bob)
                    }),
                ])
            );
        });
    });
});
