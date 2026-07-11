import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap/configure-app';
import { PrismaService } from '../../src/prisma/prisma.service';

export interface TestContext {
    app: INestApplication;
    prisma: PrismaService;
}

export async function createTestApp(): Promise<TestContext> {
    const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();

    configureApp(app);

    await app.init();

    const prisma = app.get(PrismaService);

    return {
        app,
        prisma,
    };
}