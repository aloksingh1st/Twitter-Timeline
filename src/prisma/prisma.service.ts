import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

const prismaOptions = {
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
  ],
} as const satisfies Prisma.PrismaClientOptions;

@Injectable()
export class PrismaService extends PrismaClient<typeof prismaOptions> implements OnModuleInit {
    constructor() {
        super(prismaOptions);
        this.$on('query', (e) => {
            console.log('------------------------------');
            console.log(`Query    : ${e.query}`);
            console.log(`Params   : ${e.params}`);
            console.log(`Duration : ${e.duration} ms`);
            console.log('------------------------------');
        });
    }
    async onModuleInit() {
        await this.$connect();
    }
    async enableShutdownHooks(app: INestApplication) {
        process.on('beforeExit', async () => {
            await app.close();
        });
    }
}