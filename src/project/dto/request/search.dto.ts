import { IsEnum, IsString, Length } from 'class-validator';
import { FeedRequestDto } from './feed.dto';

export class SearchRequestDto extends FeedRequestDto {
  @IsString()
  @Length(1)
  keyword: string;
}

export class SearchTypeRequestDto extends SearchRequestDto {
  @IsEnum(['projectName', 'memberName'])
  searchBy: 'projectName' | 'memberName';
}
