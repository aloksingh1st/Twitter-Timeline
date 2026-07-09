import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { UpdateTimelineDto } from './dto/update-timeline.dto';

import { PrismaService } from 'src/prisma/prisma.service';
import { TimelineQueryDto } from './dto/timeline-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) { }

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

    // 2. Fetch followees
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      select: {
        followeeId: true,
      },
    });

    const followeeIds = follows.map(f => f.followeeId);

    // 3. User follows nobody
    if (followeeIds.length === 0) {
      return {
        posts: [],
        nextCursor: null,
      };
    }

    // 4. Build where clause
    const where: Prisma.PostWhereInput = {
      authorId: {
        in: followeeIds,
      },
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
          id: {
            lt: cursorId,
          },
        },
      ];
    }

    // 5. Fetch one extra row
    const posts = await this.prisma.post.findMany({
      where,
      orderBy: [
        {
          createdAt: 'desc',
        },
        {
          id: 'desc',
        },
      ],
      take: limit + 1,
    });

    // 6. Determine if another page exists
    const hasNextPage = posts.length > limit;

    if (hasNextPage) {
      posts.pop();
    }

    // 7. Generate next cursor
    let nextCursor: { cursorCreatedAt: string; cursorId: string } | null = null;

    if (hasNextPage) {
      const lastPost = posts[posts.length - 1];

      nextCursor = {
        cursorCreatedAt: lastPost.createdAt.toISOString(),
        cursorId: lastPost.id,
      };
    }

    return {
      posts,
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
}
