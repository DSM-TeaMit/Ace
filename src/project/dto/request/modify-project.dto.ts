import { Type } from 'class-transformer';
import { IsString, IsUUID, Length, ValidateNested } from 'class-validator';

export class ModifyProjectRequestDto {
  @IsString()
  @Length(1, 45)
  name: string;

  @IsString()
  @Length(0, 250)
  description: string;

  @IsString()
  @Length(0, 250)
  field: string;
}

class Member {
  @IsUUID('4')
  uuid: string;

  @IsString()
  @Length(1, 20)
  role: string;
}

export class ModifyMemberRequestDto {
  @IsString()
  @Length(1, 20)
  role: string;

  @ValidateNested()
  @Type(() => Member)
  members: Member[];
}
