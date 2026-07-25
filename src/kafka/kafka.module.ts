import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka } from 'kafkajs';
import { KafkaService } from './kafka.service';
import { MetricsModule } from 'src/metrics/metrics.module';
import { TimelineModule } from 'src/timeline/timeline.module';

@Global()
@Module({

    imports: [MetricsModule, TimelineModule],

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


        {
            provide: 'KAFKA_TOPICS_INITIALIZER',
            useFactory: async (configService: ConfigService) => {
                const kafka = new Kafka({
                    clientId: 'twitter-timeline-admin',
                    brokers: [configService.get<string>('KAFKA_BROKER', 'localhost:9092')!],
                });

                const admin = kafka.admin();
                try {
                    await admin.connect();

                    // Define all the topics your app needs here
                    const requiredTopics = ['post-created'];

                    // Fetch existing topics from the broker
                    const existingTopics = await admin.listTopics();

                    // Filter out topics that do not exist yet
                    const topicsToCreate = requiredTopics
                        .filter((topic) => !existingTopics.includes(topic))
                        .map((topic) => ({
                            topic,
                            numPartitions: 1,      // Adjust based on your scaling requirements
                            replicationFactor: 1,  // 1 is required for a single local broker node
                        }));

                    if (topicsToCreate.length > 0) {
                        await admin.createTopics({
                            validateOnly: false,
                            waitForLeaders: true,
                            topics: topicsToCreate,
                        });
                        console.log(`✅ Programmatically created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
                    } else {
                        console.log('✅ All required Kafka topics already exist.');
                    }
                } catch (error) {
                    console.error('❌ Failed to verify/create Kafka topics:', error);
                } finally {
                    // Always disconnect the admin client to free up connections
                    await admin.disconnect();
                }
            },
            inject: [ConfigService],
        },
        KafkaService,
    ],

    exports: [
        'KAFKA_CLIENT',
        'KAFKA_PRODUCER',
        'KAFKA_CONSUMER',
        KafkaService
    ],
})
export class KafkaModule { }