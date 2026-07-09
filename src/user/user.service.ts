import {
    BadRequestException,
    ConflictException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createUserDto: CreateUserDto) {
        try {
            return await this.prisma.user.create({
                data: {
                    username: createUserDto.username,
                },
            });
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException('Username already exists');
            }

            throw error;
        }
    }

    async follow(followerId: string, followeeId: string) {
        if (followerId === followeeId) {
            throw new BadRequestException(
                'Users cannot follow themselves',
            );
        }

        const [follower, followee] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: followerId },
            }),
            this.prisma.user.findUnique({
                where: { id: followeeId },
            }),
        ]);

        if (!follower) {
            throw new NotFoundException('Follower not found');
        }

        if (!followee) {
            throw new NotFoundException('Followee not found');
        }

        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.follow.create({
                    data: {
                        followerId,
                        followeeId,
                    },
                });

                await tx.user.update({
                    where: {
                        id: followeeId,
                    },
                    data: {
                        followerCount: {
                            increment: 1,
                        },
                    },
                });
            });

            return {
                message: 'Followed successfully',
            };
        } catch (error) {
            if (
                error instanceof PrismaClientKnownRequestError &&
                error.code === 'P2002'
            ) {
                throw new ConflictException(
                    'Already following this user',
                );
            }

            throw error;
        }
    }
}