import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { MetricsModule } from 'src/metrics/metrics.module';

@Global()
@Module({

    imports: [MetricsModule],

    providers: [
        {
            provide: 'KAFKA_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const kafka = new Kafka({
                    clientId: configService.get<string>(
                        'KAFKA_CLIENT_ID',
                        'twitter-timeline',
                    ),
                    brokers: [
                        configService.get<string>(
                            'KAFKA_BROKER',
                            'localhost:9092',
                        )!,
                    ],
                });

                return kafka;
            },
            inject: [ConfigService],
        },

        {
            provide: 'KAFKA_PRODUCER',
            useFactory: async (kafka: Kafka) => {
                const producer = kafka.producer();

                await producer.connect();

                console.log('✅ Kafka Producer Connected');

                return producer;
            },
            inject: ['KAFKA_CLIENT'],
        },

        {
            provide: 'KAFKA_CONSUMER',
            useFactory: async (kafka: Kafka) => {
                const consumer = kafka.consumer({
                    groupId: 'timeline-group',
                });

                await consumer.connect();

                console.log('✅ Kafka Consumer Connected');

                return consumer;
            },
            inject: ['KAFKA_CLIENT'],
        },
        KafkaService
    ],

    exports: [
        'KAFKA_CLIENT',
        'KAFKA_PRODUCER',
        'KAFKA_CONSUMER',
        KafkaService
    ],
})
export class KafkaModule { }