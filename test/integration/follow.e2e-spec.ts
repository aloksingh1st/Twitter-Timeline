import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app';
import { cleanupDatabase } from '../helpers/cleanup';

describe('FollowController (e2e)', () => {
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

    describe('POST /users/:id/follow/:targetId', () => {
        it('should allow a user to follow another user', async () => {
            const follower = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const followee = await prisma.user.create({
                data: {
                    username: 'bob',
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/users/${follower.id}/follow/${followee.id}`)
                .expect(201);

            expect(response.body).toEqual({
                message: 'Followed successfully',
            });

            const follow = await prisma.follow.findUnique({
                where: {
                    followerId_followeeId: {
                        followerId: follower.id,
                        followeeId: followee.id,
                    },
                },
            });

            expect(follow).not.toBeNull();

            const updatedFollowee = await prisma.user.findUnique({
                where: {
                    id: followee.id,
                },
            });

            expect(updatedFollowee?.followerCount).toBe(1);
        });

        it('should reject following yourself', async () => {
            const user = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const response = await request(app.getHttpServer())
                .post(`/users/${user.id}/follow/${user.id}`)
                .expect(400);

            expect(response.body.message).toBe(
                'Users cannot follow themselves',
            );

            const follows = await prisma.follow.findMany();

            expect(follows).toHaveLength(0);

            const updatedUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });

            expect(updatedUser?.followerCount).toBe(0);
        });

        it('should reject duplicate follows', async () => {
            const follower = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const followee = await prisma.user.create({
                data: {
                    username: 'bob',
                },
            });

            await request(app.getHttpServer())
                .post(`/users/${follower.id}/follow/${followee.id}`)
                .expect(201);

            const response = await request(app.getHttpServer())
                .post(`/users/${follower.id}/follow/${followee.id}`)
                .expect(409);

            expect(response.body.message).toBe(
                'Already following this user',
            );

            const follows = await prisma.follow.findMany();

            expect(follows).toHaveLength(1);

            const updatedFollowee = await prisma.user.findUnique({
                where: {
                    id: followee.id,
                },
            });

            expect(updatedFollowee?.followerCount).toBe(1);
        });

        it('should return 404 when follower does not exist', async () => {
            const followee = await prisma.user.create({
                data: {
                    username: 'bob',
                },
            });

            const response = await request(app.getHttpServer())
                .post(
                    `/users/00000000-0000-0000-0000-000000000001/follow/${followee.id}`,
                )
                .expect(404);

            expect(response.body.message).toBe('Follower not found');

            const follows = await prisma.follow.findMany();

            expect(follows).toHaveLength(0);

            const updatedFollowee = await prisma.user.findUnique({
                where: {
                    id: followee.id,
                },
            });

            expect(updatedFollowee?.followerCount).toBe(0);
        });

        it('should return 404 when followee does not exist', async () => {
            const follower = await prisma.user.create({
                data: {
                    username: 'alice',
                },
            });

            const response = await request(app.getHttpServer())
                .post(
                    `/users/${follower.id}/follow/00000000-0000-0000-0000-000000000001`,
                )
                .expect(404);

            expect(response.body.message).toBe('Followee not found');

            const follows = await prisma.follow.findMany();

            expect(follows).toHaveLength(0);

            const updatedFollower = await prisma.user.findUnique({
                where: {
                    id: follower.id,
                },
            });

            expect(updatedFollower?.followerCount).toBe(0);
        });
    });
});