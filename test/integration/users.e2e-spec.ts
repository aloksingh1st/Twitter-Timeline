import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../helpers/app';
import { cleanupDatabase } from '../helpers/cleanup';

describe('UserController (e2e)', () => {
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

  describe('POST /users', () => {
    it('should create a new user', async () => {
      const payload = {
        username: 'alice',
      };

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          username: 'alice',
        }),
      );

      const user = await prisma.user.findUnique({
        where: {
          id: response.body.id,
        },
      });

      expect(user).not.toBeNull();
      expect(user?.username).toBe('alice');
    });

    it('should reject duplicate usernames', async () => {
      const payload = {
        username: 'alice',
      };

      await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/users')
        .send(payload)
        .expect(409);

      expect(response.body.message).toBe('Username already exists');
    });

    it('should reject an invalid username', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'ab',
        })
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should reject usernames containing invalid characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'alice@123',
        })
        .expect(400);

      expect(response.body.message).toContain(
        'Username can only contain letters, numbers, and underscores',
      );
    });

    it('should reject requests without username', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .send({})
        .expect(400);
    });
  });
});