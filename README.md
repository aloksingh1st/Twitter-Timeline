# Twitter Timeline Service

An event-driven, high-performance, and scalable timeline feed microservice built with **NestJS**, **PostgreSQL**, **Prisma**, **Redis**, and **Kafka**. It is fully instrumented for observability using **Prometheus** and **Grafana**.

This service implements a transition from **Fan-out on Read** to **Fan-out on Write** to support high-throughput write and low-latency read operations, matching the architectural patterns used by large-scale social networks.

---

## 🏗️ System Architecture

The service uses an asynchronous, event-driven pattern for timeline generation (Fan-out on Write). 

```mermaid
graph TD
    Client[Client / Web / Mobile App]
    API[NestJS API Instance]
    DB[(PostgreSQL Database)]
    Redis[(Redis Cache)]
    Kafka{Kafka Message Broker}
    Prometheus[Prometheus Server]
    Grafana[Grafana Dashboards]

    %% Interactions
    Client -->|1. Create Post / Follow / Read Timeline| API
    API -->|2. Read / Write Data| DB
    API -->|3. Cache Hits/Misses / Followers| Redis
    API -->|4. Publish 'post-created'| Kafka
    Kafka -->|5. Consume 'post-created'| API
    API -->|6. Bulk Insert Timeline Entries| DB
    
    %% Monitoring
    Prometheus -->|Scrape Metrics /metrics| API
    Grafana -->|Query Dashboard Data| Prometheus
```

---

## ⚡ Event Flow & Sequences

### 1. Post Creation & Fan-out on Write
When a user publishes a post, the API saves the post to PostgreSQL and publishes a `post-created` event to Kafka. The timeline consumer picks up this event asynchronously and inserts the post ID into the timeline feed of all the author's followers.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as NestJS Post Service
    participant DB as PostgreSQL DB
    participant Kafka as Kafka Broker
    participant Consumer as NestJS Timeline Consumer
    participant TimelineSvc as NestJS Timeline Service

    Client->>API: POST /posts { authorId, content }
    API->>DB: Insert Post
    DB-->>API: Post Object (postId)
    API->>Kafka: Publish "post-created" { postId, authorId, createdAt }
    API-->>Client: 201 Created (Post Object)
    
    Note over Kafka, Consumer: Asynchronous Processing
    Kafka->>Consumer: Emit "post-created" Event
    Consumer->>TimelineSvc: fanOutPost(event)
    TimelineSvc->>DB: Fetch Followers (where followeeId = authorId)
    DB-->>TimelineSvc: List of followerIds
    TimelineSvc->>DB: createMany() TimelineFeed entries (skipDuplicates: true)
    TimelineSvc-->>Consumer: Fan-out Completed
```

### 2. Timeline Retrieval (Reads)
Timeline reads are extremely fast because they read from a pre-materialized `TimelineFeed` table indexed by `userId` and `createdAt DESC`. This avoids executing heavy SQL joins or `IN` subqueries on the fly.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as NestJS Timeline Controller
    participant Service as NestJS Timeline Service
    participant DB as PostgreSQL DB

    Client->>API: GET /timeline/:userId?limit=20&cursorId=...&cursorCreatedAt=...
    API->>Service: findAll(userId, queryParams)
    Service->>DB: Check if User Exists
    DB-->>Service: User exists
    Service->>DB: Query TimelineFeed table where userId = :userId (cursor pagination)
    DB-->>Service: Page of TimelineFeed entries (with Post & Author nested)
    Service-->>API: Map to Posts list & compute nextCursor
    API-->>Client: 200 OK { posts: [...], nextCursor: {...} }
```

---

## 📁 Directory Structure

```
twitter-timeline/
├── benchmarks/              # Performance load testing scripts
│   ├── autocannon/          # Autocannon test configurations (Posts, Follows, Timelines)
│   └── results/             # Local benchmark output logs (JSON)
├── monitoring/              # Infrastructure observability configs
│   ├── prometheus/          # Prometheus server configurations
│   └── grafana/             # Grafana provisioning configurations and JSON dashboards
├── prisma/                  # Prisma schema, migrations, and seeding scripts
│   ├── migrations/          # Database migrations history
│   ├── seed/                # Modular seeding scripts (Celebrities, Normal, Power profiles)
│   └── schema.prisma        # Database entities and relational definitions
├── src/                     # Core NestJS application
│   ├── bootstrap/           # NestJS global bootstrapping settings
│   ├── follow/              # User relationship and follower count updates
│   ├── post/                # Post creation and Kafka event dispatching
│   ├── timeline/            # Fan-out on Write and timeline retrieval logic
│   ├── kafka/               # Kafka module, client service, and event consumers
│   ├── redis/               # Shared Redis client connection module
│   ├── metrics/             # Prometheus custom application instrumentation
│   ├── prisma/              # PrismaService NestJS wrapper
│   └── app.module.ts        # Roots application composition module
└── test/                    # Integration and E2E testing
    ├── helpers/             # Test apps builders and database cleanups
    └── integration/         # Integration specs (Timeline, Follows, Posts, Users)
```

---

## 📊 Observability (Prometheus & Grafana)

The application exports rich Prometheus metrics via the `/metrics` endpoint, backed by a dedicated NestJS Interceptor.

### Exposed Metrics

*   **HTTP Metrics**:
    *   `http_requests_total`: Total HTTP requests partitioned by `method`, `route`, and `status`.
    *   `http_request_duration_seconds`: Response latency histogram.
    *   `http_requests_in_flight`: Active gauge of ongoing HTTP requests.
*   **Redis Cache Metrics**:
    *   `redis_cache_hits_total` / `redis_cache_misses_total`
*   **Kafka Event Metrics**:
    *   `kafka_events_published_total` / `kafka_events_consumed_total`
    *   `kafka_publish_failures_total` / `kafka_consumer_failures_total`
*   **Timeline Fan-out Metrics**:
    *   `timeline_fanout_total`: Total fan-out pipeline executions.
    *   `timeline_fanout_failures_total`: Total fan-out pipeline errors.
    *   `timeline_fanout_duration_seconds`: Histogram of fan-out task execution time.
    *   `timeline_followers_processed`: Distribution of followers processed per post.

### Grafana Dashboards & Screenshots

Pre-configured dashboard templates are provisioned inside `monitoring/grafana/dashboards/`. The metrics are visualized in Grafana to provide real-time operational insights:

#### 📊 Application Overview Dashboard
Monitors HTTP request rates, response status code distributions, average and tail latencies, and total requests in flight.
![Application Overview Dashboard](assets/images/application_overview.png)

#### 🗺️ Provisioned Grafana Dashboards
Overview of the operational monitoring suite deployed in Grafana.
![Grafana Dashboards List](assets/images/dashboards.png)

#### 📝 Timeline Feed Performance
Tracks the timeline fan-out execution time, successful fan-outs vs. failures, and the distribution of follower processing.
![Timeline Dashboard](assets/images/timeline_panel.png)

#### 🗄️ Database Performance Panel
Shows detailed telemetry on database read and write metrics, query frequencies, and timings.
![Database Dashboard](assets/images/db.png)

#### ⚡ Kafka Event Stream Dashboard
Monitors total event traffic, message serialization/deserialization times, production/consumption rates, and messaging errors.
![Kafka Dashboard](assets/images/kafka_dashboard.png)

#### 🔴 Redis Caching Dashboard
Visualizes Redis memory metrics, cache hit ratios, miss trends, and cached keys TTLs.
![Redis Dashboard](assets/images/redis_dasboard.png)

---

## 🛠️ Installation & Setup

### Prerequisites
Make sure you have the following installed on your machine:
*   Node.js (v18 or higher)
*   Docker & Docker Compose

### 1. Environment Configuration
Create a `.env` file in the root directory (based on `.env` settings):
```env
DATABASE_URL="postgresql://alok:alok@localhost:5421/timeline?schema=public"
POSTGRES_DB="timeline"
POSTGRES_USER="alok"
POSTGRES_PASSWORD="alok"
REDIS_HOST="localhost"
REDIS_PORT=6379
KAFKA_CLIENT_ID="twitter-timeline"
KAFKA_BROKER="localhost:9092"
```

Configure a corresponding `.env.test` for running unit/E2E test suites on a separate test database.

### 2. Start Services (Docker Compose)
Spins up PostgreSQL, Redis, Kafka, Prometheus, and Grafana:
```bash
docker compose up -d
```

### 3. Database Migration & Seeding
Apply database schema migrations and seed dummy data using Prisma:
```bash
# Apply schema migrations
npx prisma migrate dev

# Seed with default SMALL profile (100 users, 2 celebrities, 8 power users)
npx prisma db seed

# Seed using alternative data sizes (MEDIUM, LARGE, or XLARGE)
npx prisma db seed -- --profile=MEDIUM
```

### 4. Running the Application
```bash
# Development mode
npm run start:dev

# Production build and run
npm run build
npm run start:prod
```

---

## 🧪 Testing & Verification

### Running Integration & E2E Tests
E2E tests run on a separate test DB. To prepare and run them:
```bash
# Run preparation (run migration on test DB)
npm run test:e2e:prepare

# Run all integration specs
npm run test:e2e
```

### Running Autocannon Benchmarks
Benchmark scripts load-test the API endpoints and write results JSON files into `benchmarks/results/`:
```bash
# Benchmark timeline endpoint
npm run bench:timeline

# Benchmark post creation endpoint
npm run bench:posts

# Benchmark follow endpoint
npm run bench:follow
```

---

## 🗺️ Project Roadmap & Future Expansion

This service is structured into modular development phases. Phases 1 to 7 have been successfully completed.

```mermaid
graph TD
    %% Completed Phases
    P1[✅ Phase 1: Foundation] --> P2[✅ Phase 2: Fan-out on Read]
    P2 --> P3[✅ Phase 3: Performance Benchmarks]
    P3 --> P4[✅ Phase 4: Redis Infrastructure & Cache]
    P4 --> P5[✅ Phase 5: Prometheus & Grafana]
    P5 --> P6[✅ Phase 6: Kafka Message Broker]
    P6 --> P7[✅ Phase 7: Fan-out on Write]

    %% Next Phases
    P7 --> P8[🚀 Phase 8: Reliability & DLQ]
    P8 --> P9[🚀 Phase 9: Compare Read/Write Benchmarks]
    P9 --> P10[🚀 Phase 10: Horizontal Scaling]
    P10 --> P11[🚀 Phase 11: Timeline Cache in Redis]
    
    %% Side/Independent Expansions
    P11 --> P12[🚀 Phase 12: Notification Service]
    P11 --> P13[🚀 Phase 13: Analytics Service]
    P11 --> P14[🚀 Phase 14: Search Service]
    
    %% Operationalization
    P12 & P13 & P14 --> P15[🚀 Phase 15: OpenTelemetry Tracing]
    P15 --> P16[🚀 Phase 16: Kubernetes Deployments]
    P16 --> P17[🚀 Phase 17: CI/CD Pipelines]
    P17 --> P18[🚀 Phase 18: Repository Documentation]
```

### Future Phases Breakdown (Phase 8 onwards)

#### 🚀 Phase 8 — Reliability
*   **Retry Logic**: Implement exponential backoff for failed Kafka event processing.
*   **Dead Letter Queue (DLQ)**: Automatically route poisoned messages to a `post-created-dlq` topic and provide a manual or automated replay mechanism.
*   **Idempotency**: Maintain an event processing registry in Redis/Postgres to ensure each event is processed exactly once (de-duplication).
*   **Structured Logging**: Align errors with metrics (`kafka_consumer_failures_total`, `timeline_fanout_failures_total`).

#### 🚀 Phase 9 — Benchmarking
*   Compare system metrics between **Fan-out on Read** and **Fan-out on Write** models.
*   Generate automated reports analyzing throughput, database CPU/Memory usage, write amplification, and read latency under load.

#### 🚀 Phase 10 — Horizontal Scaling
*   Add partition key routing in Kafka (partition by `authorId` to ensure chronological post order for the same user is processed sequentially).
*   Deploy multiple consumer group instances of NestJS and monitor partition rebalancing.

#### 🚀 Phase 11 — Timeline Cache
*   Introduce Redis Sorted Sets (`ZADD`) to store pre-materialized timeline feeds.
*   Provide cache invalidation strategies for active users vs. stale/inactive users.

#### 🚀 Phase 12 to 14 — Supporting Services
*   **Notification Service**: A separate microservice consuming the `post-created` and `follow-created` topics to issue likes/mentions/follow notifications.
*   **Analytics Service**: Dedicated ingestion pipeline to calculate timeline reads, daily active users (DAUs), and post engagement metrics.
*   **Search Service**: ElasticSearch / OpenSearch integration to index and expose user search and full-text keyword post searching.

#### 🚀 Phase 15 to 18 — Operations
*   **OpenTelemetry**: Trace propagation across NestJS, Kafka, and PostgreSQL, visualized in Grafana Tempo / Jaeger.
*   **Kubernetes**: Helm charts or K8s manifests for NestJS HPA (Horizontal Pod Autoscaler), Kafka cluster, Redis cluster, and monitoring stack.
*   **CI/CD**: GitHub Actions building optimized multi-stage Docker images and deploying to Kubernetes environments.
