import { IsString, Length } from 'class-validator';

export class SearchUserRequestQueryDto {
  @IsString()
  @Length(1)
  name: string;
}
