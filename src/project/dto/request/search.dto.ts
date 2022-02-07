import { IsString } from 'class-validator';
import { FeedRequestDto } from './feed.dto';

export class SearchRequestDto extends FeedRequestDto {
  @IsString()
  keyword: string;
}
