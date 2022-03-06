import { IsEnum, IsString } from 'class-validator';
import { FeedRequestDto } from './feed.dto';

export class SearchRequestDto extends FeedRequestDto {
  @IsString()
  keyword: string;
}

export class SearchTypeRequestDto extends SearchRequestDto {
  @IsEnum(['projectName', 'memberName'])
  searchBy: 'projectName' | 'memberName';
}
