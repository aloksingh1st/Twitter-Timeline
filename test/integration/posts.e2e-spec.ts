import { INestApplication } from "@nestjs/common";
import request from "supertest";

import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../helpers/app";
import { cleanupDatabase } from "../helpers/cleanup";

describe("PostController (e2e)", () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        const context = await createTestApp();
        app = context.app;
        prisma = context.prisma;
    });
    beforeEach(async () => {


        console.log("Cleaning...");
        await cleanupDatabase(prisma);

        console.log(await prisma.user.count());
    });

    afterAll(async () => {
        await app.close();
    });

    describe("POST /posts", () => {
        it("should create a new post", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "Hello, world!",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    content: "Hello, world!",
                    authorId: user.id,
                }),
            );

            const post = await prisma.post.findUnique({
                where: {
                    id: response.body.id,
                },
            });

            expect(post).not.toBeNull();
            expect(post?.content).toBe("Hello, world!");
            expect(post?.authorId).toBe(user.id);
        });

        it("should reject posts with empty content", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.any(Array),
                    error: "Bad Request",
                }),
            );
        });

        it("should reject posts with non-existent authorId", async () => {
            const payload = {
                content: "Hello, world!",
                authorId: "non-existent-id",
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(404);

            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 404,
                    message: "Author not found",
                    error: "Not Found",
                }),
            );
        });

        it("should reject posts with content exceeding 280 characters", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "a".repeat(281),
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.any(Array),
                    error: "Bad Request",
                }),
            );
        });

        it("should reject posts with content containing only whitespace", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "   ",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.any(Array),
                    error: "Bad Request",
                }),
            );
        });

        it("should reject posts with content containing only newlines", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "\n\n\n",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(400);

            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.any(Array),
                    error: "Bad Request",
                }),
            );
        });

        it("should reject posts with content containing only tabs", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "\t\t\t",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(400);
            expect(response.body).toEqual(
                expect.objectContaining({
                    statusCode: 400,
                    message: expect.any(Array),
                    error: "Bad Request",
                }),
            );
        });

        it("should persist the correct authorId", async () => {
            const user = await prisma.user.create({
                data: {
                    username: "alice",
                },
            });

            const payload = {
                content: "Hello, world!",
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post("/post")
                .send(payload)
                .expect(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    content: "Hello, world!",
                    authorId: user.id,
                }),
            );

            const post = await prisma.post.findUnique({
                where: {
                    id: response.body.id,
                },
            });

            expect(post).not.toBeNull();
            expect(post?.authorId).toBe(user.id);
        });

        it(' should set createdAt', async () => {
            const user = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const payload = {
                content: 'Hello, world!',
                authorId: user.id,
            };

            const response = await request(app.getHttpServer())
                .post('/post')
                .send(payload)
                .expect(201);

            expect(response.body).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    content: 'Hello, world!',
                    authorId: user.id,
                    createdAt: expect.any(String),
                }),
            );

            const post = await prisma.post.findUnique({
                where: {
                    id: response.body.id,
                },
            });

            expect(post).not.toBeNull();
            expect(post?.createdAt).toBeInstanceOf(Date);
        });

        it('should create multiple posts for the same author', async () => {
            const user = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const payload1 = {
                content: 'First post',
                authorId: user.id,
            };

            const payload2 = {
                content: 'Second post',
                authorId: user.id,
            };

            const response1 = await request(app.getHttpServer())
                .post('/post')
                .send(payload1)
                .expect(201);

            const response2 = await request(app.getHttpServer())
                .post('/post')
                .send(payload2)
                .expect(201);

            expect(response1.body).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    content: 'First post',
                    authorId: user.id,
                }),
            );

            expect(response2.body).toEqual(
                expect.objectContaining({
                    id: expect.any(String),
                    content: 'Second post',
                    authorId: user.id,
                }),
            );
        });
    });
});
