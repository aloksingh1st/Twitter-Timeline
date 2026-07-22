import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { MetricsModule } from 'src/metrics/metrics.module';

@Module({
  imports: [
    MetricsModule,
  ],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
