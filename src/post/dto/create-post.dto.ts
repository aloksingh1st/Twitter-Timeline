import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    authorId: string;
    @IsString()
    @IsNotEmpty()
    @Matches(/\S/, {
        message: 'content must contain at least one non-whitespace character',
    })
    @MaxLength(280)
    content: string;
};
