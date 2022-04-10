import { OmitType } from '@nestjs/mapped-types';
import { IsEnum, IsString, Length } from 'class-validator';
import { FeedRequestDto } from './feed.dto';

export class SearchRequestDto extends OmitType(FeedRequestDto, ['order']) {
  @IsString()
  @Length(1)
  keyword: string;
}

export class SearchTypeRequestDto extends SearchRequestDto {
  @IsEnum(['projectName', 'memberName'])
  searchBy: 'projectName' | 'memberName';
}
