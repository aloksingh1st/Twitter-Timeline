import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PrismaService } from '../../src/prisma/prisma.service';
// import { KafkaService } from 'src/kafka/kafka.service';
import { KafkaService } from "../kafka/kafka.service"

@Injectable()
export class PostService {


  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService) { }

  async create(dto: CreatePostDto) {
    const author = await this.prisma.user.findUnique({
      where: {
        id: dto.authorId,
      },
    });

    if (!author) {
      throw new NotFoundException('Author not found');
    }

    const post = await this.prisma.post.create({
      data: {
        authorId: dto.authorId,
        content: dto.content,
      },
    });


    await this.kafka.publish("post-created", {
      postId: post.id,
      authorId: post.authorId,
      createdAt: post.createdAt,
    });


    return post;
  }

  findAll() {
    return `This action returns all post`;
  }

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
