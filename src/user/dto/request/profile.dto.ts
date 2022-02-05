import { IsOptional, IsUUID } from 'class-validator';

export class ProfileRequestDto {
  @IsUUID('4')
  @IsOptional()
  uuid?: string;
}
