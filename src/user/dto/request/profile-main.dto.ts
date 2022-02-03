import { IsOptional, IsUUID } from 'class-validator';

export class ProfileMainRequestDto {
  @IsUUID('4')
  @IsOptional()
  uuid?: string;
}
