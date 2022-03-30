import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum } from 'class-validator';

export class ConfirmProjectQueryDto {
  @IsEnum(['plan', 'report'])
  type: 'plan' | 'report';

  @IsBoolean()
  @Transform(({ value }) =>
    new Map([
      ['undefined', undefined],
      ['true', true],
      ['false', false],
    ]).get(value),
  )
  value: boolean;
}
