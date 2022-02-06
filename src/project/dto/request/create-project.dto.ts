import { Type } from 'class-transformer';
import { IsEnum, IsString, IsUUID, ValidateNested } from 'class-validator';

class Member {
  @IsUUID('4')
  uuid: string;

  @IsString()
  role: string;
}

export class CreateProjectRequestDto {
  @IsString()
  name: string;

  @IsString()
  field: string;

  @IsEnum(['PERS', 'TEAM', 'CLUB'])
  type: 'PERS' | 'TEAM' | 'CLUB';

  @ValidateNested()
  @Type(() => Member)
  members: Member[];
}
