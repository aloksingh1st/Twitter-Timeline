import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    authorId: string;
    @IsString()
    @IsNotEmpty()
    @MaxLength(280)
    content: string;
};
