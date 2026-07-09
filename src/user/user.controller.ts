import {
    BadRequestException,
    Controller,
    Body,
    Param,
    Post,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        return this.userService.create(createUserDto);
    }


    @Post(':id/follow/:targetId')
    async follow(
        @Param('id') id: string,
        @Param('targetId') targetId: string,
    ) {
        if (id === targetId) {
            throw new BadRequestException('Users cannot follow themselves');
        }

        return this.userService.follow(id, targetId);
    }
}