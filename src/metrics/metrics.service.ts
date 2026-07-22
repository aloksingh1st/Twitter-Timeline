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
    }

    metrics() {
        return this.registry.metrics();
    }
}