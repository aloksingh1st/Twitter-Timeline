import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, Max, Min } from "class-validator";

export class TimelineQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit = 20;

    @IsOptional()
    @IsDateString()
    cursorCreatedAt?: string;

    @IsOptional()
    @Type(() => String)
    @IsInt()
    cursorId?: string;
}