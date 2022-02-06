import { Type } from 'class-transformer';
import { IsEnum, IsNumber, Min } from 'class-validator';

export class FeedRequestDto {
  @IsEnum(['recently', 'popularity'])
  order: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number;
}
