import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { FollowModule } from './follow/follow.module';
import { PostModule } from './post/post.module';
import { TimelineModule } from './timeline/timeline.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { RedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    KafkaModule,
    PrismaModule,
    RedisModule,
    UserModule,
    FollowModule,
    PostModule,
    TimelineModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule { }