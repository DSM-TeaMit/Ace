import { Type } from 'class-transformer';
import { IsString, IsUUID, ValidateNested } from 'class-validator';

export class ModifyProjectRequestDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  field: string;
}

class Member {
  @IsUUID('4')
  uuid: string;

  @IsString()
  role: string;
}

export class ModifyMemberRequestDto {
  @ValidateNested()
  @Type(() => Member)
  members: Member[];
}
