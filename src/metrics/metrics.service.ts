import { Injectable } from "@nestjs/common";
import {
    Counter,
    Gauge,
    Histogram,
    Registry,
    collectDefaultMetrics,
} from "prom-client";

@Injectable()
export class MetricsService {
    readonly registry = new Registry();

    readonly httpRequestsTotal: Counter<string>;
    readonly httpRequestDuration: Histogram<string>;
    readonly httpRequestsInFlight: Gauge<string>;

    readonly cacheHits: Counter<string>;
    readonly cacheMisses: Counter<string>;


    readonly kafkaEventsPublished: Counter<string>;
    readonly kafkaEventsConsumed: Counter<string>;

    readonly kafkaPublishFailures: Counter<string>;
    readonly kafkaConsumerFailures: Counter<string>;

    readonly timelineFanoutTotal: Counter<string>;

    readonly timelineFanoutFailures: Counter<string>;

    readonly timelineFanoutDuration: Histogram<string>;

    readonly timelineFollowersProcessed: Histogram<string>;

    constructor() {
        collectDefaultMetrics({
            register: this.registry,
        });

        this.httpRequestsTotal = new Counter({
            name: "http_requests_total",
            help: "Total HTTP requests",
            labelNames: ["method", "route", "status"],
            registers: [this.registry],
        });

        this.httpRequestDuration = new Histogram({
            name: "http_request_duration_seconds",
            help: "HTTP request duration",
            labelNames: ["method", "route", "status"],
            buckets: [
                0.005,
                0.01,
                0.025,
                0.05,
                0.1,
                0.25,
                0.5,
                1,
                2,
                5,
            ],
            registers: [this.registry],
        });

        this.httpRequestsInFlight = new Gauge({
            name: "http_requests_in_flight",
            help: "Current HTTP requests being processed",
            registers: [this.registry],
        });



        this.cacheHits = new Counter({
            name: "redis_cache_hits_total",
            help: "Total Redis cache hits",
            labelNames: ["cache"],
            registers: [this.registry],
        });

        this.cacheMisses = new Counter({
            name: "redis_cache_misses_total",
            help: "Total Redis cache misses",
            labelNames: ["cache"],
            registers: [this.registry],
        });




        // Kafla ,metrics 

        this.kafkaEventsPublished = new Counter({
            name: "kafka_events_published_total",
            help: "Total Kafka events published",
            labelNames: ["topic"],
            registers: [this.registry],
        });

        this.kafkaEventsConsumed = new Counter({
            name: "kafka_events_consumed_total",
            help: "Total Kafka events consumed",
            labelNames: ["topic"],
            registers: [this.registry],
        });

        this.kafkaPublishFailures = new Counter({
            name: "kafka_publish_failures_total",
            help: "Kafka publish failures",
            labelNames: ["topic"],
            registers: [this.registry],
        });

        this.kafkaConsumerFailures = new Counter({
            name: "kafka_consumer_failures_total",
            help: "Kafka consumer failures",
            labelNames: ["topic"],
            registers: [this.registry],
        });

        this.timelineFanoutTotal = new Counter({
            name: "timeline_fanout_total",
            help: "Timeline fan-out executions",
            registers: [this.registry],
        });


        this.timelineFanoutFailures = new Counter({
            name: "timeline_fanout_failures_total",
            help: "Timeline fan-out failures",
            registers: [this.registry],
        });

        this.timelineFanoutDuration = new Histogram({
            name: "timeline_fanout_duration_seconds",
            help: "Timeline fan-out duration",
            buckets: [
                0.001,
                0.005,
                0.01,
                0.05,
                0.1,
                0.25,
                0.5,
                1,
                2,
                5,
            ],
            registers: [this.registry],
        });

        this.timelineFollowersProcessed = new Histogram({
            name: "timeline_followers_processed",
            help: "Followers processed during a fan-out",
            buckets: [
                1,
                5,
                10,
                50,
                100,
                500,
                1000,
                5000,
                10000,
            ],
            registers: [this.registry],
        });
    }

    metrics() {
        return this.registry.metrics();
    }
}