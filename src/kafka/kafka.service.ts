// src/kafka/kafka.service.ts

import { Inject, Injectable, Logger } from '@nestjs/common';
import * as KafkaJS from 'kafkajs';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class KafkaService {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject('KAFKA_PRODUCER')
    private readonly producer: KafkaJS.Producer,

    private readonly metrics: MetricsService,
  ) { }

  /**
   * Publish an event to Kafka.
   */
  async publish<T>(topic: string, payload: T): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(payload),
          },
        ],
      });

      this.logger.log(`Published event to "${topic}"`);

      this.metrics.kafkaEventsPublished.inc({
        topic,
      });

      // Uncomment once Kafka metrics are added
      // this.metrics.kafkaEventsPublished.inc({ topic });

    } catch (error) {
      this.logger.error(
        `Failed to publish event to "${topic}"`,
        error instanceof Error ? error.stack : undefined,
      );


      this.metrics.kafkaPublishFailures.inc({
        topic,
      });
      // notes for Kafka failure metrics are added
      // this.metrics.kafkaPublishFailures.inc({ topic });

      throw error;
    }
  }

  /**
   * Publish multiple events in one request.
   */
  async publishBatch<T>(topic: string, payloads: T[]): Promise<void> {
    if (payloads.length === 0) return;

    try {
      await this.producer.send({
        topic,
        messages: payloads.map((payload) => ({
          value: JSON.stringify(payload),
        })),
      });

      this.logger.log(
        `Published ${payloads.length} events to "${topic}"`,
      );

    } catch (error) {
      this.logger.error(
        `Failed to publish batch to "${topic}"`,
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }

  /**
   * Gracefully disconnect producer.
   */
  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.logger.log('Kafka Producer disconnected');
  }
}