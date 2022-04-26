import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetArchiveQueryDto {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    new Map([
      ['undefined', undefined],
      ['true', true],
      ['false', false],
    ]).get(value),
  )
  dry?: boolean;
}
