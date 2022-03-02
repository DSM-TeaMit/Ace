import { IsString, Length } from 'class-validator';

export class SearchUserRequestQueryDto {
  @IsString()
  @Length(2)
  name: string;
}
