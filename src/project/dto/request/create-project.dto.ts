import { Type } from 'class-transformer';
import {
  IsEnum,
  IsString,
  IsUUID,
  Length,
  ValidateNested,
} from 'class-validator';

class Member {
  @IsUUID('4')
  uuid: string;

  @IsString()
  @Length(1, 20)
  role: string;
}

export class CreateProjectRequestDto {
  @IsString()
  @Length(1, 45)
  name: string;

  @IsString()
  @Length(1, 20)
  field: string;

  @IsEnum(['PERS', 'TEAM', 'CLUB'])
  type: 'PERS' | 'TEAM' | 'CLUB';

  @IsString()
  @Length(1, 20)
  role: string;

  @ValidateNested()
  @Type(() => Member)
  members: Member[];
}
