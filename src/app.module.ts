import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { FollowModule } from './follow/follow.module';
import { PostModule } from './post/post.module';
import { TimelineModule } from './timeline/timeline.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    FollowModule,
    PostModule,
    TimelineModule,
    HealthModule,
  ],
})
export class AppModule { }