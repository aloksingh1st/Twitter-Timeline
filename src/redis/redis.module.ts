import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: (configService: ConfigService) => {
                const client = new Redis({
                    host: configService.get<string>('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    password: configService.get<string>('REDIS_PASSWORD'),
                });

                client.on('connect', () => {
                    console.log('✅ Redis connected');
                });

                client.on('ready', () => {
                    console.log('🚀 Redis ready');
                });

                client.on('error', (err) => {
                    console.error('❌ Redis error:', err);
                });

                client.on('close', () => {
                    console.log('🔴 Redis connection closed');
                });

                return client;
            },
            inject: [ConfigService],
        },
    ],
    exports: ['REDIS_CLIENT'],
})
export class RedisModule { }