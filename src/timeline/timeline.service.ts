import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { UpdateTimelineDto } from './dto/update-timeline.dto';

import { PrismaService } from '../../src/prisma/prisma.service';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { Prisma } from '@prisma/client';
import Redis from 'ioredis';
import { MetricsService } from 'src/metrics/metrics.service';
import { PostCreatedEvent } from 'src/kafka/post-created.event';

@Injectable()
export class TimelineService {
  private readonly logger = new Logger(TimelineService.name);


  constructor(private readonly prisma: PrismaService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly metrics: MetricsService,
  ) { }

  create(createTimelineDto: CreateTimelineDto) {
    return 'This action adds a new timeline';
  }

  async findAll(userId: string, query: TimelineQueryDto) {
    const {
      limit = 20,
      cursorCreatedAt,
      cursorId,
    } = query;

    // 1. Validate user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Build cursor condition
    const where: Prisma.TimelineFeedWhereInput = {
      userId,
    };

    if (cursorCreatedAt && cursorId) {
      where.OR = [
        {
          createdAt: {
            lt: new Date(cursorCreatedAt),
          },
        },
        {
          createdAt: new Date(cursorCreatedAt),
          postId: {
            lt: cursorId,
          },
        },
      ];
    }

    // 3. Read from TimelineFeed
    const timeline = await this.prisma.timelineFeed.findMany({
      where,
      include: {
        post: {
          include: {
            author: true,
          },
        },
      },
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          postId: 'desc',
        },
      ],
      take: limit + 1,
    });

    // 4. Pagination
    const hasNextPage = timeline.length > limit;

    if (hasNextPage) {
      timeline.pop();
    }

    // 5. Next cursor
    let nextCursor: {
      cursorCreatedAt: string;
      cursorId: string;
    } | null = null;

    if (hasNextPage) {
      const last = timeline[timeline.length - 1];

      nextCursor = {
        cursorCreatedAt: last.createdAt.toISOString(),
        cursorId: last.postId,
      };
    }

    return {
      posts: timeline.map((item) => item.post),
      nextCursor,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} timeline`;
  }

  update(id: number, updateTimelineDto: UpdateTimelineDto) {
    return `This action updates a #${id} timeline`;
  }

  remove(id: number) {
    return `This action removes a #${id} timeline`;
  }

  async fanOutPost(event: PostCreatedEvent): Promise<void> {
    this.logger.log(
      `Starting fan-out for post ${event.postId}`,
    );

    // Find all followers of the author
    const followers = await this.prisma.follow.findMany({
      where: {
        followeeId: event.authorId,
      },
      select: {
        followerId: true,
      },
    });

    // Optional: include the author's own timeline
    const timelineEntries = [
      {
        userId: event.authorId,
        postId: event.postId,
      },
      ...followers.map((follower) => ({
        userId: follower.followerId,
        postId: event.postId,
      })),
    ];

    if (timelineEntries.length === 0) {
      this.logger.warn(
        `No followers found for author ${event.authorId}`,
      );
      return;
    }

    await this.prisma.timelineFeed.createMany({
      data: timelineEntries,
      skipDuplicates: true,
    });

    this.logger.log(
      `Fan-out completed. Inserted ${timelineEntries.length} timeline entries.`,
    );
  }
}


// TimelineFeed table created.
//  TimelineConsumer consumes post-created events.
//  TimelineService.fanOutPost() bulk-inserts feed entries.

//  Timeline endpoint reads from TimelineFeed instead of reconstructing timelines.
//  Benchmarks comparing fan-out-on-read vs. fan-out-on-write.
//  Grafana panels showing Kafka consumer activity and fan-out performance.
