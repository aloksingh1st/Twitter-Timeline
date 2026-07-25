import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { MetricsModule } from 'src/metrics/metrics.module';
import { RedisModule } from 'src/redis/redis.module';
import { TimelineConsumer } from 'src/kafka/consumer/timeline.consumer';

@Module({
  imports: [
    MetricsModule,
    RedisModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService,
    TimelineService,
    TimelineConsumer
  ],
})
export class TimelineModule { }
