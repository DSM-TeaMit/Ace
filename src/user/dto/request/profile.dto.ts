import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class ProfileRequestDto {
  @IsUUID('4')
  @IsOptional()
  uuid?: string;
}

export class ProfileRequestQueryDto {
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit: number;
}