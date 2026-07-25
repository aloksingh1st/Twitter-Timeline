import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
// import { Consumer, EachMessagePayload } from 'kafkajs';
import * as kafkajs from 'kafkajs';
import { TimelineService } from 'src/timeline/timeline.service';
import { PostCreatedEvent } from '../post-created.event';
import { MetricsService } from 'src/metrics/metrics.service';

@Injectable()
export class TimelineConsumer
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(TimelineConsumer.name);

    constructor(
        @Inject('KAFKA_CONSUMER')
        private readonly consumer: kafkajs.Consumer,
        private metrics: MetricsService,

        private readonly timelineService: TimelineService,
    ) { }

    async onModuleInit() {
        await this.consumer.subscribe({
            topic: 'post-created',
            fromBeginning: false,
        });

        this.logger.log('Subscribed to post-created');

        await this.consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message,
            }: kafkajs.EachMessagePayload) => {
                try {
                    if (!message.value) {
                        return;
                    }

                    this.metrics.kafkaEventsConsumed.inc({
                        topic,
                    });

                    const event = JSON.parse(
                        message.value.toString(),
                    ) as PostCreatedEvent;

                    this.logger.log(
                        `Received event from ${topic} (partition ${partition})`,
                    );

                    this.logger.debug(event);

                    // Phase 9
                    await this.timelineService.fanOutPost(event);

                } catch (error) {

                    this.metrics.kafkaConsumerFailures.inc({
                        topic,
                    });

                    this.logger.error(
                        'Failed to process Kafka event',
                        error instanceof Error ? error.stack : undefined,
                    );
                }
            },
        });

        this.logger.log('Timeline consumer started');
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
        this.logger.log('Timeline consumer disconnected');
    }
}